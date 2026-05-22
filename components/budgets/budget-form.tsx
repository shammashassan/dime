"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Category, Wallet, Budget } from "@/types"
import { createBudget, updateBudget } from "@/lib/actions/budgets"
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

const clientBudgetSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
    categoryId: z.string().min(1, "Category is required"),
    walletId: z.string().optional().nullable(),
    amount: z.coerce.number().positive("Budget limit must be positive"),
    currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
    period: z.enum(["daily", "weekly", "monthly", "yearly"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    alertThreshold: z.coerce.number().min(0).max(100).default(80),
    isActive: z.boolean().default(true),
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

type ClientBudgetInput = z.infer<typeof clientBudgetSchema>

interface BudgetFormProps {
  categories: Category[]
  wallets: Wallet[]
  initialBudget?: Budget
  onSuccess?: () => void
}

export function BudgetForm({ categories, wallets, initialBudget, onSuccess }: BudgetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialBudget

  const defaultValues: Partial<ClientBudgetInput> = {
    name: initialBudget?.name || "",
    categoryId: initialBudget?.categoryId || "",
    walletId: initialBudget?.walletId || null,
    amount: initialBudget?.amount ? initialBudget.amount / 100 : undefined,
    currency: initialBudget?.currency || (wallets[0]?.currency || "USD"),
    period: initialBudget?.period || "monthly",
    startDate: initialBudget?.startDate ? new Date(initialBudget.startDate) : new Date(),
    endDate: initialBudget?.endDate ? new Date(initialBudget.endDate) : null,
    alertThreshold: initialBudget?.alertThreshold ?? 80,
    isActive: initialBudget?.isActive ?? true,
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<any>({
    resolver: zodResolver(clientBudgetSchema),
    defaultValues,
  })

  const selectedCurrency = watch("currency")

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      const amountInCents = Math.round(data.amount * 100)
      const payload = {
        ...data,
        amount: amountInCents,
        walletId: data.walletId || undefined,
        endDate: data.endDate || undefined,
      }

      if (isEditing && initialBudget) {
        await updateBudget(initialBudget._id.toString(), payload)
        toast.success("Budget updated successfully")
      } else {
        await createBudget(payload)
        toast.success("Budget created successfully")
      }

      router.refresh()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      const errMsg = err.message || "Failed to save budget. Please try again."
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
        {/* Name */}
        <Field data-invalid={!!errors.name}>
          <FieldLabel>Budget Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              placeholder="e.g. Monthly Groceries"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </InputGroup>
          {errors.name && <FieldError>{(errors.name as any).message}</FieldError>}
        </Field>

        {/* Category */}
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
                  {categories.map((c) => (
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

        {/* Wallet (Optional) */}
        <Field data-invalid={!!errors.walletId}>
          <FieldLabel>Wallet (Optional)</FieldLabel>
          <Controller
            control={control}
            name="walletId"
            render={({ field }) => (
              <Select
                value={field.value || "all_wallets"}
                onValueChange={(val) => {
                  if (val === "all_wallets") {
                    field.onChange(null)
                  } else {
                    field.onChange(val)
                    const w = wallets.find((x) => x._id.toString() === val)
                    if (w) setValue("currency", w.currency)
                  }
                }}
              >
                <SelectTrigger aria-invalid={!!errors.walletId} className="h-10 rounded-xl">
                  <SelectValue placeholder="All Wallets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_wallets">All Wallets</SelectItem>
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

        {/* Period */}
        <Field data-invalid={!!errors.period}>
          <FieldLabel>Budget Period</FieldLabel>
          <Controller
            control={control}
            name="period"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                value={field.value}
                onValueChange={(val) => val && field.onChange(val)}
                variant="outline"
                spacing={0}
                className="w-full flex"
              >
                <ToggleGroupItem value="daily" className="flex-1 rounded-none rounded-l-3xl py-2 text-xs font-semibold">
                  Daily
                </ToggleGroupItem>
                <ToggleGroupItem value="weekly" className="flex-1 rounded-none py-2 text-xs font-semibold">
                  Weekly
                </ToggleGroupItem>
                <ToggleGroupItem value="monthly" className="flex-1 rounded-none py-2 text-xs font-semibold">
                  Monthly
                </ToggleGroupItem>
                <ToggleGroupItem value="yearly" className="flex-1 rounded-none rounded-r-3xl py-2 text-xs font-semibold">
                  Yearly
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          />
          {errors.period && <FieldError>{(errors.period as any).message}</FieldError>}
        </Field>

        {/* Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field data-invalid={!!errors.amount}>
            <FieldLabel>Limit Amount</FieldLabel>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>{selectedCurrency}</InputGroupText>
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

          <Field data-invalid={!!errors.alertThreshold}>
            <FieldLabel>Alert Threshold (%)</FieldLabel>
            <InputGroup>
              <InputGroupInput
                type="number"
                min="0"
                max="100"
                placeholder="80"
                aria-invalid={!!errors.alertThreshold}
                {...register("alertThreshold")}
              />
            </InputGroup>
            {errors.alertThreshold && <FieldError>{(errors.alertThreshold as any).message}</FieldError>}
          </Field>
        </div>

        {/* Start Date and End Date */}
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
      </FieldGroup>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
        <Button
          type="submit"
          disabled={loading || !isDirty}
          className="w-full md:w-auto px-8 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isEditing ? "Update Budget" : "Create Budget"}
        </Button>
      </div>
    </form>
  )
}
