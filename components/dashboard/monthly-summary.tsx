import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getIncomeExpenseTrend } from "@/lib/queries/reports"
import { getPreferences } from "@/lib/queries/preferences"
import { formatCurrency } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthlySummaryCardProps {
  userId: string
  className?: string
}

export async function MonthlySummary({ userId, className }: MonthlySummaryCardProps) {
  const trend = await getIncomeExpenseTrend(userId, 2)
  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"

  let thisMonth = { income: 0, expense: 0 }
  let lastMonth = { income: 0, expense: 0 }

  if (trend.length >= 2) {
    lastMonth = trend[trend.length - 2]
    thisMonth = trend[trend.length - 1]
  } else if (trend.length === 1) {
    thisMonth = trend[0]
  }

  const incomeDiff = thisMonth.income - lastMonth.income
  const expenseDiff = thisMonth.expense - lastMonth.expense

  const incomePercentChange = lastMonth.income > 0 ? (incomeDiff / lastMonth.income) * 100 : 0
  const expensePercentChange = lastMonth.expense > 0 ? (expenseDiff / lastMonth.expense) * 100 : 0

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {/* Income Summary */}
      <Card className="relative overflow-hidden bg-card border border-border/40 shadow-xl hover:shadow-2xl transition-all duration-300 group h-full flex flex-col gap-3 pb-0">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            Income This Month
          </CardDescription>
          <CardTitle className="text-2xl font-bold flex items-baseline gap-2">
            <span>{formatCurrency(thisMonth.income * 100, targetCurrency)}</span>
            {incomePercentChange !== 0 && (
              <span className={`flex items-center text-xs font-semibold ${incomePercentChange > 0 ? "text-emerald-500" : "text-destructive"}`}>
                {incomePercentChange > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {Math.abs(incomePercentChange).toFixed(1)}%
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end pb-6">
          <div className="mt-auto pt-3 border-t border-border/30 flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Trend:</span>
            <div className="flex flex-wrap gap-1.5">
              {/* Last Month Pill */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-secondary-foreground text-[11px] font-medium border border-border/30">
                <span className="text-[9px] text-muted-foreground uppercase font-bold">Last Month</span>
                <span>{formatCurrency(lastMonth.income * 100, targetCurrency)}</span>
              </div>
              {/* Change Pill */}
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                incomeDiff >= 0 
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" 
                  : "bg-destructive/10 border-destructive/25 text-destructive"
              )}>
                {incomeDiff >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                <span>{incomeDiff >= 0 ? "+" : ""}{formatCurrency(incomeDiff * 100, targetCurrency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Summary */}
      <Card className="relative overflow-hidden bg-card border border-border/40 shadow-xl hover:shadow-2xl transition-all duration-300 group h-full flex flex-col gap-3 pb-0">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500" />
            Expenses This Month
          </CardDescription>
          <CardTitle className="text-2xl font-bold flex items-baseline gap-2">
            <span>{formatCurrency(thisMonth.expense * 100, targetCurrency)}</span>
            {expensePercentChange !== 0 && (
              <span className={`flex items-center text-xs font-semibold ${expensePercentChange < 0 ? "text-emerald-500" : "text-destructive"}`}>
                {expensePercentChange > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {Math.abs(expensePercentChange).toFixed(1)}%
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end pb-6">
          <div className="mt-auto pt-3 border-t border-border/30 flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Trend:</span>
            <div className="flex flex-wrap gap-1.5">
              {/* Last Month Pill */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-secondary-foreground text-[11px] font-medium border border-border/30">
                <span className="text-[9px] text-muted-foreground uppercase font-bold">Last Month</span>
                <span>{formatCurrency(lastMonth.expense * 100, targetCurrency)}</span>
              </div>
              {/* Change Pill */}
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                expenseDiff <= 0 
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" 
                  : "bg-destructive/10 border-destructive/25 text-destructive"
              )}>
                {expenseDiff <= 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
                <span>{expenseDiff >= 0 ? "+" : ""}{formatCurrency(expenseDiff * 100, targetCurrency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
