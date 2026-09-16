import { getActiveRecurringRules } from "@/lib/queries/recurring"
import { getBillInstances } from "@/lib/queries/bills"
import { getCategories } from "@/lib/queries/categories"
import { formatCurrency, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ItemGroup,
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item"
import { CalendarDays, CreditCard, FileText, AlertTriangle, Clock, ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface UpcomingRecurringProps {
  userId: string
  className?: string
}

export async function UpcomingRecurring({ userId, className }: UpcomingRecurringProps) {
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
        ruleId: b.ruleId,
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
        ruleId: r._id.toString(),
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
    <Card className={cn("flex h-full flex-col border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0", className)}>
      {/* Top compact micro-label header matching top dashboard cards */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            upcoming recurring
          </span>
          {allUpcoming.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground">
              {allUpcoming.length}
            </span>
          )}
        </div>
        <Link
          href="/recurring"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <span>Manage</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="p-4 flex-1">
        {allUpcoming.length > 0 ? (
          <ScrollArea className="h-48 sm:h-[216px] pr-3.5">
            <ItemGroup className="gap-2">
              {allUpcoming.map((item) => {
                const category = item.categoryId ? categoryMap.get(item.categoryId) : undefined
                const accentColor = category?.color || "#94a3b8"
                const Icon = item.kind === "subscription" ? CreditCard : FileText

                const targetId = item.ruleId || item.id
                const href = targetId ? `/recurring/${targetId}` : "/recurring"

                return (
                  <Item
                    key={item.id}
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-between p-2.5 rounded-xl border-border/30 bg-muted/20 hover:bg-muted/50 transition-colors flex-nowrap cursor-pointer no-underline group"
                  >
                    <Link href={href}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ItemMedia
                          className="size-8.5 rounded-xl flex items-center justify-center shrink-0 border border-border/50"
                          style={{
                            backgroundColor: `${accentColor}15`,
                            color: accentColor,
                          }}
                        >
                          <Icon className="size-4" />
                        </ItemMedia>
                        <ItemContent className="min-w-0 gap-0">
                          <ItemTitle className="text-xs font-bold text-foreground truncate max-w-[120px] sm:max-w-[150px] group-hover:text-primary transition-colors">
                            {item.name}
                          </ItemTitle>
                          <ItemDescription className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            {item.isOverdue ? (
                              <AlertTriangle className="size-3 text-rose-500 shrink-0" />
                            ) : (
                              <Clock className="size-3 text-muted-foreground/60 shrink-0" />
                            )}
                            <span className={item.isOverdue ? "text-rose-500 font-semibold" : ""}>
                              {getRelativeDateStr(item.date)}
                            </span>
                          </ItemDescription>
                        </ItemContent>
                      </div>
                      <ItemActions className="flex flex-col items-end shrink-0 text-right gap-0">
                        <p className="text-xs font-semibold text-foreground tabular-nums">
                          {formatCurrency(item.amount, item.currency)}
                        </p>
                        <Badge
                          variant="outline"
                          className="rounded-full px-1.5 py-0 text-[8px] font-bold uppercase tracking-wider h-3.5 mt-1 bg-muted/40 text-muted-foreground border-border/60"
                        >
                          {item.kind}
                        </Badge>
                      </ItemActions>
                    </Link>
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[168px] text-center text-muted-foreground text-sm gap-2">
            <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-1 shadow-xs">
              <CalendarDays className="size-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">No upcoming payments</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Your recurring schedule is all caught up!
            </p>
            <Link
              href="/recurring?new=true"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>Add recurring payment</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}
