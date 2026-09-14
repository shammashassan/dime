import { ObjectId } from "mongodb"
import {
  loansCollection,
  recurringRulesCollection,
  budgetsCollection,
  transactionsCollection,
  notificationsCollection,
  getCollection
} from "@/lib/db/collections"
import { Loan, RecurringRule, Budget, Transaction, BillInstance, Notification } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { differenceInCalendarDays, startOfMonth, endOfMonth } from "date-fns"
import { revalidatePath, updateTag } from "next/cache"

/**
 * Creates an in-app notification directly in the DB if an identical one hasn't been created recently.
 */
async function createSyncNotification({
  userId,
  title,
  message,
  type,
  link,
  dedupKey,
  dedupWindowMs = 24 * 60 * 60 * 1000, // 24 hours default
}: {
  userId: string
  title: string
  message: string
  type: string
  link?: string
  dedupKey?: string
  dedupWindowMs?: number
}) {
  const now = new Date()

  if (dedupKey) {
    const cutoff = new Date(now.getTime() - dedupWindowMs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      userId,
      type,
      createdAt: { $gte: cutoff },
    }
    if (link) {
      filter.link = link
    }
    const existing = await notificationsCollection.findOne(filter)
    if (existing) {
      return null // Already alerted recently
    }
  }

  const doc: Notification = {
    _id: new ObjectId(),
    userId,
    title,
    message,
    type,
    link: link || undefined,
    createdAt: now,
    updatedAt: now,
  }

  await notificationsCollection.insertOne(doc)
  return doc
}

/**
 * Syncs and generates scheduled alerts for the active user:
 * 1. Loan due-date & overdue reminders (respects loan's configured reminderSchedule)
 * 2. Subscription renewals & trial expirations (respects reminderDaysBefore)
 * 3. Recurring bill due dates
 * 4. Active budget threshold and overspending warnings
 */
export async function syncUserAlerts(userId: string) {
  try {
    const now = new Date()
    let notificationsCreated = 0

    // ─────────────────────────────────────────────────────────────
    // 1. LOAN REMINDERS & OVERDUE NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────
    const activeLoans = await loansCollection
      .find({
        userId,
        status: { $in: ["active", "partially_repaid", "overdue"] },
        dueDate: { $exists: true },
      })
      .toArray()

    for (const loan of activeLoans) {
      if (!loan.dueDate) continue

      const dueDate = new Date(loan.dueDate)
      const remainingAmount = loan.remainingAmount ?? loan.amount
      const formattedAmount = formatCurrency(remainingAmount, loan.currency || "USD")
      const daysUntilDue = differenceInCalendarDays(dueDate, now)
      const sentReminders = loan.sentReminders || []
      let loanUpdated = false
      const loanUpdates: Partial<Loan> = {}

      // Check upcoming reminders according to configured schedule (e.g. [7, 3, 1, 0])
      if (daysUntilDue >= 0 && loan.reminderSchedule && loan.reminderSchedule.length > 0) {
        for (const daysBefore of loan.reminderSchedule) {
          if (daysUntilDue <= daysBefore && !sentReminders.includes(daysBefore)) {
            const isLent = loan.type === "lent"
            const title = isLent ? "Loan Repayment Reminder" : "Loan Payment Due"
            const dueText = daysBefore === 0 ? "is due today" : `is due in ${daysUntilDue} day(s)`
            const message = isLent
              ? `${loan.personName} owes you ${formattedAmount}, which ${dueText}.`
              : `Your payment of ${formattedAmount} to ${loan.personName} ${dueText}.`

            const created = await createSyncNotification({
              userId,
              title,
              message,
              type: "loan_reminder",
              link: `/loans/${loan._id.toString()}`,
              dedupKey: `loan-${loan._id}-${daysBefore}`,
            })

            if (created) notificationsCreated++
            sentReminders.push(daysBefore)
            loanUpdated = true
          }
        }
        if (loanUpdated) {
          loanUpdates.sentReminders = sentReminders
        }
      }

      // Check overdue reminders
      if (daysUntilDue < 0) {
        if (loan.status !== "overdue") {
          loanUpdates.status = "overdue"
          loanUpdated = true

          const isLent = loan.type === "lent"
          const title = isLent ? "Loan Overdue (Lent)" : "Loan Overdue (Borrowed)"
          const message = isLent
            ? `${loan.personName}'s payment of ${formattedAmount} is now overdue.`
            : `Your payment of ${formattedAmount} to ${loan.personName} is now overdue.`

          const created = await createSyncNotification({
            userId,
            title,
            message,
            type: "loan_overdue",
            link: `/loans/${loan._id.toString()}`,
            dedupKey: `loan-overdue-initial-${loan._id}`,
          })

          if (created) notificationsCreated++
        }

        // Weekly recurring overdue check (every 7 days)
        const lastOverdue = loan.lastOverdueReminderSentAt ? new Date(loan.lastOverdueReminderSentAt) : null
        const daysSinceLastReminder = lastOverdue
          ? differenceInCalendarDays(now, lastOverdue)
          : differenceInCalendarDays(now, dueDate)

        if (!lastOverdue || daysSinceLastReminder >= 7) {
          const isLent = loan.type === "lent"
          const title = "Overdue Loan Reminder"
          const overdueDays = Math.abs(daysUntilDue)
          const message = isLent
            ? `${loan.personName}'s payment of ${formattedAmount} is overdue by ${overdueDays} day(s).`
            : `Your payment of ${formattedAmount} to ${loan.personName} is overdue by ${overdueDays} day(s).`

          const created = await createSyncNotification({
            userId,
            title,
            message,
            type: "loan_overdue_recurring",
            link: `/loans/${loan._id.toString()}`,
            dedupKey: `loan-overdue-weekly-${loan._id}`,
            dedupWindowMs: 6 * 24 * 60 * 60 * 1000,
          })

          if (created) {
            notificationsCreated++
            loanUpdates.lastOverdueReminderSentAt = now
            loanUpdated = true
          }
        }
      }

      if (loanUpdated) {
        await loansCollection.updateOne(
          { _id: loan._id },
          { $set: { ...loanUpdates, updatedAt: now } }
        )
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. RECURRING BILLS & SUBSCRIPTION RENEWALS
    // ─────────────────────────────────────────────────────────────
    const recurringRules = await recurringRulesCollection
      .find({
        userId,
        isActive: true,
      })
      .toArray()

    const billInstancesColl = await getCollection<BillInstance>("bill_instances")

    for (const rule of recurringRules) {
      if (!rule.nextDueDate) continue
      const nextDue = new Date(rule.nextDueDate)

      // Bill is due check
      if (rule.kind === "bill" && nextDue <= now) {
        const existingBill = await billInstancesColl.findOne({
          ruleId: rule._id.toString(),
          dueDate: {
            $gte: new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate()),
            $lt: new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate() + 1),
          },
        })

        if (!existingBill) {
          const newBill: Omit<BillInstance, "_id"> = {
            userId: rule.userId,
            organizationId: rule.organizationId || null,
            ruleId: rule._id.toString(),
            description: rule.description,
            expectedAmount: rule.amount,
            currency: rule.currency,
            dueDate: nextDue,
            status: "pending",
            createdAt: now,
            updatedAt: now,
            version: 1,
          }
          await billInstancesColl.insertOne(newBill as BillInstance)

          const created = await createSyncNotification({
            userId,
            title: "Bill is Due",
            message: `Your bill for ${rule.description} (${formatCurrency(rule.amount, rule.currency)}) is now due.`,
            type: "bill_due",
            link: "/recurring",
            dedupKey: `bill-due-${rule._id}-${nextDue.toISOString().slice(0, 10)}`,
          })
          if (created) notificationsCreated++
        }
      }

      // Subscription renewals check
      if (rule.kind === "subscription") {
        // Free trial expiration
        if (rule.status === "trial" && rule.trialEndDate) {
          const trialEnd = new Date(rule.trialEndDate)
          if (trialEnd <= now) {
            await recurringRulesCollection.updateOne(
              { _id: rule._id },
              { $set: { status: "active", updatedAt: now } }
            )

            const created = await createSyncNotification({
              userId,
              title: "Free Trial Expired",
              message: `Your free trial for ${rule.description} has ended. You will now be charged on schedule.`,
              type: "subscription_trial_ended",
              link: "/recurring",
              dedupKey: `trial-ended-${rule._id}`,
            })
            if (created) notificationsCreated++
          }
        }

        // Upcoming renewal reminder (within reminderDaysBefore)
        const reminderDays = rule.reminderDaysBefore ?? 3
        if (reminderDays > 0) {
          const daysUntilRenewal = differenceInCalendarDays(nextDue, now)
          if (daysUntilRenewal > 0 && daysUntilRenewal <= reminderDays) {
            const created = await createSyncNotification({
              userId,
              title: "Upcoming Subscription Renewal",
              message: `Your subscription to ${rule.description} (${formatCurrency(rule.amount, rule.currency)}) will renew in ${daysUntilRenewal} day(s).`,
              type: "subscription_renewal",
              link: "/recurring",
              dedupKey: `sub-renewal-${rule._id}-${nextDue.toISOString().slice(0, 10)}`,
              dedupWindowMs: reminderDays * 24 * 60 * 60 * 1000,
            })
            if (created) notificationsCreated++
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. BUDGET SPENDING THRESHOLD ALERTS
    // ─────────────────────────────────────────────────────────────
    const activeBudgets = await budgetsCollection
      .find({
        userId,
        isActive: true,
      })
      .toArray()

    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)

    for (const budget of activeBudgets) {
      const budgetStart = budget.startDate ? new Date(budget.startDate) : currentMonthStart
      const budgetEnd = budget.endDate ? new Date(budget.endDate) : currentMonthEnd

      // Query expenses within budget scope & time period
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = {
        userId,
        type: "expense",
        date: { $gte: budgetStart, $lte: budgetEnd },
      }
      if (budget.categoryId) {
        query.$or = [{ categoryId: budget.categoryId }, { "splits.categoryId": budget.categoryId }]
      }
      if (budget.walletId) {
        query.walletId = budget.walletId
      }

      const txs = await transactionsCollection.find(query).toArray()
      const totalSpent = txs.reduce((sum: number, tx: Transaction) => sum + (tx.amount || 0), 0)

      if (budget.amount > 0) {
        const percentSpent = (totalSpent / budget.amount) * 100
        const threshold = budget.alertThreshold ?? 80

        if (percentSpent >= 100) {
          const overAmount = formatCurrency(totalSpent - budget.amount, budget.currency)
          const created = await createSyncNotification({
            userId,
            title: "Budget Exceeded! 🚨",
            message: `You have exceeded your ${budget.name} budget by ${overAmount} (${Math.round(percentSpent)}% spent).`,
            type: "budget_alert",
            link: `/budgets/${budget._id.toString()}`,
            dedupKey: `budget-exceeded-${budget._id}-${now.getFullYear()}-${now.getMonth()}`,
            dedupWindowMs: 14 * 24 * 60 * 60 * 1000, // alert once per 2 weeks
          })
          if (created) notificationsCreated++
        } else if (percentSpent >= threshold) {
          const created = await createSyncNotification({
            userId,
            title: `Budget Alert (${threshold}%) ⚠️`,
            message: `You've used ${Math.round(percentSpent)}% of your ${budget.name} budget (${formatCurrency(totalSpent, budget.currency)} of ${formatCurrency(budget.amount, budget.currency)}).`,
            type: "budget_alert",
            link: `/budgets/${budget._id.toString()}`,
            dedupKey: `budget-threshold-${budget._id}-${now.getFullYear()}-${now.getMonth()}`,
            dedupWindowMs: 14 * 24 * 60 * 60 * 1000,
          })
          if (created) notificationsCreated++
        }
      }
    }

    if (notificationsCreated > 0) {
      updateTag("notifications")
      revalidatePath("/notifications")
      revalidatePath("/", "layout")
    }

    return { success: true, notificationsCreated }
  } catch (err) {
    console.error("Error running syncUserAlerts:", err)
    return { success: false, error: err instanceof Error ? err.message : "Sync error" }
  }
}
