"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Category, Wallet, Transaction } from "@/types"
import { createTransaction, updateTransaction, getTransactionWalletId } from "@/lib/actions/transactions"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput, InputGroupTextarea } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

const clientSchema = z
  .object({
    walletId: z.string().min(1, "Wallet is required"),
    categoryId: z.string().min(1, "Category is required"),
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.coerce.number().positive("Amount must be positive"),
    currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
    description: z.string().min(1, "Description is required").max(100, "Description must be 100 characters or less"),
    notes: z.string().optional(),
    date: z.coerce.date(),
    tags: z.string().optional(),
    targetWalletId: z.string().optional(),
    isRecurring: z.boolean().default(false),
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

  const isEditing = !!initialTransaction

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
  const defaultValues: Partial<ClientFormInput> = {
    type: initialTransaction?.type || "expense",
    walletId: initialWalletId,
    targetWalletId: initialTargetWalletId,
    categoryId: initialTransaction?.categoryId || "",
    amount: initialTransaction?.amount ? initialTransaction.amount / 100 : undefined,
    currency: initialTransaction?.currency || (wallets[0]?.currency || "USD"),
    description: initialTransaction?.description || "",
    notes: initialTransaction?.notes || "",
    date: initialTransaction?.date ? new Date(initialTransaction.date) : new Date(),
    tags: initialTransaction?.tags ? initialTransaction.tags.join(", ") : "",
    isRecurring: initialTransaction?.isRecurring || false,
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

    try {
      const tagsArray = data.tags
        ? data.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : []

      const amountInCents = Math.round(data.amount * 100)

      const payload = {
        walletId: data.walletId,
        categoryId: data.categoryId,
        type: data.type,
        amount: amountInCents,
        currency: walletCurrency,
        description: data.description,
        notes: data.notes || undefined,
        date: data.date,
        tags: tagsArray,
        targetWalletId: data.type === "transfer" ? data.targetWalletId : undefined,
        isRecurring: data.isRecurring,
      }

      if (isEditing && initialTransaction) {
        await updateTransaction(initialTransaction._id.toString(), payload)
        toast.success("Transaction updated successfully")
      } else {
        await createTransaction(payload)
        toast.success("Transaction created successfully")
      }

      router.refresh()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      const errMsg = err.message || "Something went wrong. Please try again."
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
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

        {/* Category and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field data-invalid={!!errors.categoryId}>
            <FieldLabel>Category</FieldLabel>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.categoryId} className="h-10 rounded-xl">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c._id.toString()} value={c._id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          <span>{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && <FieldError>{(errors.categoryId as any).message}</FieldError>}
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
                      className="h-10 w-full justify-start text-left font-normal rounded-xl border border-input"
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
        <div className="flex items-center gap-2 py-2">
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
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            This is a recurring transaction
          </label>
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
  )
}
