"use client"

import { useState, useTransition, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  Loader2,
  Calendar as CalendarIcon,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

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
          dueDate: dueDate ? dueDate.toISOString() : undefined,
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
          setDueDate(undefined)
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
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      {/* Header with micro-label and deep link */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          lending & debts
        </span>
        <Link
          href="/loans"
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <span>View all loans</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
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

        {/* Quick loan creation form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-border/40 pt-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Quick Record</span>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/50 border border-border/40">
              <button
                type="button"
                onClick={() => setType("lent")}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer min-w-[95px]",
                  type === "lent"
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowUpRight className="size-3.5 shrink-0" />
                <span>I Lent</span>
              </button>
              <button
                type="button"
                onClick={() => setType("borrowed")}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer min-w-[95px]",
                  type === "borrowed"
                    ? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowDownLeft className="size-3.5 shrink-0" />
                <span>I Borrowed</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                <SelectTrigger className="h-9 text-xs w-full" aria-label="Select contact">
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
            <InputGroup className="h-9 w-full">
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

            {/* Due Date picker */}
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isPending}
                  className={cn(
                    "h-9 w-full justify-start px-3 text-xs font-normal border-input hover:bg-muted/50",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1 text-left">
                    {dueDate ? `Due ${format(dueDate, "MMM d, yyyy")}` : "Due date (optional)"}
                  </span>
                  {dueDate && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Clear due date"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDueDate(undefined)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation()
                          setDueDate(undefined)
                        }
                      }}
                      className="ml-1 rounded-xs p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <X className="size-3" />
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border border-border/40 shadow-lg" align="end">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(selected) => {
                    setDueDate(selected)
                    setIsDatePickerOpen(false)
                  }}
                  initialFocus
                />
                {dueDate && (
                  <div className="p-2 border-t border-border/30 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs w-full text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setDueDate(undefined)
                        setIsDatePickerOpen(false)
                      }}
                    >
                      Clear due date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-0.5">
            <p className="text-[11px] text-muted-foreground/70 hidden sm:block">
              {type === "lent"
                ? "Track money you expect to receive back"
                : "Track money you owe and plan to repay"}
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !amount || !effectiveContactId || contacts.length === 0}
              className="h-8.5 w-full sm:w-auto sm:min-w-[170px] sm:ml-auto gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <HandCoins className="size-3.5" />
              )}
              Record {type === "lent" ? "Loan" : "Borrowing"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
