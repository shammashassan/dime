import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item"
import { SharedExpensesOverviewViewModel, ParticipantType } from "@/types"
import { ArrowRight, CheckCircle2, HandCoins, Scale } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface BalancesOverviewCardProps {
  viewModel: SharedExpensesOverviewViewModel
  currentUserId: string
  onSettleUp: (
    payerId: string,
    payerType: ParticipantType,
    receiverId: string,
    receiverType: ParticipantType,
    amountCents: number
  ) => void
  mode?: "simplified" | "pairwise"
}

export function BalancesOverviewCard({
  viewModel,
  currentUserId,
  onSettleUp,
  mode: initialMode = "simplified",
}: BalancesOverviewCardProps) {
  const [currentMode, setCurrentMode] = useState<"simplified" | "pairwise">(initialMode)
  const { currency, pairwiseBalances, simplifiedTransfers } = viewModel

  return (
    <Card className="rounded-2xl border border-border/50 bg-card shadow-sm gap-0 py-0 overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0 p-4 border-b border-border/30">
        <div>
          <CardTitle className="text-base font-extrabold flex items-center gap-2">
            <Scale className="size-4.5 text-primary" />
            {currentMode === "simplified" ? "Simplified Group Balances" : "All Pairwise Balances"}
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {currentMode === "simplified"
              ? "Smart graph algorithm calculating the minimum payments needed across the group."
              : "Raw 1-on-1 balance matrix between individual group members."}
          </CardDescription>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-xl bg-muted/80 p-1 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setCurrentMode("simplified")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              currentMode === "simplified"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Simplified ({simplifiedTransfers.length})
          </button>
          <button
            onClick={() => setCurrentMode("pairwise")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              currentMode === "pairwise"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Direct ({pairwiseBalances.length})
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {currentMode === "simplified" ? (
          <div>
            {simplifiedTransfers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/40 rounded-xl bg-muted/20">
                <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-extrabold text-foreground text-sm">No Outstanding Debts!</p>
                <p className="text-xs text-muted-foreground mt-0.5">Everyone in this space is fully settled up.</p>
              </div>
            ) : (
              <ItemGroup className="gap-2">
                {simplifiedTransfers.map((transfer, idx) => {
                  const isUserPayer = transfer.fromParticipantId === currentUserId
                  const isUserReceiver = transfer.toParticipantId === currentUserId

                  return (
                    <Item
                      key={idx}
                      className="p-3.5 border border-border/40 rounded-xl bg-card hover:bg-muted/20 transition-colors"
                    >
                      <ItemMedia className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                        {transfer.fromParticipantName[0]}
                      </ItemMedia>

                      <ItemContent className="gap-0.5">
                        <ItemTitle className="gap-2 text-sm font-bold">
                          <span>{isUserPayer ? "You" : transfer.fromParticipantName}</span>
                          <ArrowRight className="size-3.5 text-muted-foreground" />
                          <span>{isUserReceiver ? "You" : transfer.toParticipantName}</span>
                        </ItemTitle>
                        <ItemDescription className="text-[11px] flex items-center gap-1.5">
                          {isUserPayer ? (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[9px] font-bold px-1.5 py-0 h-4">
                              You Owe
                            </Badge>
                          ) : isUserReceiver ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] font-bold px-1.5 py-0 h-4">
                              Owes You
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0 h-4">
                              Group Settlement
                            </Badge>
                          )}
                        </ItemDescription>
                      </ItemContent>

                      <ItemActions className="gap-3">
                        <span className="font-mono font-extrabold text-base tabular-nums">
                          {formatCurrency(transfer.amount, currency)}
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onSettleUp(
                              transfer.fromParticipantId,
                              transfer.fromParticipantType,
                              transfer.toParticipantId,
                              transfer.toParticipantType,
                              transfer.amount
                            )
                          }
                          className="rounded-xl font-bold text-xs gap-1.5 border-border/50 shadow-xs"
                        >
                          <HandCoins className="size-3.5 text-emerald-500" />
                          Settle Up
                        </Button>
                      </ItemActions>
                    </Item>
                  )
                })}
              </ItemGroup>
            )}
          </div>
        ) : (
          <div>
            {pairwiseBalances.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/40 rounded-xl bg-muted/20">
                <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-extrabold text-foreground text-sm">No Pairwise Debts</p>
                <p className="text-xs text-muted-foreground mt-0.5">All individual items balance out.</p>
              </div>
            ) : (
              <ItemGroup className="gap-2">
                {pairwiseBalances.map((pair, idx) => {
                  const isUserPayer = pair.fromParticipantId === currentUserId
                  const isUserReceiver = pair.toParticipantId === currentUserId

                  return (
                    <Item
                      key={idx}
                      className="p-3.5 border border-border/40 rounded-xl bg-card hover:bg-muted/20 transition-colors"
                    >
                      <ItemMedia className="size-9 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center font-black text-xs shrink-0">
                        {pair.fromParticipantName[0]}
                      </ItemMedia>

                      <ItemContent className="gap-0.5">
                        <ItemTitle className="gap-2 text-sm font-bold">
                          <span>{isUserPayer ? "You" : pair.fromParticipantName}</span>
                          <ArrowRight className="size-3.5 text-muted-foreground" />
                          <span>{isUserReceiver ? "You" : pair.toParticipantName}</span>
                        </ItemTitle>
                        <ItemDescription className="text-[11px]">
                          {isUserPayer ? (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[9px] font-bold px-1.5 py-0 h-4">
                              Direct Debt
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] font-bold px-1.5 py-0 h-4">
                              Direct Claim
                            </Badge>
                          )}
                        </ItemDescription>
                      </ItemContent>

                      <ItemActions className="gap-3">
                        <span className="font-mono font-extrabold text-base tabular-nums">
                          {formatCurrency(pair.netAmount, currency)}
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onSettleUp(
                              pair.fromParticipantId,
                              pair.fromParticipantType,
                              pair.toParticipantId,
                              pair.toParticipantType,
                              pair.netAmount
                            )
                          }
                          className="rounded-xl font-bold text-xs gap-1.5 border-border/50 shadow-xs text-emerald-600 dark:text-emerald-400"
                        >
                          <HandCoins className="size-3.5 text-emerald-500" />
                          Settle
                        </Button>
                      </ItemActions>
                    </Item>
                  )
                })}
              </ItemGroup>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
