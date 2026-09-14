import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react"
import { Card } from "@/components/ui/card"
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

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {/* Card 1: Total Net Worth */}
      <Card className="bento-tile flex flex-col justify-between border-border/50 bg-card/60 p-4.5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            total net worth
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 flex flex-col">
          <span className="text-2xl font-black tracking-tight text-foreground">
            {formatCurrency(netWorth, currency)}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Combined liquid & asset equity
          </span>
        </div>
      </Card>

      {/* Card 2: Monthly Cash Flow */}
      <Card className="bento-tile flex flex-col justify-between border-border/50 bg-card/60 p-4.5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            monthly cash flow
          </span>
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-lg",
              isPositiveCashFlow
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-rose-500/10 text-rose-500"
            )}
          >
            {isPositiveCashFlow ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-col">
          <span
            className={cn(
              "text-2xl font-black tracking-tight",
              isPositiveCashFlow ? "text-emerald-500" : "text-rose-500"
            )}
          >
            {netCashFlow > 0 ? "+" : ""}
            {formatCurrency(netCashFlow, currency)}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {formatCurrency(monthlyInflow, currency)} in · {formatCurrency(monthlyOutflow, currency)} out
          </span>
        </div>
      </Card>

      {/* Card 3: Savings Rate */}
      <Card className="bento-tile flex flex-col justify-between border-border/50 bg-card/60 p-4.5 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            savings rate
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <PiggyBank className="size-3.5" />
          </div>
        </div>
        <div className="mt-2 flex flex-col">
          <span className="text-2xl font-black tracking-tight text-foreground">
            {savingsRate}%
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  savingsRate >= 20 ? "bg-emerald-500" : "bg-amber-500"
                )}
                style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              Target 20%+
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
