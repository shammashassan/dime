"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { TransactionDialog } from "../transaction-dialog"
import { PriceUpdateDialog } from "../price-update-dialog"
import { WalletForm } from "@/components/wallets/wallet-form"
import { Wallet, InvestmentHolding } from "@/types"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlusCircle, RefreshCw, Zap } from "lucide-react"

interface QuickActionsCardProps {
  accounts: Wallet[]
  holdings: InvestmentHolding[]
}

export function QuickActionsCard({ accounts, holdings }: QuickActionsCardProps) {
  const [addAccountOpen, setAddAccountOpen] = React.useState(false)
  const [addTxOpen, setAddTxOpen] = React.useState(false)
  const [selectedHoldingId, setSelectedHoldingId] = React.useState<string>("")

  const activeHoldings = React.useMemo(() => {
    return holdings.filter((h) => h.status === "active")
  }, [holdings])

  const selectedHolding = React.useMemo(() => {
    return activeHoldings.find((h) => `${h.walletId}_${h.symbol}` === selectedHoldingId)
  }, [activeHoldings, selectedHoldingId])

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
        <Zap className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</span>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3.5 justify-between">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5 min-w-0">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-1.5 h-9 text-xs font-bold rounded-xl bg-card border-border/40 hover:bg-muted/40 cursor-pointer active:scale-95 transition-all px-3"
            onClick={() => setAddAccountOpen(true)}
          >
            <PlusCircle className="size-3.5 text-emerald-500 shrink-0" />
            <span>Add Account</span>
          </Button>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-1.5 h-9 text-xs font-bold rounded-xl bg-card border-border/40 hover:bg-muted/40 cursor-pointer active:scale-95 transition-all px-3"
            onClick={() => setAddTxOpen(true)}
          >
            <PlusCircle className="size-3.5 text-blue-500 shrink-0" />
            <span>Add Transaction</span>
          </Button>
        </div>

        <div className="border-t border-border/30 pt-3 flex flex-col gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Update Price Snapshot</span>
          <div className="flex flex-col gap-2">
            <Select value={selectedHoldingId} onValueChange={setSelectedHoldingId}>
              <SelectTrigger className="w-full rounded-xl border-border/40 bg-card h-9 text-xs">
                <SelectValue placeholder="Select active holding" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border/40 rounded-xl">
                <SelectGroup>
                  {activeHoldings.map((h) => {
                    const id = `${h.walletId}_${h.symbol}`
                    const displayName = h.name && h.name.trim().toLowerCase() !== h.symbol.trim().toLowerCase() ? h.name : null
                    return (
                      <SelectItem key={id} value={id} className="rounded-lg text-xs">
                        {displayName ? `${h.symbol} — ${displayName}` : h.symbol}
                      </SelectItem>
                    )
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>

            {selectedHolding ? (
              <PriceUpdateDialog
                holdingId={`${selectedHolding.walletId}_${selectedHolding.symbol}`}
                currentPrice={selectedHolding.currentPrice}
                trigger={
                  <Button className="w-full rounded-xl text-xs font-bold h-9 gap-1.5 cursor-pointer active:scale-95 transition-all">
                    <RefreshCw className="size-3.5" />
                    Update Market Price
                  </Button>
                }
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-full">
                    <Button disabled className="w-full rounded-xl text-xs font-bold h-9 gap-1.5">
                      <RefreshCw className="size-3.5" />
                      Update Market Price
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Select an active holding first</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold">Add Brokerage Account</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <WalletForm
                initialWallet={{ type: "investment" } as any}
                onSuccess={() => setAddAccountOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        <TransactionDialog
          accounts={accounts}
          open={addTxOpen}
          onOpenChange={setAddTxOpen}
        />
      </div>
    </div>
  )
}
