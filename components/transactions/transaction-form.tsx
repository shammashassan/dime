"use client"

import { useState, useEffect } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Category, Wallet, Transaction } from "@/types"
import { createTransaction, updateTransaction, getTransactionWalletId } from "@/lib/actions/transactions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput, InputGroupTextarea } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup, FieldContent, FieldTitle, FieldDescription } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Loader2, Sparkles, Trash2, Plus } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { ReceiptScannerModal } from "@/components/transactions/receipt-scanner-modal"
import { generateSplitId, validateSplits } from "@/lib/split-utils"

const clientSchema = z
  .object({
    walletId: z.string().min(1, "Wallet is required"),
    categoryId: z.string().optional(),
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.coerce.number().positive("Amount must be positive"),
    currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
    description: z.string().min(1, "Description is required").max(100, "Description must be 100 characters or less"),
    notes: z.string().optional(),
    date: z.coerce.date(),
    tags: z.string().optional(),
    targetWalletId: z.string().optional(),
    isRecurring: z.boolean().default(false),
    isFlagged: z.boolean().default(false),
    needsReview: z.boolean().default(false),
    isSplit: z.boolean().default(false),
    splitMode: z.enum(["amount", "percentage", "equal"]).default("amount"),
    splits: z
      .array(
        z.object({
          id: z.string().optional(),
          categoryId: z.string().min(1, "Category is required"),
          amount: z.coerce.number().positive("Split amount must be positive"),
          percentage: z.coerce.number().optional(),
          notes: z.string().optional(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.type === "transfer" && !data.targetWalletId) {
        return false
      }
      return true
    },
    {
      message: "Target wallet is required for transfers",
      path: ["targetWalletId"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "transfer" && data.walletId === data.targetWalletId) {
        return false
      }
      return true
    },
    {
      message: "Source and target wallets must be different",
      path: ["targetWalletId"],
    }
  )
  .refine(
    (data) => {
      if (data.isSplit && data.type !== "transfer") {
        if (!data.splits || data.splits.length < 2) {
          return false
        }
      }
      return true
    },
    {
      message: "At least 2 splits are required",
      path: ["splits"],
    }
  )
  .refine(
    (data) => {
      if (data.isSplit && data.type !== "transfer" && data.splits && data.splits.length > 0) {
        const sum = data.splits.reduce((acc, s) => acc + (s.amount || 0), 0)
        return Math.abs(sum - data.amount) < 0.015
      }
      return true
    },
    {
      message: "The sum of splits must equal the total transaction amount",
      path: ["amount"],
    }
  )
  .refine(
    (data) => {
      if (data.isSplit && data.type !== "transfer" && data.splitMode === "percentage" && data.splits && data.splits.length > 0) {
        const sum = data.splits.reduce((acc, s) => acc + (s.percentage || 0), 0)
        return Math.abs(sum - 100) < 0.01
      }
      return true
    },
    {
      message: "The sum of percentages must equal 100%",
      path: ["splits"],
    }
  )

type ClientFormInput = z.infer<typeof clientSchema>

interface TransactionFormProps {
  categories: Category[]
  wallets: Wallet[]
  transactions?: Transaction[]
  initialTransaction?: Transaction
  onSuccess?: () => void
}

export function TransactionForm({
  categories,
  wallets,
  transactions = [],
  initialTransaction,
  onSuccess,
}: TransactionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const isEditing = !!initialTransaction

  const handleScanComplete = (scanned: any) => {
    setValue("description", scanned.merchant || scanned.description, { shouldDirty: true })
    setValue("amount", scanned.amount / 100, { shouldDirty: true })
    setValue("date", scanned.date, { shouldDirty: true })
    setValue("type", "expense", { shouldDirty: true })

    // Find matching category
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === scanned.categoryName.toLowerCase()
    )
    if (matchedCategory) {
      setValue("categoryId", matchedCategory._id.toString(), { shouldDirty: true })
    }

    // Select first wallet with matching currency if available
    const matchedWallet = wallets.find(
      (w) => w.currency.toUpperCase() === scanned.currency.toUpperCase() && !w.isArchived
    )
    if (matchedWallet) {
      setValue("walletId", matchedWallet._id.toString(), { shouldDirty: true })
      setValue("currency", matchedWallet.currency)
    }

    toast.success("Autofilled form from receipt!")
  }

  // Attempt to pre-resolve source and target wallets if counterpart transaction is in local list
  let initialWalletId = initialTransaction?.walletId || (wallets[0]?._id?.toString() || "")
  let initialTargetWalletId: string | undefined = undefined

  if (initialTransaction?.type === "transfer" && initialTransaction.linkedTransactionId) {
    const counterpart = transactions.find(
      (tx) => tx._id.toString() === initialTransaction.linkedTransactionId
    )
    if (counterpart) {
      if (initialTransaction.transferType === "credit") {
        initialWalletId = counterpart.walletId
        initialTargetWalletId = initialTransaction.walletId
      } else {
        initialWalletId = initialTransaction.walletId
        initialTargetWalletId = counterpart.walletId
      }
    }
  }

  // If editing, convert amount in cents to decimal format, and tags array to comma-separated string
  let initialDate = new Date()
  if (initialTransaction?.date) {
    const d = new Date(initialTransaction.date)
    initialDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }

  let initialIsSplit = false
  let initialSplitMode: "amount" | "percentage" | "equal" = "amount"
  let initialSplits: any[] = []

  if (initialTransaction?.splits && initialTransaction.splits.length > 0) {
    initialIsSplit = true
    initialSplitMode = initialTransaction.splitMode || "amount"
    initialSplits = initialTransaction.splits.map((s) => ({
      id: s.id,
      categoryId: s.categoryId,
      amount: s.amount / 100,
      percentage: s.percentage || Math.round((s.amount / initialTransaction.amount) * 100),
      notes: s.notes || "",
    }))
  }

  const defaultValues: Partial<ClientFormInput> = {
    type: initialTransaction?.type || "expense",
    walletId: initialWalletId,
    targetWalletId: initialTargetWalletId,
    categoryId: initialTransaction?.categoryId || "uncategorized",
    amount: initialTransaction?.amount ? initialTransaction.amount / 100 : undefined,
    currency: initialTransaction?.currency || (wallets[0]?.currency || "USD"),
    description: initialTransaction?.description || "",
    notes: initialTransaction?.notes || "",
    date: initialDate,
    tags: initialTransaction?.tags ? initialTransaction.tags.join(", ") : "",
    isRecurring: initialTransaction?.isRecurring || false,
    isFlagged: initialTransaction?.isFlagged || false,
    needsReview: initialTransaction?.needsReview || false,
    isSplit: initialIsSplit,
    splitMode: initialSplitMode,
    splits: initialSplits,
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<any>({
    resolver: zodResolver(clientSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "splits",
  })

  const isSplit = watch("isSplit")
  const splitMode = watch("splitMode")
  const splits = watch("splits") || []
  const totalAmount = watch("amount") || 0

  // Recalculate equal splits automatically
  useEffect(() => {
    if (isSplit && splitMode === "equal" && fields.length > 0 && totalAmount > 0) {
      const cents = Math.round(totalAmount * 100)
      const baseAmountCents = Math.floor(cents / fields.length)
      const remainderCents = cents % fields.length

      fields.forEach((field, index) => {
        const splitAmountCents = baseAmountCents + (index < remainderCents ? 1 : 0)
        const splitAmount = splitAmountCents / 100
        setValue(`splits.${index}.amount`, splitAmount, { shouldDirty: true })
      })
    }
  }, [totalAmount, splitMode, fields.length, isSplit, setValue])

  // Recalculate percentage defaults when changing to percentage mode
  useEffect(() => {
    if (isSplit && splitMode === "percentage" && fields.length > 0) {
      const basePct = Math.floor(100 / fields.length)
      const remainderPct = 100 % fields.length

      fields.forEach((field, index) => {
        const pct = basePct + (index < remainderPct ? 1 : 0)
        setValue(`splits.${index}.percentage`, pct, { shouldDirty: true })
      })
    }
  }, [splitMode, fields.length, isSplit, setValue])

  // Hook to resolve counterpart transaction's wallet on mount/edit if not in local list
  useEffect(() => {
    if (initialTransaction?.type === "transfer" && initialTransaction.linkedTransactionId) {
      // 1. Try local resolution first
      const counterpart = transactions.find(
        (tx) => tx._id.toString() === initialTransaction.linkedTransactionId
      )
      if (counterpart) {
        if (initialTransaction.transferType === "credit") {
          setValue("walletId", counterpart.walletId, { shouldDirty: false })
          setValue("targetWalletId", initialTransaction.walletId, { shouldDirty: false })
        } else {
          setValue("walletId", initialTransaction.walletId, { shouldDirty: false })
          setValue("targetWalletId", counterpart.walletId, { shouldDirty: false })
        }
        return
      }

      // 2. Fetch from server if not found in the local list
      getTransactionWalletId(initialTransaction.linkedTransactionId).then((linkedWalletId) => {
        if (linkedWalletId) {
          if (initialTransaction.transferType === "credit") {
            setValue("walletId", linkedWalletId, { shouldDirty: false })
            setValue("targetWalletId", initialTransaction.walletId, { shouldDirty: false })
          } else {
            setValue("walletId", initialTransaction.walletId, { shouldDirty: false })
            setValue("targetWalletId", linkedWalletId, { shouldDirty: false })
          }
        }
      })
    }
  }, [initialTransaction, setValue, transactions])

  const type = watch("type")
  const selectedWalletId = watch("walletId")

  // Find the selected wallet to display its currency
  const selectedWallet = wallets.find((w) => w._id.toString() === selectedWalletId)
  const walletCurrency = selectedWallet?.currency || "USD"

  // Filter categories by type
  const filteredCategories = categories.filter((c) => {
    if (type === "transfer") return true // transfers can use any category or transfer categories
    if (Array.isArray(c.type)) {
      return c.type.includes(type as any)
    }
    if (c.type === "both") return true
    return c.type === type
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    const savePromise = new Promise(async (resolve, reject) => {
      try {
        const tagsArray = data.tags
          ? data.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
          : []

        const amountInCents = Math.round(data.amount * 100)
        let finalSplits = undefined
        let finalSplitMode = undefined

        if (data.isSplit && data.type !== "transfer" && data.splits && data.splits.length > 0) {
          finalSplitMode = data.splitMode
          if (data.splitMode === "percentage") {
            const percentages = data.splits.map((s: any) => parseFloat(s.percentage) || 0)
            let accumulatedCents = 0
            finalSplits = data.splits.map((s: any, idx: number) => {
              let splitCents = 0
              if (idx === data.splits.length - 1) {
                splitCents = amountInCents - accumulatedCents
              } else {
                splitCents = Math.round(amountInCents * (parseFloat(s.percentage) / 100))
                accumulatedCents += splitCents
              }
              return {
                id: s.id || generateSplitId(),
                categoryId: s.categoryId,
                amount: splitCents,
                percentage: parseFloat(s.percentage),
                notes: s.notes || undefined,
              }
            })
          } else if (data.splitMode === "equal") {
            const baseCents = Math.floor(amountInCents / data.splits.length)
            const remainderCents = amountInCents % data.splits.length
            finalSplits = data.splits.map((s: any, idx: number) => {
              const splitCents = baseCents + (idx < remainderCents ? 1 : 0)
              return {
                id: s.id || generateSplitId(),
                categoryId: s.categoryId,
                amount: splitCents,
                notes: s.notes || undefined,
              }
            })
          } else {
            let accumulatedCents = 0
            finalSplits = data.splits.map((s: any, idx: number) => {
              let splitCents = 0
              if (idx === data.splits.length - 1) {
                splitCents = amountInCents - accumulatedCents
              } else {
                splitCents = Math.round((parseFloat(s.amount) || 0) * 100)
                accumulatedCents += splitCents
              }
              return {
                id: s.id || generateSplitId(),
                categoryId: s.categoryId,
                amount: splitCents,
                notes: s.notes || undefined,
              }
            })
          }
        }

        const payload = {
          walletId: data.walletId,
          categoryId: data.isSplit && data.type !== "transfer" ? undefined : (data.categoryId && data.categoryId !== "uncategorized" ? data.categoryId : undefined),
          type: data.type,
          amount: amountInCents,
          currency: walletCurrency,
          description: data.description,
          notes: data.notes || undefined,
          date: new Date(format(data.date, "yyyy-MM-dd") + "T00:00:00.000Z"),
          tags: tagsArray,
          targetWalletId: data.type === "transfer" ? data.targetWalletId : undefined,
          isRecurring: data.isRecurring,
          isFlagged: data.isFlagged,
          needsReview: data.needsReview,
          splitMode: finalSplitMode,
          splits: finalSplits,
        }

        let result
        if (isEditing && initialTransaction) {
          result = await updateTransaction(initialTransaction._id.toString(), payload)
        } else {
          result = await createTransaction(payload)
        }

        if (result && !result.success) {
          reject(new Error(result.error || "Unauthorized"))
          return
        }

        router.refresh()
        if (onSuccess) onSuccess()
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })

    toast.promise(savePromise, {
      loading: isEditing ? "Saving changes..." : "Creating transaction...",
      success: isEditing ? "Transaction updated successfully" : "Transaction created successfully",
      error: (err: any) => {
        const errMsg = err.message || "Something went wrong. Please try again."
        setError(errMsg)
        return errMsg
      },
    })

    try {
      await savePromise
    } catch (err) {
      console.error("Form submit error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!isEditing && (
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-foreground">Have a receipt?</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Scan it to auto-fill the transaction details.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setScannerOpen(true)}
            className="rounded-lg font-bold border-primary/20 text-primary hover:bg-primary/5 cursor-pointer"
          >
            Scan Receipt
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        <FieldGroup>
          {/* Transaction Type */}
          <Field>
            <FieldLabel>Transaction Type</FieldLabel>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={(val) => {
                    if (val) {
                      field.onChange(val)
                      // If transfer, target categories might change, let's keep it clean
                    }
                  }}
                  variant="outline"
                  spacing={0}
                  className="w-full flex"
                >
                  <ToggleGroupItem value="expense" className="flex-1 rounded-none rounded-l-3xl py-2 text-xs font-semibold">
                    Expense
                  </ToggleGroupItem>
                  <ToggleGroupItem value="income" className="flex-1 rounded-none py-2 text-xs font-semibold">
                    Income
                  </ToggleGroupItem>
                  <ToggleGroupItem value="transfer" className="flex-1 rounded-none rounded-r-3xl py-2 text-xs font-semibold">
                    Transfer
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            />
          </Field>

          {/* Source Wallet and Target Wallet (if transfer) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.walletId}>
              <FieldLabel>Wallet</FieldLabel>
              <Controller
                control={control}
                name="walletId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val)
                      // Update currency based on selected wallet
                      const w = wallets.find((x) => x._id.toString() === val)
                      if (w) setValue("currency", w.currency)
                    }}
                  >
                    <SelectTrigger aria-invalid={!!errors.walletId} className="h-10 rounded-xl">
                      <SelectValue placeholder="Select Wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((w) => (
                        <SelectItem key={w._id.toString()} value={w._id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                            <span>{w.name} ({w.currency})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.walletId && <FieldError>{(errors.walletId as any).message}</FieldError>}
            </Field>

            {type === "transfer" && (
              <Field data-invalid={!!errors.targetWalletId}>
                <FieldLabel>Destination Wallet</FieldLabel>
                <Controller
                  control={control}
                  name="targetWalletId"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.targetWalletId} className="h-10 rounded-xl">
                        <SelectValue placeholder="Select Destination Wallet" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets
                          .filter((w) => w._id.toString() !== selectedWalletId)
                          .map((w) => (
                            <SelectItem key={w._id.toString()} value={w._id.toString()}>
                              <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                                <span>{w.name} ({w.currency})</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.targetWalletId && <FieldError>{(errors.targetWalletId as any).message}</FieldError>}
              </Field>
            )}
          </div>

          {/* Split Switch Toggle */}
          {type !== "transfer" && (
            <FieldLabel htmlFor="switch-split" className="cursor-pointer">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Split Transaction</FieldTitle>
                  <FieldDescription>
                    Allocate this transaction to multiple categories
                  </FieldDescription>
                </FieldContent>
                <Controller
                  control={control}
                  name="isSplit"
                  render={({ field }) => (
                    <Switch
                      id="switch-split"
                      checked={field.value}
                      onCheckedChange={(val) => {
                        field.onChange(val)
                        if (val) {
                          setValue("splits", [
                            { id: generateSplitId(), categoryId: "", amount: 0, percentage: 50, notes: "" },
                            { id: generateSplitId(), categoryId: "", amount: 0, percentage: 50, notes: "" },
                          ], { shouldDirty: true })
                        } else {
                          setValue("splits", undefined, { shouldDirty: true })
                        }
                      }}
                    />
                  )}
                />
              </Field>
            </FieldLabel>
          )}

          {/* Category and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.categoryId}>
              <FieldLabel>Category</FieldLabel>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    disabled={isSplit}
                    value={isSplit ? undefined : field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger disabled={isSplit} aria-invalid={!!errors.categoryId}>
                      <SelectValue placeholder={isSplit ? "Splits Enabled" : "Select Category (Optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="size-2.5 rounded-full bg-muted-foreground/30 shrink-0" />
                          <span className="font-semibold">Uncategorized</span>
                        </div>
                      </SelectItem>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c._id.toString()} value={c._id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            <span>{c.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {!isSplit && errors.categoryId && <FieldError>{(errors.categoryId as any).message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.date}>
              <FieldLabel>Date</FieldLabel>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start"
                      >
                        <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border border-border/40 shadow-lg" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(val) => val && field.onChange(val)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && <FieldError>{(errors.date as any).message}</FieldError>}
            </Field>
          </div>

          {/* Amount */}
          <Field data-invalid={!!errors.amount}>
            <FieldLabel>Amount</FieldLabel>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>{walletCurrency}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.amount}
                className="text-base font-semibold"
                {...register("amount", { valueAsNumber: true })}
              />
            </InputGroup>
            {errors.amount && <FieldError>{(errors.amount as any).message}</FieldError>}
          </Field>

          {/* Splits Builder */}
          {isSplit && type !== "transfer" && (
            <div className="p-4 sm:p-5 rounded-2xl border border-border/40 bg-muted/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Category Splits Breakdown
                </h4>
                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name="splitMode"
                    render={({ field }) => (
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={(val) => {
                          if (val) field.onChange(val)
                        }}
                        variant="outline"
                        spacing={0}
                        className="flex"
                      >
                        <ToggleGroupItem value="amount" className="px-2.5 py-1 text-[10px] font-bold rounded-none rounded-l-lg h-7">
                          Amount
                        </ToggleGroupItem>
                        <ToggleGroupItem value="percentage" className="px-2.5 py-1 text-[10px] font-bold rounded-none h-7">
                          Percent
                        </ToggleGroupItem>
                        <ToggleGroupItem value="equal" className="px-2.5 py-1 text-[10px] font-bold rounded-none rounded-r-lg h-7">
                          Equal
                        </ToggleGroupItem>
                      </ToggleGroup>
                    )}
                  />
                </div>
              </div>

              {/* Splits List */}
              <div className="space-y-4">
                {fields.map((fieldItem, idx) => {
                  const splitError = (errors.splits as any)?.[idx]
                  return (
                    <div key={fieldItem.id} className="flex flex-col gap-3.5 p-4 bg-background border border-border/85 rounded-2xl shadow-xs relative">
                      {/* Card Header Row */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Split {idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={fields.length <= 2}
                          onClick={() => remove(idx)}
                          className="size-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      {/* Input fields in equal-width 2-column grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Split Category Select */}
                        <div className="flex flex-col gap-1 text-left">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                            Category
                          </label>
                          <Controller
                            control={control}
                            name={`splits.${idx}.categoryId`}
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="h-10 rounded-xl text-xs w-full border-border/60">
                                  <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredCategories.map((c) => (
                                    <SelectItem key={c._id.toString()} value={c._id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                        <span>{c.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        {/* Split Value Input (Amount or Percentage) */}
                        <div className="flex flex-col gap-1 text-left">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                            {splitMode === "percentage" ? "Percentage" : "Amount"}
                          </label>
                          <InputGroup>
                            <InputGroupAddon>
                              <InputGroupText className="text-xs">
                                {splitMode === "percentage" ? "%" : walletCurrency}
                              </InputGroupText>
                            </InputGroupAddon>
                            {splitMode === "percentage" ? (
                              <InputGroupInput
                                type="number"
                                step="any"
                                placeholder="0"
                                className="text-xs text-left pr-3"
                                {...register(`splits.${idx}.percentage`, { valueAsNumber: true })}
                              />
                            ) : (
                              <InputGroupInput
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="text-xs text-left pr-3"
                                disabled={splitMode === "equal"}
                                {...register(`splits.${idx}.amount`, { valueAsNumber: true })}
                              />
                            )}
                          </InputGroup>
                        </div>
                      </div>

                      {/* Optional Notes for this Split */}
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                          Split Notes
                        </label>
                        <InputGroup className="h-9 rounded-xl border-border/60 bg-muted/5">
                          <InputGroupInput
                            placeholder="Add split notes (optional)..."
                            className="h-9 text-xs"
                            {...register(`splits.${idx}.notes`)}
                          />
                        </InputGroup>
                      </div>

                      {/* Display calculated values when in percentage mode */}
                      {splitMode === "percentage" && (
                        <div className="text-[10px] text-muted-foreground pl-1.5 mt-0.5 text-left font-medium">
                          Calculated Amount: {walletCurrency} {((totalAmount * (watch(`splits.${idx}.percentage`) || 0)) / 100).toFixed(2)}
                        </div>
                      )}

                      {/* Individual split errors */}
                      {splitError && (
                        <div className="text-[10px] text-destructive font-semibold mt-1 text-left">
                          {splitError.categoryId?.message || splitError.amount?.message || splitError.percentage?.message}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Splits Footer Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ id: generateSplitId(), categoryId: "", amount: 0, percentage: 0, notes: "" })}
                  className="rounded-xl h-9 text-xs font-semibold gap-1 hover:bg-muted/50 cursor-pointer w-full sm:w-auto"
                >
                  <Plus className="size-3.5" /> Add Split Category
                </Button>

                {/* Status Indicator */}
                <div className="flex items-center justify-end gap-2.5">
                  {splitMode === "percentage" ? (
                    (() => {
                      const sumPct = splits.reduce((acc: number, s: any) => acc + (parseFloat(s.percentage) || 0), 0)
                      const diff = 100 - sumPct
                      return (
                        <Badge
                          variant="outline"
                          className={`text-xs px-2.5 py-1 font-bold ${Math.abs(diff) < 0.01
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                        >
                          {Math.abs(diff) < 0.01 ? "Balanced (100%)" : `Total: ${sumPct}% (Need ${diff > 0 ? "+" : ""}${diff.toFixed(1)}%)`}
                        </Badge>
                      )
                    })()
                  ) : splitMode === "equal" ? (
                    <Badge variant="outline" className="text-xs px-2.5 py-1 font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Auto Balanced (Equal)
                    </Badge>
                  ) : (
                    (() => {
                      const sumAmt = splits.reduce((acc: number, s: any) => acc + (parseFloat(s.amount) || 0), 0)
                      const diff = totalAmount - sumAmt
                      return (
                        <Badge
                          variant="outline"
                          className={`text-xs px-2.5 py-1 font-bold ${Math.abs(diff) < 0.015
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                        >
                          {Math.abs(diff) < 0.015 ? "Balanced" : `Remaining: ${walletCurrency} ${diff.toFixed(2)}`}
                        </Badge>
                      )
                    })()
                  )}
                </div>
              </div>

              {/* Splits General Errors */}
              {errors.splits && !Array.isArray(errors.splits) && (
                <div className="text-xs font-semibold text-destructive mt-1">
                  {(errors.splits as any).message}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <Field data-invalid={!!errors.description}>
            <FieldLabel>Description</FieldLabel>
            <InputGroup>
              <InputGroupInput
                placeholder="e.g. Grocery shopping"
                aria-invalid={!!errors.description}
                {...register("description")}
              />
            </InputGroup>
            {errors.description && <FieldError>{(errors.description as any).message}</FieldError>}
          </Field>

          {/* Notes */}
          <Field data-invalid={!!errors.notes}>
            <FieldLabel>Notes (Optional)</FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                placeholder="Additional details..."
                aria-invalid={!!errors.notes}
                rows={3}
                {...register("notes")}
              />
            </InputGroup>
            {errors.notes && <FieldError>{(errors.notes as any).message}</FieldError>}
          </Field>

          {/* Tags */}
          <Field data-invalid={!!errors.tags}>
            <FieldLabel>Tags (Comma-separated)</FieldLabel>
            <InputGroup>
              <InputGroupInput
                placeholder="e.g. food, weekly, essential"
                aria-invalid={!!errors.tags}
                {...register("tags")}
              />
            </InputGroup>
            {errors.tags && <FieldError>{(errors.tags as any).message}</FieldError>}
          </Field>

          {/* Is Recurring */}
          <div className="flex flex-wrap items-center gap-6 py-2">
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="isRecurring"
                render={({ field }) => (
                  <Checkbox
                    id="isRecurring"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label
                htmlFor="isRecurring"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                This is a recurring transaction
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="isFlagged"
                render={({ field }) => (
                  <Checkbox
                    id="isFlagged"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label
                htmlFor="isFlagged"
                className="text-sm font-medium leading-none cursor-pointer text-rose-600 dark:text-rose-400"
              >
                Flag transaction
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="needsReview"
                render={({ field }) => (
                  <Checkbox
                    id="needsReview"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label
                htmlFor="needsReview"
                className="text-sm leading-none cursor-pointer text-amber-600 dark:text-amber-400 font-semibold"
              >
                Mark needs review
              </label>
            </div>
          </div>
        </FieldGroup>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
          <Button
            type="submit"
            disabled={loading || !isDirty}
            className="w-full md:w-auto px-8 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Transaction"}
          </Button>
        </div>
      </form>

      {!isEditing && (
        <ReceiptScannerModal
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScanComplete={handleScanComplete}
        />
      )}
    </>
  )
}
