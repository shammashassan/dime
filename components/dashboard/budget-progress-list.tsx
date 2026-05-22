import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getBudgetPerformance } from "@/lib/queries/reports"
import { getPreferences } from "@/lib/queries/preferences"
import { formatCurrency } from "@/lib/utils"
import { Target } from "lucide-react"

interface BudgetProgressListProps {
  userId: string
}

export async function BudgetProgressList({ userId }: BudgetProgressListProps) {
  const budgets = await getBudgetPerformance(userId)
  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"

  return (
    <Card className="border border-border/40 shadow-xl bg-card">
      <CardHeader className="flex flex-col items-start gap-1 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Target className="size-5 text-primary" />
          Active Budgets
        </CardTitle>
        <CardDescription className="text-xs">Current budget performance and spending</CardDescription>
      </CardHeader>
      <CardContent>
        {budgets.length > 0 ? (
          <div className="flex flex-col gap-4">
            {budgets.map((b) => {
              const percent = b.limit > 0 ? (b.spent / b.limit) * 100 : 0

              return (
                <div key={b.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{b.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{b.category}</span>
                    </div>
                    <span className="font-mono text-muted-foreground">
                      <strong className="text-foreground">{formatCurrency(b.spent, targetCurrency)}</strong>
                      {" / "}
                      {formatCurrency(b.limit, targetCurrency)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(percent, 100)}
                    className={`h-2.5 rounded-full ${
                      percent > 90
                        ? "[&>div]:bg-rose-500"
                        : percent >= 70
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-emerald-500"
                    }`}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span>{percent.toFixed(0)}% Used</span>
                    {percent > 100 && (
                      <span className="text-rose-500 font-bold">Over Budget!</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground text-sm gap-2">
            <p>No active budgets.</p>
            <p className="text-xs text-muted-foreground/80">Create budgets to track your spending limits.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
