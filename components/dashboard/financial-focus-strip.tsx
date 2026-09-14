import Link from "next/link"
import { AlertCircle, CalendarClock, HandCoins, Bell, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { DashboardFocusCounts } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"

export interface FinancialFocusStripProps {
  counts: DashboardFocusCounts
}

export function FinancialFocusStrip({ counts }: FinancialFocusStripProps) {
  const items = [
    {
      title: "Overdue Bills",
      count: counts.overdueBillsCount,
      subtext:
        counts.overdueBillsCount > 0
          ? `${formatCurrency(counts.overdueBillsAmount, counts.baseCurrency)} overdue`
          : "All paid up",
      href: "/recurring?tab=bills",
      icon: AlertCircle,
      alertColor:
        counts.overdueBillsCount > 0
          ? "text-rose-500 bg-rose-500/10 border-rose-500/20"
          : "text-muted-foreground bg-muted/30 border-border/50",
      active: counts.overdueBillsCount > 0,
    },
    {
      title: "Upcoming (7d)",
      count: counts.upcomingRenewalsCount,
      subtext: counts.upcomingRenewalsCount > 0 ? "Renewals & bills soon" : "None this week",
      href: "/recurring",
      icon: CalendarClock,
      alertColor:
        counts.upcomingRenewalsCount > 0
          ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
          : "text-muted-foreground bg-muted/30 border-border/50",
      active: counts.upcomingRenewalsCount > 0,
    },
    {
      title: "Loan Repayments",
      count: counts.pendingLoansCount,
      subtext: counts.pendingLoansCount > 0 ? "Due or pending" : "No dues pending",
      href: "/loans",
      icon: HandCoins,
      alertColor:
        counts.pendingLoansCount > 0
          ? "text-violet-500 bg-violet-500/10 border-violet-500/20"
          : "text-muted-foreground bg-muted/30 border-border/50",
      active: counts.pendingLoansCount > 0,
    },
    {
      title: "Inbox Alerts",
      count: counts.unreadNotificationsCount,
      subtext: counts.unreadNotificationsCount > 0 ? "Unread notifications" : "Inbox cleared",
      href: "/notifications",
      icon: Bell,
      alertColor:
        counts.unreadNotificationsCount > 0
          ? "text-blue-500 bg-blue-500/10 border-blue-500/20"
          : "text-muted-foreground bg-muted/30 border-border/50",
      active: counts.unreadNotificationsCount > 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.title}
            href={item.href}
            aria-label={`${item.title}: ${item.count} (${item.subtext})`}
            className="group/focus block select-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="bento-tile flex flex-row items-center justify-between p-3.5 border-border/50 bg-card/60 shadow-xs backdrop-blur-xs transition-all hover:bg-card hover:border-border hover:shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    item.alertColor
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold leading-none tracking-tight text-foreground">
                      {item.count}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 truncate">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {item.subtext}
                  </span>
                </div>
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/30 transition-transform group-hover/focus:translate-x-0.5 group-hover/focus:text-foreground" />
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
