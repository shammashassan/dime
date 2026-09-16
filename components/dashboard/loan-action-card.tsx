"use client"

import { useState, useTransition, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, ArrowDownLeft, HandCoins, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Contact, OwedSummaries } from "@/types"
import { createLoanAction } from "@/lib/actions/loans"
import { formatCurrency, cn } from "@/lib/utils"
import { getCurrencySymbol } from "@/lib/denomination"

export interface LoanActionCardProps {
  contacts: Contact[]
  owedSummary: OwedSummaries
  className?: string
}

export function LoanActionCard({ contacts, owedSummary, className }: LoanActionCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<"lent" | "borrowed">("lent")
  const [contactId, setContactId] = useState("")
  const [amount, setAmount] = useState("")

  const effectiveContactId = contactId || contacts[0]?._id?.toString() || ""
  const currencySymbol = getCurrencySymbol(owedSummary.baseCurrency)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid loan amount")
      return
    }
    if (!effectiveContactId) {
      toast.error("Please select a contact")
      return
    }

    const selectedContact = contacts.find((c) => c._id?.toString() === effectiveContactId)
    if (!selectedContact) {
      toast.error("Selected contact not found")
      return
    }

    startTransition(async () => {
      try {
        const amountInCents = Math.round(numAmount * 100)
        const res = await createLoanAction({
          type,
          contactId: effectiveContactId,
          contactName: selectedContact.name,
          amount: amountInCents,
          currency: owedSummary.baseCurrency,
          date: new Date().toISOString(),
        })

        if (res.success) {
          toast.success(
            `Recorded ${type === "lent" ? "loan to" : "borrowing from"} ${selectedContact.name}!`,
            {
              action: {
                label: "View",
                onClick: () => router.push("/loans"),
              },
            }
          )
          setAmount("")
          router.refresh()
        } else {
          toast.error(res.error || "Failed to record loan")
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to record loan")
      }
    })
  }

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col justify-between gap-4 border-border/50 p-5 shadow-xs",
        className
      )}
    >
      <div className="flex flex-col gap-3">
        {/* Header with micro-label and deep link */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            lending & debts
          </span>
          <Link
            href="/loans"
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            View all loans
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {/* Live aggregate debt position badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-500">
              <ArrowUpRight className="size-3.5" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] font-medium uppercase text-muted-foreground">
                You Lent
              </span>
              <span className="truncate text-sm font-bold text-foreground">
                {formatCurrency(owedSummary.totalLent, owedSummary.baseCurrency)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-500">
              <ArrowDownLeft className="size-3.5" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] font-medium uppercase text-muted-foreground">
                You Borrowed
              </span>
              <span className="truncate text-sm font-bold text-foreground">
                {formatCurrency(owedSummary.totalBorrowed, owedSummary.baseCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick loan creation form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-border/40 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Quick Record</span>
          <ToggleGroup
            type="single"
            value={type}
            onValueChange={(val) => {
              if (val) setType(val as "lent" | "borrowed")
            }}
            className="bg-muted/40 p-0.5 rounded-lg border border-border/50"
          >
            <ToggleGroupItem
              value="lent"
              className="h-6 px-2 text-[11px] font-medium data-[state=on]:bg-emerald-500/10 data-[state=on]:text-emerald-500"
            >
              I Lent
            </ToggleGroupItem>
            <ToggleGroupItem
              value="borrowed"
              className="h-6 px-2 text-[11px] font-medium data-[state=on]:bg-amber-500/10 data-[state=on]:text-amber-500"
            >
              I Borrowed
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Contact selector or empty placeholder */}
          {contacts.length === 0 ? (
            <div className="flex h-9 items-center justify-between rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground">
              <span className="truncate">No contacts created yet</span>
              <Link
                href="/contacts"
                className="ml-1 shrink-0 text-[11px] font-medium text-primary hover:underline"
              >
                Create
              </Link>
            </div>
          ) : (
            <Select value={effectiveContactId} onValueChange={setContactId} disabled={isPending}>
              <SelectTrigger className="h-9 text-xs" aria-label="Select contact">
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {contacts.map((c) => {
                    const id = c._id?.toString()
                    if (!id) return null
                    return (
                      <SelectItem key={id} value={id}>
                        {c.name}
                      </SelectItem>
                    )
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

          {/* Amount input */}
          <InputGroup className="h-9">
            <InputGroupAddon>{currencySymbol}</InputGroupAddon>
            <InputGroupInput
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
              className="text-xs font-medium"
              aria-label="Amount"
            />
          </InputGroup>
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={isPending || !amount || !contactId || contacts.length === 0}
          className="h-8.5 w-full gap-1.5 text-xs font-semibold cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <HandCoins className="size-3.5" />
          )}
          Record {type === "lent" ? "Loan" : "Borrowing"}
        </Button>
      </form>
    </Card>
  )
}
