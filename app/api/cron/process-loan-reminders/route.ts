import { NextResponse } from "next/server"
import { getCollection } from "@/lib/db/collections"
import { Loan } from "@/types"
import { createNotification } from "@/lib/actions/notifications"
import { formatCurrency } from "@/lib/utils"
import { startOfDay, differenceInCalendarDays, isBefore } from "date-fns"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  // 1. Verify cron secret (allow local bypass in development)
  const isDev = process.env.NODE_ENV === "development"
  if (!isDev) {
    const authHeader = request.headers.get("Authorization")
    const xCronSecret = request.headers.get("x-cron-secret")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return NextResponse.json(
        { error: "Cron secret is not configured on the server" },
        { status: 500 }
      )
    }

    const token = authHeader ? authHeader.replace("Bearer ", "") : ""
    const isAuthorized = token === cronSecret || xCronSecret === cronSecret

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const loansColl = await getCollection<Loan>("loans")
    const now = new Date()

    // 2. Fetch all loans that are not paid/cancelled and have due dates
    const loans = await loansColl
      .find({
        status: { $in: ["active", "partially_repaid", "overdue"] },
        dueDate: { $exists: true },
      })
      .toArray()

    let remindersSent = 0
    let statusUpdates = 0

    for (const loan of loans) {
      if (!loan.dueDate) continue

      const dueDate = new Date(loan.dueDate)
      const formattedAmount = formatCurrency(loan.remainingAmount, loan.currency)
      const sentReminders = loan.sentReminders || []
      let loanUpdated = false
      const updates: Partial<Loan> = {}

      // Calculate days difference
      // Positive means future due date, negative means past due date
      const daysUntilDue = differenceInCalendarDays(dueDate, now)

      // A. Check for upcoming / on-due-date reminders
      if (daysUntilDue >= 0 && loan.reminderSchedule) {
        for (const daysBefore of loan.reminderSchedule) {
          // If we are at or past the reminder offset (e.g. daysUntilDue <= daysBefore)
          // and we haven't sent this reminder yet
          if (daysUntilDue <= daysBefore && !sentReminders.includes(daysBefore)) {
            let title = ""
            let message = ""

            if (loan.type === "lent") {
              title = "Loan Repayment Reminder (Lent)"
              message = daysBefore === 0
                ? `${loan.personName} owes you ${formattedAmount}, which is due today.`
                : `${loan.personName} owes you ${formattedAmount}, due in ${daysUntilDue} days.`
            } else {
              title = "Loan Payment Due (Borrowed)"
              message = daysBefore === 0
                ? `You owe ${loan.personName} ${formattedAmount}, which is due today.`
                : `You owe ${loan.personName} ${formattedAmount}, due in ${daysUntilDue} days.`
            }

            // Create in-app notification
            await createNotification({
              userId: loan.userId,
              title,
              message,
              type: "loan_reminder",
              link: `/loans/${loan._id.toString()}`,
            })

            sentReminders.push(daysBefore)
            remindersSent++
            loanUpdated = true
          }
        }
        if (loanUpdated) {
          updates.sentReminders = sentReminders
        }
      }

      // B. Check for overdue transitions & reminders
      if (daysUntilDue < 0) {
        // Transition status to overdue if not already overdue
        if (loan.status !== "overdue") {
          updates.status = "overdue"
          statusUpdates++
          loanUpdated = true

          // Send immediate overdue alert
          let overdueTitle = ""
          let overdueMessage = ""
          if (loan.type === "lent") {
            overdueTitle = "Loan Overdue (Lent)"
            overdueMessage = `${loan.personName}'s payment of ${formattedAmount} is overdue.`
          } else {
            overdueTitle = "Loan Overdue (Borrowed)"
            overdueMessage = `Your payment of ${formattedAmount} to ${loan.personName} is overdue.`
          }

          await createNotification({
            userId: loan.userId,
            title: overdueTitle,
            message: overdueMessage,
            type: "loan_overdue",
            link: `/loans/${loan._id.toString()}`,
          })
        }

        // Send recurring overdue reminders (every 7 days)
        const lastOverdueSent = loan.lastOverdueReminderSentAt
          ? new Date(loan.lastOverdueReminderSentAt)
          : null
        
        const daysSinceLastReminder = lastOverdueSent
          ? differenceInCalendarDays(now, lastOverdueSent)
          : differenceInCalendarDays(now, dueDate) // if never sent, count from due date

        // Trigger weekly reminders
        if (!lastOverdueSent || daysSinceLastReminder >= 7) {
          let recTitle = "Overdue Loan Reminder"
          let recMessage = loan.type === "lent"
            ? `${loan.personName}'s payment of ${formattedAmount} is overdue by ${Math.abs(daysUntilDue)} days.`
            : `Your payment of ${formattedAmount} to ${loan.personName} is overdue by ${Math.abs(daysUntilDue)} days.`

          await createNotification({
            userId: loan.userId,
            title: recTitle,
            message: recMessage,
            type: "loan_overdue_recurring",
            link: `/loans/${loan._id.toString()}`,
          })

          updates.lastOverdueReminderSentAt = now
          remindersSent++
          loanUpdated = true
        }
      }

      // Save updates if any occurred
      if (loanUpdated) {
        await loansColl.updateOne(
          { _id: loan._id },
          {
            $set: {
              ...updates,
              updatedAt: now,
            },
            $inc: { version: 1 },
          }
        )
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      statusUpdates,
    })
  } catch (error: any) {
    console.error("Cron loan reminder check failed:", error)
    return NextResponse.json(
      { error: "Internal server error during reminder checking", details: error.message },
      { status: 500 }
    )
  }
}

// Support GET for browser testing in development
export async function GET(request: Request) {
  return POST(request)
}
