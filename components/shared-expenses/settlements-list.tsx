"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SharedSettlement } from "@/types"
import { HandCoins, Calendar, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface SettlementsListProps {
  settlements: SharedSettlement[]
  currentUserId: string
}

export function SettlementsList({ settlements, currentUserId }: SettlementsListProps) {
  if (settlements.length === 0) {
    return (
      <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
        <div className="flex flex-col items-center justify-center">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl mb-3">
            <HandCoins className="size-8" />
          </div>
          <h3 className="text-base font-bold">No Settlement History</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Recorded settlement payments will appear here once group debts are cleared.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {settlements.map((s) => {
        const dateStr = new Date(s.settledAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })

        return (
          <Card key={s._id.toString()} className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <HandCoins className="size-5" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <span>{s.fromParticipantId === currentUserId ? "You" : "Partner"}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                    <span>{s.toParticipantId === currentUserId ? "You" : "Partner"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {dateStr}
                    </span>
                    {s.paymentMethod && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px] rounded-md font-semibold capitalize">
                          {s.paymentMethod}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(s.amount, s.currency)}
                </div>
                {s.notes && <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{s.notes}</p>}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
