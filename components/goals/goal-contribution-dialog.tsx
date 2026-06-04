"use client"

import React, { useState } from "react"
import { Goal, Wallet } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { contributeToGoal } from "@/lib/actions/goals"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FieldGroup, 
  Field, 
  FieldLabel, 
  FieldError 
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sparkles, Wallet as WalletIcon } from "lucide-react"

interface GoalContributionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal
  wallets: Wallet[]
}

export function GoalContributionDialog({
  open,
  onOpenChange,
  goal,
  wallets,
}: GoalContributionDialogProps) {
  const [selectedWalletId, setSelectedWalletId] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeWallets = wallets.filter(w => !w.isArchived)
  const selectedWallet = activeWallets.find(w => w._id.toString() === selectedWalletId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedWalletId) {
      setError("Please select a wallet")
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0")
      return
    }

    const amountInCents = Math.round(numAmount * 100)
    if (selectedWallet && selectedWallet.balance < amountInCents) {
      setError("Insufficient balance in the selected wallet")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await contributeToGoal(
        goal._id.toString(),
        amountInCents,
        selectedWalletId
      )

      if (res.success) {
        toast.success(`Contributed ${formatCurrency(amountInCents, selectedWallet!.currency)} to "${goal.name}"`)
        setAmount("")
        setSelectedWalletId("")
        onOpenChange(false)
      } else {
        toast.error("Failed to make contribution")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An error occurred while making the contribution")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="size-5 text-primary animate-pulse" />
            Contribute to Goal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-xl p-3 border border-destructive/20 text-left font-medium">
              {error}
            </div>
          )}

          <FieldGroup>
            {/* Source Wallet Selection */}
            <Field>
              <FieldLabel>Source Wallet</FieldLabel>
              <Select
                value={selectedWalletId}
                onValueChange={(val) => {
                  setSelectedWalletId(val)
                  setError(null)
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a source wallet" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {activeWallets.map((wallet) => (
                    <SelectItem 
                      key={wallet._id.toString()} 
                      value={wallet._id.toString()}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <WalletIcon className="size-4 shrink-0" style={{ color: wallet.color }} />
                        <span>{wallet.name} ({formatCurrency(wallet.balance, wallet.currency)})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Amount */}
            <Field>
              <FieldLabel htmlFor="contribution-amount">
                Amount {selectedWallet ? `(${selectedWallet.currency})` : ""}
              </FieldLabel>
              <Input
                id="contribution-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError(null)
                }}
                className="rounded-xl font-semibold"
              />
            </Field>

            {/* Currency conversion warning/info if wallet currency differs from goal currency */}
            {selectedWallet && selectedWallet.currency !== goal.currency && (
              <div className="bg-amber-500/10 text-amber-500 text-xs rounded-xl p-4 border border-amber-500/20 text-left leading-relaxed">
                <strong>Multi-Currency Transfer Notice:</strong> The source wallet uses <strong>{selectedWallet.currency}</strong>, while the goal target is in <strong>{goal.currency}</strong>. The value contributed will be calculated based on the current exchange rate.
              </div>
            )}
          </FieldGroup>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !amount || !selectedWalletId}
              className="rounded-xl font-bold cursor-pointer"
            >
              {isSubmitting ? "Contributing..." : "Confirm Contribution"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
