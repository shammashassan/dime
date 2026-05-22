"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Category, Wallet, RecurringRule } from "@/types"
import { createRecurringRule, updateRecurringRule } from "@/lib/actions/recurring"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

const clientRuleSchema = z
  .object({
    description: z.string().min(1, "Description is required").max(100, "Description must be 100 characters or less"),
    walletId: z.string().min(1, "Wallet is required"),
    categoryId: z.string().min(1, "Category is required"),
    type: z.enum(["income", "expense"]),
    amount: z.coerce.number().positive("Amount must be positive"),
    currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
    frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    isActive: z.boolean().default(true),
    tags: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate && data.endDate < data.startDate) {
        return false
      }
      return true
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )

type ClientRuleInput = z.infer<typeof clientRuleSchema>

interface RecurringFormProps {
  categories: Category[]
  wallets: Wallet[]
  initialRule?: RecurringRule
  onSuccess?: () => void
}

export function RecurringForm({ categories, wallets, initialRule, onSuccess }: RecurringFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialRule

  const defaultValues: Partial<ClientRuleInput> = {
    description: initialRule?.description || "",
    walletId: initialRule?.walletId || (wallets[0]?._id?.toString() || ""),
    categoryId: initialRule?.categoryId || "",
    type: initialRule?.type || "expense",
    amount: initialRule?.amount ? initialRule.amount / 100 : undefined,
    currency: initialRule?.currency || (wallets[0]?.currency || "USD"),
    frequency: initialRule?.frequency || "monthly",
    startDate: initialRule?.startDate ? new Date(initialRule.startDate) : new Date(),
    endDate: initialRule?.endDate ? new Date(initialRule.endDate) : null,
    isActive: initialRule?.isActive ?? true,
    tags: initialRule?.tags ? initialRule.tags.join(", ") : "",
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<any>({
    resolver: zodResolver(clientRuleSchema),
    defaultValues,
  })

  const selectedType = watch("type")
  const selectedWalletId = watch("walletId")
  const selectedWallet = wallets.find((w) => w._id.toString() === selectedWalletId)
  const walletCurrency = selectedWallet?.currency || "USD"

  const filteredCategories = categories.filter((c) => {
    if (Array.isArray(c.type)) {
      return c.type.includes(selectedType)
    }
    // Legacy string fallback
    if (c.type === "both") return true
    return c.type === selectedType
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
        ...data,
        amount: amountInCents,
        currency: walletCurrency,
        tags: tagsArray,
        endDate: data.endDate || undefined,
      }

      if (isEditing && initialRule) {
        await updateRecurringRule(initialRule._id.toString(), payload)
        toast.success("Recurring rule updated successfully")
      } else {
        await createRecurringRule(payload)
        toast.success("Recurring rule created successfully")
      }

      router.refresh()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      const errMsg = err.message || "Failed to save recurring rule. Please try again."
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
        {/* Description */}
        <Field data-invalid={!!errors.description}>
          <FieldLabel>Description / Title</FieldLabel>
          <InputGroup>
            <InputGroupInput
              placeholder="e.g. Netflix Subscription, Monthly Rent"
              aria-invalid={!!errors.description}
              {...register("description")}
            />
          </InputGroup>
          {errors.description && <FieldError>{(errors.description as any).message}</FieldError>}
        </Field>

        {/* Rule Type */}
        <Field>
          <FieldLabel>Transaction Type</FieldLabel>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                value={field.value}
                onValueChange={(val) => val && field.onChange(val)}
                variant="outline"
                spacing={0}
                className="w-full flex"
              >
                <ToggleGroupItem value="expense" className="flex-1 rounded-none rounded-l-3xl py-2 text-xs font-semibold">
                  Expense
                </ToggleGroupItem>
                <ToggleGroupItem value="income" className="flex-1 rounded-none rounded-r-3xl py-2 text-xs font-semibold">
                  Income
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          />
        </Field>

        {/* Wallet & Category */}
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
        </div>

        {/* Frequency ToggleGroup */}
        <Field data-invalid={!!errors.frequency}>
          <FieldLabel>Frequency</FieldLabel>
          <Controller
            control={control}
            name="frequency"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                value={field.value}
                onValueChange={(val) => val && field.onChange(val)}
                variant="outline"
                spacing={0}
                className="flex flex-wrap w-full border border-border/30 rounded-3xl overflow-hidden"
              >
                {["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"].map((freq, idx, arr) => (
                  <ToggleGroupItem
                    key={freq}
                    value={freq}
                    className={`flex-1 min-w-[70px] rounded-none py-2 text-[10px] font-bold capitalize ${
                      idx === 0 ? "rounded-l-3xl" : idx === arr.length - 1 ? "rounded-r-3xl" : ""
                    }`}
                  >
                    {freq}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
          {errors.frequency && <FieldError>{(errors.frequency as any).message}</FieldError>}
        </Field>

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
              {...register("amount")}
            />
          </InputGroup>
          {errors.amount && <FieldError>{(errors.amount as any).message}</FieldError>}
        </Field>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field data-invalid={!!errors.startDate}>
            <FieldLabel>Start Date</FieldLabel>
            <Controller
              control={control}
              name="startDate"
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
            {errors.startDate && <FieldError>{(errors.startDate as any).message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.endDate}>
            <FieldLabel>End Date (Optional)</FieldLabel>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-full justify-start text-left font-normal rounded-xl border border-input"
                    >
                      <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                      {field.value ? format(field.value, "PPP") : <span>No end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border border-border/40 shadow-lg" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(val) => field.onChange(val || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.endDate && <FieldError>{(errors.endDate as any).message}</FieldError>}
          </Field>
        </div>

        {/* Tags */}
        <Field data-invalid={!!errors.tags}>
          <FieldLabel>Tags (Comma-separated)</FieldLabel>
          <InputGroup>
            <InputGroupInput
              placeholder="e.g. subscription, monthly, utilities"
              aria-invalid={!!errors.tags}
              {...register("tags")}
            />
          </InputGroup>
          {errors.tags && <FieldError>{(errors.tags as any).message}</FieldError>}
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
        <Button
          type="submit"
          disabled={loading || !isDirty}
          className="w-full md:w-auto px-8 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isEditing ? "Update Rule" : "Create Rule"}
        </Button>
      </div>
    </form>
  )
}
