"use client"

import { useState, useTransition, useEffect, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Loader2 } from "lucide-react"
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
import { Wallet, Category } from "@/types"
import { createTransaction } from "@/lib/actions/transactions"
import { getCurrencySymbol } from "@/lib/currency"
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
  const [walletId, setWalletId] = useState(initialWalletId)
  const [categoryId, setCategoryId] = useState("")

  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      const fallback =
        defaultWalletId && wallets.some((w) => w._id?.toString() === defaultWalletId)
          ? defaultWalletId
          : wallets[0]?._id?.toString() || ""
      setWalletId(fallback)
    }
  }, [wallets, defaultWalletId, walletId])

  const selectedWallet = wallets.find((w) => w._id?.toString() === walletId)
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
    if (!walletId) {
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
          walletId,
          currency,
          categoryId: categoryId || filteredCategories[0]?._id?.toString() || undefined,
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
        "bento-tile flex h-full flex-col justify-between border-border/50 bg-card/60 p-5 shadow-xs backdrop-blur-xs",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          quick log
        </span>
        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(val) => {
            if (val) setType(val as "expense" | "income")
          }}
          className="bg-muted/40 p-0.5 rounded-lg border border-border/50"
        >
          <ToggleGroupItem
            value="expense"
            className="h-6 text-[11px] px-2.5 font-medium data-[state=on]:bg-rose-500/10 data-[state=on]:text-rose-500 data-[state=on]:border-rose-500/20"
          >
            Expense
          </ToggleGroupItem>
          <ToggleGroupItem
            value="income"
            className="h-6 text-[11px] px-2.5 font-medium data-[state=on]:bg-emerald-500/10 data-[state=on]:text-emerald-500 data-[state=on]:border-emerald-500/20"
          >
            Income
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Amount with dynamic currency prefix */}
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
              className="font-medium"
              aria-label="Amount"
            />
          </InputGroup>

          {/* Wallet Dropdown */}
          <Select value={walletId} onValueChange={setWalletId} disabled={isPending}>
            <SelectTrigger className="h-9 text-xs" aria-label="Select wallet">
              <SelectValue placeholder="Select wallet" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {wallets.map((w) => {
                  const id = w._id?.toString()
                  if (!id) return null
                  return (
                    <SelectItem key={id} value={id}>
                      {w.name} ({w.currency})
                    </SelectItem>
                  )
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <InputGroup className="h-9">
          <InputGroupInput
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            className="text-xs"
            aria-label="Description"
          />
        </InputGroup>

        <Button
          type="submit"
          size="sm"
          disabled={isPending || !amount}
          className="h-8.5 w-full gap-1.5 text-xs font-semibold cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <PlusCircle className="size-3.5" />
          )}
          Log {type === "income" ? "Income" : "Expense"}
        </Button>
      </form>
    </Card>
  )
}
