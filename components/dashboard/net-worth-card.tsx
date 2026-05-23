import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getWallets } from "@/lib/queries/wallets"
import { getPreferences } from "@/lib/queries/preferences"
import { convertCurrency } from "@/lib/currency"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface NetWorthCardProps {
  userId: string
  className?: string
}

export async function NetWorthCard({ userId, className }: NetWorthCardProps) {
  const wallets = await getWallets(userId)
  const prefs = await getPreferences(userId)
  const targetCurrency = prefs.defaultCurrency || "USD"

  // Group balances by currency
  const currencyGroup: Record<string, number> = {}
  wallets.forEach((w) => {
    currencyGroup[w.currency] = (currencyGroup[w.currency] || 0) + w.balance
  })

  // Convert all to target currency and sum up
  let totalInTarget = 0
  const conversions = await Promise.all(
    Object.entries(currencyGroup).map(async ([currency, balance]) => {
      const converted = await convertCurrency(balance, currency, targetCurrency)
      return { currency, original: balance, converted }
    })
  )

  conversions.forEach((c) => {
    totalInTarget += c.converted
  })

  return (
    <Card className={cn("relative overflow-hidden bg-card border border-border/40 shadow-xl hover:shadow-2xl transition-all duration-300 group flex flex-col gap-3 pb-0", className)}>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-violet-500" />
          Net Worth
        </CardDescription>
        <CardTitle className="text-2xl font-bold flex items-baseline gap-2">
          {formatCurrency(totalInTarget, targetCurrency)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end pb-6">
        {conversions.length > 0 ? (
          <div className="mt-auto pt-3 border-t border-border/30 flex flex-col gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Breakdown:</span>
            <div className="flex flex-wrap gap-1.5">
              {conversions.map((c) => (
                <div
                  key={c.currency}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-secondary-foreground text-[11px] font-medium border border-border/30"
                >
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">{c.currency}</span>
                  <span>{formatCurrency(c.original, c.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-3 border-t border-border/30 text-xs text-muted-foreground flex items-center gap-1">
            <span>No active wallets. Add one to see your net worth.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
