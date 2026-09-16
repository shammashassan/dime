"use client"

import { useState, useTransition, FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusCircle, Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Wallet, Category } from "@/types"
import { createTransaction } from "@/lib/actions/transactions"
import { getCurrencySymbol } from "@/lib/denomination"
import { cn } from "@/lib/utils"

export interface QuickLogCardProps {
  wallets: Wallet[]
  categories: Category[]
  defaultWalletId?: string
  baseCurrency?: string
  className?: string
}

export function QuickLogCard({
  wallets,
  categories,
  defaultWalletId,
  baseCurrency = "USD",
  className,
}: QuickLogCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const initialWalletId =
    defaultWalletId && wallets.some((w) => w._id?.toString() === defaultWalletId)
      ? defaultWalletId
      : wallets[0]?._id?.toString() || ""

  const [type, setType] = useState<"expense" | "income">("expense")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [walletId, setWalletId] = useState("")

  const effectiveWalletId = walletId || initialWalletId
  const selectedWallet = wallets.find((w) => w._id?.toString() === effectiveWalletId)
  const currency = selectedWallet?.currency || baseCurrency
  const currencySymbol = getCurrencySymbol(currency)

  const filteredCategories = categories.filter((c) => {
    if (Array.isArray(c.type)) {
      return c.type.includes(type)
    }
    return (c.type as string) === type
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!effectiveWalletId) {
      toast.error("Please select a wallet")
      return
    }

    startTransition(async () => {
      try {
        const amountInCents = Math.round(numAmount * 100)
        const res = await createTransaction({
          type,
          amount: amountInCents,
          description: description.trim() || (type === "income" ? "Quick Income" : "Quick Expense"),
          walletId: effectiveWalletId,
          currency,
          categoryId: filteredCategories[0]?._id?.toString() || undefined,
          date: new Date(),
          tags: [],
          isRecurring: false,
        })

        if (res.success) {
          toast.success(`${type === "income" ? "Income" : "Expense"} logged successfully!`, {
            action: {
              label: "View",
              onClick: () => router.push("/transactions"),
            },
          })
          setAmount("")
          setDescription("")
          router.refresh()
        } else {
          toast.error(res.error || "Failed to log transaction")
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to log transaction")
      }
    })
  }

  return (
    <Card
      className={cn(
        "bento-tile flex h-full flex-col gap-3 border-border/50 bg-card p-5 shadow-xs",
        className
      )}
    >
      {/* Top row: Title, Manual Tab Selector for Expense/Income, and Transactions Redirect Button */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          quick log
        </span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/30">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "px-2.5 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer",
                type === "expense"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "px-2.5 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer",
                type === "income"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Income
            </button>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
                asChild
              >
                <Link href="/transactions" aria-label="View all transactions">
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <span>View all transactions</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2 min-w-0">
          {/* Amount with dynamic currency prefix */}
          <InputGroup className="h-9 min-w-0">
            <InputGroupAddon>{currencySymbol}</InputGroupAddon>
            <InputGroupInput
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
              className="font-medium min-w-0"
              aria-label="Amount"
            />
          </InputGroup>

          {/* Wallet Dropdown with clean truncation & currency only in dropdown */}
          <div className="min-w-0">
            <Select value={effectiveWalletId} onValueChange={setWalletId} disabled={isPending}>
              <SelectTrigger
                className="h-9 w-full min-w-0 text-xs truncate [&>span]:truncate [&>span]:min-w-0"
                aria-label="Select wallet"
              >
                <SelectValue placeholder="Select wallet">
                  {selectedWallet?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {wallets.map((w) => {
                    const id = w._id?.toString()
                    if (!id) return null
                    return (
                      <SelectItem key={id} value={id}>
                        <div className="flex items-center justify-between w-full gap-2 min-w-0">
                          <span className="truncate">{w.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0 uppercase">
                            {w.currency}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description and Log Submit Button inside ButtonGroup */}
        <ButtonGroup className="w-full">
          <Input
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            aria-label="Description"
          />
          <Button
            type="submit"
            variant="outline"
            size="icon"
            disabled={isPending || !amount}
            aria-label={`Log ${type === "income" ? "Income" : "Expense"}`}
            title={`Log ${type === "income" ? "Income" : "Expense"}`}
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <PlusCircle />
            )}
          </Button>
        </ButtonGroup>
      </form>
    </Card>
  )
}
