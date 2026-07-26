import { getActiveRecurringRules } from "@/lib/queries/recurring"
import { getBillInstances } from "@/lib/queries/bills"
import { getCategories } from "@/lib/queries/categories"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, CreditCard, FileText, AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface UpcomingRecurringProps {
  userId: string
}

export async function UpcomingRecurring({ userId }: UpcomingRecurringProps) {
  const [rules, billInstances, categories] = await Promise.all([
    getActiveRecurringRules(userId),
    getBillInstances(),
    getCategories(userId)
  ])

  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]))
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // 1. Process Bill Instances
  // Filter for pending/overdue bill instances
  const upcomingBills = billInstances
    .filter((b) => b.status === "pending" || b.status === "overdue")
    .map((b) => {
      const isOverdue = b.status === "overdue" || new Date(b.dueDate) < now
      return {
        id: b._id.toString(),
        name: b.description,
        amount: b.expectedAmount || 0,
        currency: b.currency,
        date: new Date(b.dueDate),
        kind: "bill" as const,
        isOverdue,
        categoryId: b.ruleId ? rules.find(r => r._id.toString() === b.ruleId)?.categoryId : undefined
      }
    })

  // 2. Process Subscriptions from Recurring Rules
  // Subscriptions are active rules of kind "subscription"
  // If a subscription doesn't have a billInstance, we show its nextRenewalDate/nextDueDate
  const upcomingSubscriptions = rules
    .filter((r) => r.kind === "subscription" && r.isActive && r.status !== "cancelled" && r.status !== "expired")
    .map((r) => {
      const date = r.nextRenewalDate ? new Date(r.nextRenewalDate) : r.nextDueDate ? new Date(r.nextDueDate) : undefined
      if (!date) return null

      // Check if we already have an upcoming bill instance for this rule to avoid duplicates
      const hasBillInstance = upcomingBills.some(b => b.id === r._id.toString())
      if (hasBillInstance) return null

      const isOverdue = date < now

      return {
        id: r._id.toString(),
        name: r.description,
        amount: r.amount,
        currency: r.currency,
        date,
        kind: "subscription" as const,
        isOverdue,
        categoryId: r.categoryId
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  // Combine and sort chronologically
  const allUpcoming = [...upcomingBills, ...upcomingSubscriptions]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5) // Limit to top 5

  const getRelativeDateStr = (date: Date) => {
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    if (diffDays > 1) return `in ${diffDays} days`
    return `${Math.abs(diffDays)} days overdue`
  }

  return (
    <Card className="border border-border/40 shadow-xl bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            Upcoming Bills &amp; Subs
          </CardTitle>
          <CardDescription className="text-xs">Next upcoming payments and renewals</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs font-semibold">
          <Link href="/recurring">Manage</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {allUpcoming.length > 0 ? (
          <div className="flex flex-col gap-3">
            {allUpcoming.map((item) => {
              const category = item.categoryId ? categoryMap.get(item.categoryId) : undefined
              const accentColor = category?.color || "#94a3b8"
              const Icon = item.kind === "subscription" ? CreditCard : FileText

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="size-8.5 rounded-xl flex items-center justify-center shrink-0 border border-border/50"
                      style={{
                        backgroundColor: `${accentColor}15`,
                        color: accentColor,
                      }}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate max-w-[120px] sm:max-w-[150px]">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        {item.isOverdue ? (
                          <AlertTriangle className="size-3 text-rose-500 shrink-0" />
                        ) : (
                          <Clock className="size-3 text-muted-foreground/60 shrink-0" />
                        )}
                        <span className={item.isOverdue ? "text-rose-500 font-semibold" : ""}>
                          {getRelativeDateStr(item.date)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-foreground">
                      {formatCurrency(item.amount, item.currency)}
                    </p>
                    <Badge
                      variant="outline"
                      className="rounded-full px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider h-3.5 mt-1 bg-muted/40 text-muted-foreground border-border/60"
                    >
                      {item.kind}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground text-sm gap-2">
            <p>No upcoming payments.</p>
            <p className="text-xs text-muted-foreground/80">Your recurring schedule is all caught up!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
