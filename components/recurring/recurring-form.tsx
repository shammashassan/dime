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
import { CalendarIcon, Loader2, Repeat, CreditCard, FileText, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const clientRuleSchema = z
  .object({
    kind: z.enum(["recurring", "subscription", "bill"]).default("recurring"),
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

    // Subscription / Bill fields
    providerName: z.string().max(100).optional().nullable(),
    providerUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
    cancellationUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
    trialEndDate: z.coerce.date().optional().nullable(),
    reminderDaysBefore: z.coerce.number().int().min(0).max(60).optional().nullable(),
    status: z.enum(["active", "trial", "paused", "cancelled", "expired"]).optional().nullable(),
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
    kind: (initialRule?.kind as any) || "recurring",
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

    providerName: initialRule?.providerName || "",
    providerUrl: initialRule?.providerUrl || "",
    cancellationUrl: initialRule?.cancellationUrl || "",
    trialEndDate: initialRule?.trialEndDate ? new Date(initialRule.trialEndDate) : null,
    reminderDaysBefore: initialRule?.reminderDaysBefore ?? 3,
    status: initialRule?.status || "active",
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
  const selectedKind = watch("kind")
  const selectedWallet = wallets.find((w) => w._id.toString() === selectedWalletId)
  const walletCurrency = selectedWallet?.currency || "USD"

  const filteredCategories = categories.filter((c) => {
    // If it's a subscription or bill, we probably lock it to "expense" below,
    // but visually we filter to match the selectedType
    if (Array.isArray(c.type)) {
      return c.type.includes(selectedType)
    }
    if (c.type === "both") return true
    return c.type === selectedType
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

        if (data.kind === "subscription" && !tagsArray.includes("subscription")) {
          tagsArray.push("subscription")
        }

        const amountInCents = Math.round(data.amount * 100)

        const payload = {
          ...data,
          amount: amountInCents,
          currency: walletCurrency,
          tags: tagsArray,
          endDate: data.endDate || undefined,
        }

        let result
        if (isEditing && initialRule) {
          result = await updateRecurringRule(initialRule._id.toString(), payload)
        } else {
          result = await createRecurringRule(payload)
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
      loading: isEditing ? "Saving changes..." : "Creating recurring rule...",
      success: isEditing ? "Recurring rule updated successfully" : "Recurring rule created successfully",
      error: (err: any) => {
        const errMsg = err.message || "Failed to save recurring rule. Please try again."
        setError(errMsg)
        return errMsg
      },
    })

    try {
      await savePromise
    } catch (err) {
      console.error("Recurring rule save error:", err)
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

      {/* Kind Selector */}
      <Field data-invalid={!!errors.kind}>
        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg text-xs font-semibold">
              {[
                { id: "recurring", label: "Recurring", icon: Repeat },
                { id: "subscription", label: "Subscription", icon: CreditCard },
                { id: "bill", label: "Bill", icon: FileText },
              ].map((k) => {
                const Icon = k.icon
                const isActive = field.value === k.id
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      field.onChange(k.id)
                      if (k.id !== "recurring") {
                        setValue("type", "expense", { shouldDirty: true })
                      }
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all text-center cursor-pointer",
                      isActive
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    {k.label}
                  </button>
                )
              })}
            </div>
          )}
        />
        {errors.kind && <FieldError>{(errors.kind as any).message}</FieldError>}
      </Field>

      <FieldGroup>
        {/* Description */}
        <Field data-invalid={!!errors.description}>
          <FieldLabel>{selectedKind === "subscription" ? "Subscription Name" : selectedKind === "bill" ? "Bill Name" : "Description / Title"}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              placeholder={selectedKind === "subscription" ? "e.g. Netflix" : "e.g. Rent, Utilities"}
              aria-invalid={!!errors.description}
              {...register("description")}
            />
          </InputGroup>
          {errors.description && <FieldError>{(errors.description as any).message}</FieldError>}
        </Field>

        {/* Rule Type - Only show for standard recurring, since Subs/Bills are typically expenses */}
        <div className={cn("transition-all duration-300 overflow-hidden", selectedKind === "recurring" ? "opacity-100 max-h-24" : "opacity-0 max-h-0 hidden")}>
          <Field>
            <FieldLabel>Transaction Type</FieldLabel>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg text-xs font-semibold">
                  {[
                    { value: "expense", label: "Expense", icon: ArrowDownRight },
                    { value: "income", label: "Income", icon: ArrowUpRight },
                  ].map((t) => {
                    const Icon = t.icon
                    const isSelected = field.value === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => field.onChange(t.value)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all text-center cursor-pointer",
                          isSelected
                            ? "bg-background text-foreground shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </Field>
        </div>

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

        {/* Frequency & Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <Field data-invalid={!!errors.frequency}>
            <FieldLabel>Billing Cycle</FieldLabel>
            <Controller
              control={control}
              name="frequency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="capitalize">
                    <SelectValue placeholder="Select Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"].map((freq) => (
                      <SelectItem key={freq} value={freq} className="capitalize">
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.frequency && <FieldError>{(errors.frequency as any).message}</FieldError>}
          </Field>
        </div>

        {/* Start Date & End Date/Trial End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field data-invalid={!!errors.startDate}>
            <FieldLabel>{selectedKind === "subscription" ? "Next Billing Date" : "Start Date"}</FieldLabel>
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

          {selectedKind === "recurring" ? (
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
          ) : (
            <Field data-invalid={!!errors.trialEndDate}>
              <FieldLabel>Trial End Date (Optional)</FieldLabel>
              <Controller
                control={control}
                name="trialEndDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-full justify-start text-left font-normal rounded-xl border border-input"
                      >
                        <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                        {field.value ? format(field.value, "PPP") : <span>No trial</span>}
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
              {errors.trialEndDate && <FieldError>{(errors.trialEndDate as any).message}</FieldError>}
            </Field>
          )}
        </div>

        {/* Subscription / Bill specific fields */}
        {selectedKind !== "recurring" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field data-invalid={!!errors.status}>
                <FieldLabel>Status</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.status} className="h-10 rounded-xl">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {["active", "trial", "paused", "cancelled", "expired"].map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && <FieldError>{(errors.status as any).message}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.reminderDaysBefore}>
                <FieldLabel>Reminder (Days Before)</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    min="0"
                    max="60"
                    aria-invalid={!!errors.reminderDaysBefore}
                    {...register("reminderDaysBefore", { valueAsNumber: true })}
                  />
                </InputGroup>
                {errors.reminderDaysBefore && <FieldError>{(errors.reminderDaysBefore as any).message}</FieldError>}
              </Field>
            </div>

            <Field data-invalid={!!errors.cancellationUrl}>
              <FieldLabel>Cancellation URL (Optional)</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  type="url"
                  placeholder="https://..."
                  aria-invalid={!!errors.cancellationUrl}
                  {...register("cancellationUrl")}
                />
              </InputGroup>
              {errors.cancellationUrl && <FieldError>{(errors.cancellationUrl as any).message}</FieldError>}
            </Field>
          </>
        )}

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
