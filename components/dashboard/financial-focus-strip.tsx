import Link from "next/link"
import { AlertCircle, CalendarClock, HandCoins, Bell } from "lucide-react"
import { MetricCard } from "@/components/ui/metric-card"
import { DashboardFocusCounts } from "@/types"
import { formatCurrency } from "@/lib/utils"

export interface FinancialFocusStripProps {
  counts: DashboardFocusCounts
}

export function FinancialFocusStrip({ counts }: FinancialFocusStripProps) {
  const items = [
    {
      title: "Overdue Bills",
      value: counts.overdueBillsCount,
      subtext:
        counts.overdueBillsCount > 0
          ? `${formatCurrency(counts.overdueBillsAmount, counts.baseCurrency)} overdue`
          : "All paid up",
      href: "/recurring?tab=bills",
      icon: AlertCircle,
      color: "#f43f5e",
      valueClassName: counts.overdueBillsCount > 0 ? "text-rose-500" : undefined,
    },
    {
      title: "Upcoming (7d)",
      value: counts.upcomingRenewalsCount,
      subtext: counts.upcomingRenewalsCount > 0 ? "Renewals & bills soon" : "None this week",
      href: "/recurring",
      icon: CalendarClock,
      color: "#f59e0b",
      valueClassName: counts.upcomingRenewalsCount > 0 ? "text-amber-500" : undefined,
    },
    {
      title: "Loan Repayments",
      value: counts.pendingLoansCount,
      subtext: counts.pendingLoansCount > 0 ? "Due or pending" : "No dues pending",
      href: "/loans",
      icon: HandCoins,
      color: "#8b5cf6",
      valueClassName: counts.pendingLoansCount > 0 ? "text-violet-500" : undefined,
    },
    {
      title: "Inbox Alerts",
      value: counts.unreadNotificationsCount,
      subtext: counts.unreadNotificationsCount > 0 ? "Unread notifications" : "Inbox cleared",
      href: "/notifications",
      icon: Bell,
      color: "#3b82f6",
      valueClassName: counts.unreadNotificationsCount > 0 ? "text-blue-500" : undefined,
    },
  ]

  return (
    <div className="flex flex-wrap gap-4 w-full">
      {items.map((item) => (
        <MetricCard
          key={item.title}
          asChild
          className="bento-tile"
          icon={item.icon}
          color={item.color}
          label={item.title}
          value={item.value}
          subtext={item.subtext}
          valueClassName={item.valueClassName}
        >
          <Link
            href={item.href}
            aria-label={`${item.title}: ${item.value}`}
          />
        </MetricCard>
      ))}
    </div>
  )
}
