"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { recordSettlementAction } from "@/lib/actions/shared-expenses"
import { ParticipantType } from "@/types"
import { HandCoins, ArrowRightLeft } from "lucide-react"

interface ParticipantOption {
  id: string
  type: ParticipantType
  name: string
}

interface SettleUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participants: ParticipantOption[]
  defaultPayerId?: string
  defaultPayerType?: ParticipantType
  defaultReceiverId?: string
  defaultReceiverType?: ParticipantType
  defaultAmountCents?: number
  currency?: string
  expenseId?: string
  wallets?: { id: string; name: string }[]
}

export function SettleUpDialog({
  open,
  onOpenChange,
  participants,
  defaultPayerId,
  defaultPayerType = "user",
  defaultReceiverId,
  defaultReceiverType = "user",
  defaultAmountCents = 0,
  currency = "USD",
  expenseId,
  wallets = [],
}: SettleUpDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fromId, setFromId] = useState(defaultPayerId || (participants[0]?.id ?? ""))
  const [fromType, setFromType] = useState<ParticipantType>(defaultPayerType)

  const [toId, setToId] = useState(defaultReceiverId || (participants[1]?.id ?? ""))
  const [toType, setToType] = useState<ParticipantType>(defaultReceiverType)

  const [amountStr, setAmountStr] = useState(defaultAmountCents > 0 ? (defaultAmountCents / 100).toString() : "")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [logWalletTx, setLogWalletTx] = useState(false)
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || "")
  const [notes, setNotes] = useState("")

  // Sync state whenever open prop changes
  useEffect(() => {
    if (open) {
      const payerP = participants.find((p) => p.id === defaultPayerId) || participants[0]
      const receiverP =
        participants.find((p) => p.id === defaultReceiverId) ||
        participants.find((p) => p.id !== payerP?.id) ||
        participants[1]

      if (payerP) {
        setFromId(payerP.id)
        setFromType(payerP.type)
      }
      if (receiverP) {
        setToId(receiverP.id)
        setToType(receiverP.type)
      }
      if (defaultAmountCents > 0) {
        setAmountStr((defaultAmountCents / 100).toString())
      } else {
        setAmountStr("")
      }
      setError(null)
    }
  }, [open, defaultPayerId, defaultReceiverId, defaultAmountCents, participants])

  const amountCents = Math.round((parseFloat(amountStr) || 0) * 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fromId || !toId) {
      setError("Please select both payer and receiver.")
      return
    }

    if (fromId === toId) {
      setError("Payer and receiver cannot be the same person.")
      return
    }

    if (amountCents <= 0) {
      setError("Settlement amount must be greater than zero.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await recordSettlementAction({
        expenseId,
        fromParticipantId: fromId,
        fromParticipantType: fromType,
        toParticipantId: toId,
        toParticipantType: toType,
        amount: amountCents,
        currency,
        paymentMethod,
        walletId: logWalletTx ? selectedWalletId : undefined,
        settledAt: new Date(),
        notes,
      })

      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to record settlement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto min-w-0 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="size-5 text-emerald-500" />
            Settle Up Balance
          </DialogTitle>
          <DialogDescription>
            Record a settlement payment between participants to clear or reduce outstanding debts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
              {error}
            </div>
          )}

          <FieldGroup className="gap-4">
            {/* Payer and Receiver Box */}
            <div className="grid grid-cols-5 items-center gap-2 border border-border/50 rounded-xl p-3 bg-muted/20">
              <div className="col-span-2 space-y-1">
                <FieldLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">Payer</FieldLabel>
                <Select
                  value={fromId ? `${fromType}:${fromId}` : undefined}
                  onValueChange={(val) => {
                    const [t, id] = val.split(":")
                    setFromType(t as ParticipantType)
                    setFromId(id)
                  }}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl font-medium">
                    <SelectValue placeholder="Select Payer" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {participants.map((p) => (
                      <SelectItem key={p.id} value={`${p.type}:${p.id}`}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center pt-4">
                <ArrowRightLeft className="size-4 text-muted-foreground" />
              </div>

              <div className="col-span-2 space-y-1">
                <FieldLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">Receiver</FieldLabel>
                <Select
                  value={toId ? `${toType}:${toId}` : undefined}
                  onValueChange={(val) => {
                    const [t, id] = val.split(":")
                    setToType(t as ParticipantType)
                    setToId(id)
                  }}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl font-medium">
                    <SelectValue placeholder="Select Receiver" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {participants.map((p) => (
                      <SelectItem key={p.id} value={`${p.type}:${p.id}`}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="settle-amount">Settlement Amount ({currency})</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="settle-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="h-10 rounded-xl font-semibold"
                    required
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="payment-method">Payment Method</FieldLabel>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method" className="h-10 rounded-xl">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI / Instant</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {wallets.length > 0 && (
              <div className="space-y-2 border border-border/50 rounded-xl p-3 bg-muted/10">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="log-wallet-tx-modal"
                    checked={logWalletTx}
                    onCheckedChange={(checked) => setLogWalletTx(!!checked)}
                  />
                  <label htmlFor="log-wallet-tx-modal" className="text-xs font-semibold cursor-pointer">
                    Log this payment into a Wallet
                  </label>
                </div>

                {logWalletTx && (
                  <div className="pt-2">
                    <FieldLabel className="text-[10px]">Select Wallet</FieldLabel>
                    <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                      <SelectTrigger className="h-10 mt-1 rounded-xl">
                        <SelectValue placeholder="Choose wallet" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {wallets.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="settle-notes">Notes (Optional)</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="settle-notes"
                  placeholder="e.g. Cleared dinner balance via Venmo"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </InputGroup>
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-semibold">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl font-bold px-6">
              {loading ? "Processing..." : "Record Settlement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
