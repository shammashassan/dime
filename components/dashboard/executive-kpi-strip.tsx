import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react"
import { MetricCard } from "@/components/ui/metric-card"
import { formatCurrency, cn } from "@/lib/utils"

export interface ExecutiveKpiStripProps {
  netWorth: number
  monthlyInflow: number
  monthlyOutflow: number
  currency: string
  className?: string
}

export function ExecutiveKpiStrip({
  netWorth,
  monthlyInflow,
  monthlyOutflow,
  currency,
  className,
}: ExecutiveKpiStripProps) {
  const netCashFlow = monthlyInflow - monthlyOutflow
  const savingsRate = monthlyInflow > 0 ? Math.round((netCashFlow / monthlyInflow) * 100) : 0
  const isPositiveCashFlow = netCashFlow >= 0

  const items = [
    {
      title: "Total Net Worth",
      value: formatCurrency(netWorth, currency),
      subtext: "Combined liquid & asset equity",
      href: "/net-worth",
      icon: Wallet,
      color: "#10b981",
      valueClassName: undefined,
    },
    {
      title: "Monthly Cash Flow",
      value: `${netCashFlow > 0 ? "+" : ""}${formatCurrency(netCashFlow, currency)}`,
      subtext: `${formatCurrency(monthlyInflow, currency)} in · ${formatCurrency(monthlyOutflow, currency)} out`,
      href: "/reports",
      icon: isPositiveCashFlow ? TrendingUp : TrendingDown,
      color: isPositiveCashFlow ? "#10b981" : "#f43f5e",
      valueClassName: isPositiveCashFlow ? "text-emerald-500" : "text-rose-500",
    },
    {
      title: "Savings Rate",
      value: `${savingsRate}%`,
      subtext: "Target 20%+",
      href: "/health",
      icon: PiggyBank,
      color: "#3b82f6",
      valueClassName: savingsRate >= 20 ? "text-emerald-500" : undefined,
    },
  ]

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 w-full", className)}>
      {items.map((item) => (
        <MetricCard
          key={item.title}
          className="bento-tile"
          style={{ minWidth: 0 }}
          icon={item.icon}
          color={item.color}
          label={item.title}
          value={item.value}
          subtext={item.subtext}
          valueClassName={item.valueClassName}
          href={item.href}
          aria-label={`${item.title}: ${item.value}`}
        />
      ))}
    </div>
  )
}

