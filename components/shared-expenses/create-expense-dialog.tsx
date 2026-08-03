"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupText } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { createSharedExpenseAction } from "@/lib/actions/shared-expenses"
import { calculateEqualExpenseSplits, calculatePercentageExpenseSplits } from "@/lib/calculations/shared-expenses"
import { ParticipantType, SharedExpenseParticipant } from "@/types"
import { Receipt, Users, Plus, Trash2, Scale } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

interface ContactOption {
  id: string
  name: string
  email?: string
}

interface CreateExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: ContactOption[]
  wallets?: { id: string; name: string }[]
  currentUserId: string
  currentUserName: string
}

export function CreateExpenseDialog({
  open,
  onOpenChange,
  contacts,
  wallets = [],
  currentUserId,
  currentUserName,
}: CreateExpenseDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [amountStr, setAmountStr] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [splitMode, setSplitMode] = useState<"equal" | "percentage" | "custom">("equal")
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || "")
  const [logWalletTx, setLogWalletTx] = useState(wallets.length > 0)
  const [notes, setNotes] = useState("")

  // Default payer is current user
  const [paidById, setPaidById] = useState(currentUserId)
  const [paidByType, setPaidByType] = useState<ParticipantType>("user")

  // Selected participants list
  const [selectedParticipants, setSelectedParticipants] = useState<
    { id: string; type: ParticipantType; name: string; email?: string }[]
  >([
    { id: currentUserId, type: "user", name: currentUserName || "You" },
    ...(contacts.length > 0
      ? [{ id: contacts[0].id, type: "contact" as ParticipantType, name: contacts[0].name, email: contacts[0].email }]
      : []),
  ])

  // Split Mode State
  const [participantPercentages, setParticipantPercentages] = useState<Record<string, number>>({})
  const [participantCustomAmounts, setParticipantCustomAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (selectedParticipants.length > 0) {
      const defaultPct = Number((100 / selectedParticipants.length).toFixed(2))
      const pcts: Record<string, number> = {}
      selectedParticipants.forEach((p) => {
        pcts[p.id] = participantPercentages[p.id] ?? defaultPct
      })
      setParticipantPercentages(pcts)
    }
  }, [selectedParticipants.length, splitMode])

  const totalAmountCents = Math.round((parseFloat(amountStr) || 0) * 100)

  const toggleContact = (contact: ContactOption) => {
    const exists = selectedParticipants.some((p) => p.id === contact.id)
    if (exists) {
      if (selectedParticipants.length <= 2) return
      setSelectedParticipants(selectedParticipants.filter((p) => p.id !== contact.id))
    } else {
      setSelectedParticipants([
        ...selectedParticipants,
        { id: contact.id, type: "contact", name: contact.name, email: contact.email },
      ])
    }
  }

  const computedParticipants: SharedExpenseParticipant[] = (() => {
    if (totalAmountCents <= 0 || selectedParticipants.length === 0) return []

    const baseParticipants = selectedParticipants.map((p) => ({
      participantId: p.id,
      participantType: p.type,
      name: p.name,
      email: p.email,
      amountPaid: p.id === paidById ? totalAmountCents : 0,
    }))

    if (splitMode === "equal") {
      return calculateEqualExpenseSplits(totalAmountCents, baseParticipants)
    }

    if (splitMode === "percentage") {
      const pcts = selectedParticipants.map((p) => ({
        ...p,
        participantId: p.id,
        participantType: p.type,
        amountPaid: p.id === paidById ? totalAmountCents : 0,
        percentage: participantPercentages[p.id] ?? (100 / selectedParticipants.length),
      }))
      return calculatePercentageExpenseSplits(totalAmountCents, pcts)
    }

    return selectedParticipants.map((p) => {
      const customStr = participantCustomAmounts[p.id] || "0"
      const owedCents = Math.round((parseFloat(customStr) || 0) * 100)
      return {
        participantId: p.id,
        participantType: p.type,
        name: p.name,
        email: p.email,
        amountPaid: p.id === paidById ? totalAmountCents : 0,
        amountOwed: owedCents,
      }
    })
  })()

  const sumPercentage = selectedParticipants.reduce(
    (acc, p) => acc + (participantPercentages[p.id] || 0),
    0
  )
  const isPercentageBalanced = Math.abs(100 - sumPercentage) < 0.01

  const sumCustomCents = computedParticipants.reduce((acc, p) => acc + p.amountOwed, 0)
  const isCustomBalanced = sumCustomCents === totalAmountCents

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || totalAmountCents <= 0) {
      setError("Please provide a valid title and total amount.")
      return
    }

    if (selectedParticipants.length < 2) {
      setError("At least two participants are required to split an expense.")
      return
    }

    if (splitMode === "percentage" && !isPercentageBalanced) {
      setError(`Percentages must add up to 100%. Current sum: ${sumPercentage.toFixed(1)}%`)
      return
    }

    if (splitMode === "custom" && !isCustomBalanced) {
      setError(
        `Custom participant shares (${(sumCustomCents / 100).toFixed(2)}) must equal total expense amount (${(totalAmountCents / 100).toFixed(2)}).`
      )
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createSharedExpenseAction({
        title,
        totalAmount: totalAmountCents,
        currency,
        paidByParticipantId: paidById,
        paidByParticipantType: paidByType,
        splitMode,
        participants: computedParticipants,
        date: new Date(),
        notes,
        walletId: logWalletTx && paidById === currentUserId ? selectedWalletId : undefined,
      })

      setTitle("")
      setAmountStr("")
      setNotes("")
      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to create shared expense")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto min-w-0 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-5 text-primary" />
            Add Shared Expense
          </DialogTitle>
          <DialogDescription>
            Split an expense with contacts or space members with automatic balance calculation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
              {error}
            </div>
          )}

          <FieldGroup className="gap-4">
            {/* Title */}
            <Field>
              <FieldLabel htmlFor="expense-title">Expense Title</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="expense-title"
                  placeholder="Dinner, Groceries, Hotel..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 rounded-xl"
                  required
                />
              </InputGroup>
            </Field>

            {/* Total Amount & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="total-amount">Total Amount</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="total-amount"
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
                <FieldLabel htmlFor="currency">Currency</FieldLabel>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="h-10 rounded-xl">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Paid Upfront By */}
            <Field>
              <FieldLabel htmlFor="paid-by">Paid Upfront By</FieldLabel>
              <Select
                value={`${paidByType}:${paidById}`}
                onValueChange={(val) => {
                  const [t, id] = val.split(":")
                  setPaidByType(t as ParticipantType)
                  setPaidById(id)
                }}
              >
                <SelectTrigger id="paid-by" className="h-10 rounded-xl">
                  <SelectValue placeholder="Select payer" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={`user:${currentUserId}`}>You ({currentUserName || "User"})</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={`contact:${c.id}`}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Paid From Wallet (if user paid upfront and wallets exist) */}
            {paidById === currentUserId && wallets.length > 0 && (
              <Field>
                <FieldLabel htmlFor="paid-from-wallet">Paid From Wallet</FieldLabel>
                <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                  <SelectTrigger id="paid-from-wallet" className="h-10 rounded-xl">
                    <SelectValue placeholder="Select wallet to deduct funds from" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {/* Split Mode Selector */}
            <Field>
              <FieldLabel>Split Mode</FieldLabel>
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-xl text-xs font-semibold">
                {(["equal", "percentage", "custom"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSplitMode(mode)}
                    className={cn(
                      "py-2 px-2 rounded-lg transition-all text-center cursor-pointer capitalize truncate",
                      splitMode === mode
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === "equal" ? "Equal" : mode === "percentage" ? "By %" : "Custom"}
                  </button>
                ))}
              </div>
            </Field>

            {/* Participants & Interactive Split Inputs */}
            <Field>
              <div className="flex justify-between items-center mb-1.5">
                <FieldLabel className="mb-0">
                  Participants ({selectedParticipants.length})
                </FieldLabel>
                {splitMode === "percentage" ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5",
                      isPercentageBalanced
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}
                  >
                    {isPercentageBalanced ? "100% Balanced" : `Total: ${sumPercentage.toFixed(1)}%`}
                  </Badge>
                ) : splitMode === "custom" ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5",
                      isCustomBalanced
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}
                  >
                    {isCustomBalanced
                      ? "Balanced"
                      : `Sum: ${formatCurrency(sumCustomCents, currency)}`}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    Auto-Calculated
                  </Badge>
                )}
              </div>

              <div className="border border-border/50 rounded-xl p-3 bg-muted/20 space-y-3 max-h-56 overflow-y-auto">
                {/* Current User Row */}
                <div className="flex items-center justify-between gap-3 text-xs py-1 border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox checked disabled />
                    <span className="font-bold truncate">You ({currentUserName || "User"})</span>
                  </div>

                  {splitMode === "equal" ? (
                    <span className="font-mono text-xs font-semibold shrink-0">
                      {computedParticipants.find((p) => p.participantId === currentUserId)
                        ? formatCurrency(computedParticipants.find((p) => p.participantId === currentUserId)!.amountOwed, currency)
                        : "-"}
                    </span>
                  ) : splitMode === "percentage" ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <InputGroup className="w-20 h-8 rounded-lg">
                        <InputGroupAddon align="inline-end">
                          <InputGroupText className="text-[10px]">%</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          type="number"
                          step="any"
                          value={participantPercentages[currentUserId] ?? ""}
                          onChange={(e) =>
                            setParticipantPercentages({
                              ...participantPercentages,
                              [currentUserId]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-8 text-xs font-semibold"
                        />
                      </InputGroup>
                      <span className="font-mono text-[11px] text-muted-foreground w-16 text-right">
                        {computedParticipants.find((p) => p.participantId === currentUserId)
                          ? formatCurrency(computedParticipants.find((p) => p.participantId === currentUserId)!.amountOwed, currency)
                          : "-"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <InputGroup className="w-32 sm:w-36 h-8 rounded-lg">
                        <InputGroupAddon align="inline-start">
                          <InputGroupText className="text-[10px]">{currency}</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={participantCustomAmounts[currentUserId] ?? ""}
                          onChange={(e) =>
                            setParticipantCustomAmounts({
                              ...participantCustomAmounts,
                              [currentUserId]: e.target.value,
                            })
                          }
                          className="h-8 text-xs font-semibold"
                        />
                      </InputGroup>
                    </div>
                  )}
                </div>

                {/* Contacts Rows */}
                {contacts.map((c) => {
                  const isSelected = selectedParticipants.some((p) => p.id === c.id)
                  const computed = computedParticipants.find((p) => p.participantId === c.id)

                  return (
                    <div key={c.id} className="flex items-center justify-between gap-3 text-xs py-1 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Checkbox
                          id={`contact-${c.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleContact(c)}
                        />
                        <label htmlFor={`contact-${c.id}`} className="cursor-pointer font-medium truncate">
                          {c.name}
                        </label>
                      </div>

                      {isSelected ? (
                        splitMode === "equal" ? (
                          <span className="font-mono text-xs font-semibold shrink-0">
                            {computed ? formatCurrency(computed.amountOwed, currency) : "-"}
                          </span>
                        ) : splitMode === "percentage" ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <InputGroup className="w-20 h-8 rounded-lg">
                              <InputGroupAddon align="inline-end">
                                <InputGroupText className="text-[10px]">%</InputGroupText>
                              </InputGroupAddon>
                              <InputGroupInput
                                type="number"
                                step="any"
                                value={participantPercentages[c.id] ?? ""}
                                onChange={(e) =>
                                  setParticipantPercentages({
                                    ...participantPercentages,
                                    [c.id]: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="h-8 text-xs font-semibold"
                              />
                            </InputGroup>
                            <span className="font-mono text-[11px] text-muted-foreground w-16 text-right">
                              {computed ? formatCurrency(computed.amountOwed, currency) : "-"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <InputGroup className="w-32 sm:w-36 h-8 rounded-lg">
                              <InputGroupAddon align="inline-start">
                                <InputGroupText className="text-[10px]">{currency}</InputGroupText>
                              </InputGroupAddon>
                              <InputGroupInput
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={participantCustomAmounts[c.id] ?? ""}
                                onChange={(e) =>
                                  setParticipantCustomAmounts({
                                    ...participantCustomAmounts,
                                    [c.id]: e.target.value,
                                  })
                                }
                                className="h-8 text-xs font-semibold"
                              />
                            </InputGroup>
                          </div>
                        )
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic shrink-0">Not included</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notes (Optional)</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="notes"
                  placeholder="e.g. Dinner receipt #104"
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
              {loading ? "Saving..." : "Save Expense Split"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
