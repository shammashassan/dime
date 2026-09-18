"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Asset, AssetCategory } from "@/types"
import { createAsset, updateAsset } from "@/lib/actions/assets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CalendarIcon,
  Loader2,
  Plus,
  Pencil,
  Percent,
  Layers,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { TickerSearchCombobox } from "@/components/investments/ticker-search-combobox"

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  kind: z.enum(["asset", "liability"]),
  category: z.string().min(1, "Category is required"),
  symbol: z.string().trim().toUpperCase().optional().nullable(),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
  currentValue: z.coerce.number().nonnegative("Value cannot be negative"),
  valuationMethod: z.enum(["manual", "market", "calculated"]).default("manual"),
  ownershipPercentage: z.coerce
    .number()
    .min(0, "Cannot be less than 0")
    .max(100, "Cannot exceed 100")
    .default(100),
  acquiredAt: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
})

type FormInput = z.infer<typeof formSchema>

const CURRENCIES = ["USD", "INR", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD"]

const ASSET_CATEGORIES = [
  { value: "real_estate", label: "Real Estate" },
  { value: "vehicle", label: "Vehicle" },
  { value: "gold", label: "Gold" },
  { value: "crypto", label: "Crypto" },
  { value: "investment", label: "Investment" },
  { value: "cash", label: "Cash (Manual)" },
  { value: "other", label: "Other Asset" },
]

const LIABILITY_CATEGORIES = [
  { value: "mortgage", label: "Mortgage" },
  { value: "student_loan", label: "Student Loan" },
  { value: "auto_loan", label: "Auto Loan" },
  { value: "personal_loan", label: "Personal Loan" },
  { value: "credit_card", label: "Credit Card (Manual)" },
  { value: "other", label: "Other Liability" },
]

interface AssetDialogProps {
  initialAsset?: Asset
  trigger?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AssetDialog({
  initialAsset,
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AssetDialogProps) {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setUncontrolledOpen
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialAsset

  const defaultValues = {
    name: initialAsset?.name || "",
    kind: initialAsset?.kind || "asset",
    category: initialAsset?.category || "",
    symbol: initialAsset?.symbol || "",
    currency: initialAsset?.currency || "USD",
    currentValue: initialAsset?.currentValue ? initialAsset.currentValue / 100 : 0,
    valuationMethod: initialAsset?.valuationMethod || "manual",
    ownershipPercentage: initialAsset?.ownershipPercentage ?? 100,
    acquiredAt: initialAsset?.acquiredAt ? new Date(initialAsset.acquiredAt) : null,
    notes: initialAsset?.notes || "",
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const kind = watch("kind")
  const category = watch("category")
  const valuationMethod = watch("valuationMethod")

  // Auto-switch valuation method to market if crypto or gold or investment is selected
  useEffect(() => {
    if (!isEditing && (category === "crypto" || category === "gold")) {
      setValue("valuationMethod", "market")
    }
  }, [category, isEditing, setValue])

  // Adjust category when kind changes
  useEffect(() => {
    const currentCategory = watch("category")
    const validCategories = kind === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES
    const isValid = validCategories.some((c) => c.value === currentCategory)
    if (!isValid) {
      setValue("category", "")
    }
  }, [kind, setValue, watch])

  useEffect(() => {
    if (open) {
      reset(defaultValues)
      setError(null)
    }
  }, [open, initialAsset, reset])

  const onSubmit = async (data: FormInput) => {
    setLoading(true)
    setError(null)

    const submissionData = {
      ...data,
      symbol: data.symbol?.trim() ? data.symbol.trim().toUpperCase() : undefined,
      category: data.category as AssetCategory,
      currentValue: Math.round(data.currentValue * 100), // convert to cents/paise
      acquiredAt: data.acquiredAt || undefined,
      isArchived: initialAsset?.isArchived || false,
      status: initialAsset?.status || "active",
    } as any

    try {
      if (isEditing && initialAsset) {
        const result = await updateAsset(initialAsset._id.toString(), submissionData)
        if (!result.success) {
          setError(result.error || "Failed to update item")
          return
        }
        toast.success("Item updated successfully")
      } else {
        const result = await createAsset(submissionData)
        if (!result.success) {
          setError(result.error || "Failed to create item")
          return
        }
        toast.success("Item created successfully")
      }
      setOpen(false)
      if (onSuccess) onSuccess()
      router.refresh()
    } catch (err) {
      console.error(err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const categoriesList = kind === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES
  const showTickerField =
    kind === "asset" && (category === "crypto" || category === "investment" || valuationMethod === "market")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm" className="rounded-xl font-bold gap-2 shadow-xs">
              {isEditing ? (
                <>
                  <Pencil className="size-4" />
                  Edit Item
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Add Item
                </>
              )}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="size-4.5" />
            </div>
            <DialogTitle className="text-xl font-extrabold">
              {isEditing ? "Edit Net Worth Item" : "Add Asset or Liability"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <FieldGroup className="space-y-3">
            {/* Type selection: Asset vs Liability */}
            <Field data-invalid={!!errors.kind}>
              <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Item Classification
              </FieldLabel>
              <Controller
                name="kind"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl text-xs font-semibold border border-border/30">
                    {[
                      { value: "asset", label: "Asset", icon: TrendingUp },
                      { value: "liability", label: "Liability", icon: TrendingDown },
                    ].map((k) => {
                      const Icon = k.icon
                      const isSelected = field.value === k.value
                      return (
                        <button
                          key={k.value}
                          type="button"
                          onClick={() => field.onChange(k.value)}
                          className={cn(
                            "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all text-center cursor-pointer",
                            isSelected
                              ? "bg-card text-foreground shadow-xs font-bold border border-border/40"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-3.5 shrink-0",
                              isSelected && k.value === "asset"
                                ? "text-emerald-500"
                                : isSelected && k.value === "liability"
                                  ? "text-rose-500"
                                  : ""
                            )}
                          />
                          {k.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              />
              {errors.kind && <FieldError>{(errors.kind as any).message}</FieldError>}
            </Field>

            {/* Asset Name */}
            <Field data-invalid={!!errors.name}>
              <FieldLabel
                htmlFor="asset-name"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                {kind === "asset" ? "Asset Name" : "Liability Name"}
              </FieldLabel>
              <Input
                id="asset-name"
                placeholder={kind === "asset" ? "e.g. Bitcoin Cold Storage or Main Residence" : "e.g. Home Mortgage or Auto Loan"}
                className="rounded-xl"
                {...register("name")}
              />
              {errors.name && <FieldError>{(errors.name as any).message}</FieldError>}
            </Field>

            {/* Category Selector */}
            <Field data-invalid={!!errors.category}>
              <FieldLabel
                htmlFor="asset-category"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Category
              </FieldLabel>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="asset-category" className="rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectGroup>
                        {categoriesList.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value} className="rounded-lg">
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <FieldError>{(errors.category as any).message}</FieldError>}
            </Field>

            {/* Conditional Ticker / Symbol for Crypto / Investment / Market */}
            {showTickerField && (
              <Field data-invalid={!!errors.symbol}>
                <div className="flex items-center justify-between">
                  <FieldLabel
                    htmlFor="asset-symbol"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Ticker / Symbol
                  </FieldLabel>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Live market quote
                  </span>
                </div>
                <Controller
                  name="symbol"
                  control={control}
                  render={({ field }) => (
                    <TickerSearchCombobox
                      id="asset-symbol"
                      value={field.value || ""}
                      onChange={(val) => field.onChange(val)}
                      onSelectResult={(result) => {
                        field.onChange(result.symbol)
                        const currentName = watch("name")
                        if (!currentName || currentName.trim() === "" || currentName === field.value) {
                          setValue("name", result.name)
                        }
                      }}
                      placeholder={category === "crypto" ? "e.g. BTC, ETH, SOL, DOGE" : "e.g. AAPL, VOO, BTC"}
                    />
                  )}
                />
                {errors.symbol && <FieldError>{(errors.symbol as any).message}</FieldError>}
              </Field>
            )}

            {/* Current Value and Currency */}
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.currentValue}>
                <FieldLabel
                  htmlFor="asset-current-value"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Current Value
                </FieldLabel>
                <Input
                  id="asset-current-value"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  className="rounded-xl"
                  {...register("currentValue")}
                />
                {errors.currentValue && <FieldError>{(errors.currentValue as any).message}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.currency}>
                <FieldLabel
                  htmlFor="asset-currency"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Currency
                </FieldLabel>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="asset-currency" className="rounded-xl">
                        <SelectValue placeholder="USD" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectGroup>
                          {CURRENCIES.map((curr) => (
                            <SelectItem key={curr} value={curr} className="rounded-lg">
                              {curr}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.currency && <FieldError>{(errors.currency as any).message}</FieldError>}
              </Field>
            </div>

            {/* Valuation Method and Ownership % */}
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.valuationMethod}>
                <FieldLabel
                  htmlFor="asset-valuation-method"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Valuation Method
                </FieldLabel>
                <Controller
                  name="valuationMethod"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="asset-valuation-method" className="rounded-xl">
                        <SelectValue placeholder="Manual" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectGroup>
                          <SelectItem value="manual" className="rounded-lg">
                            Manual
                          </SelectItem>
                          <SelectItem value="market" className="rounded-lg">
                            Market Sync
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.valuationMethod && (
                  <FieldError>{(errors.valuationMethod as any).message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.ownershipPercentage}>
                <FieldLabel
                  htmlFor="asset-ownership"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Ownership (%)
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="asset-ownership"
                    type="number"
                    step="any"
                    placeholder="100"
                    className="rounded-xl pr-8"
                    {...register("ownershipPercentage")}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <Percent className="size-3.5" />
                  </div>
                </div>
                {errors.ownershipPercentage && (
                  <FieldError>{(errors.ownershipPercentage as any).message}</FieldError>
                )}
              </Field>
            </div>

            {/* Acquisition Date (Optional) */}
            <Field data-invalid={!!errors.acquiredAt}>
              <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Acquisition Date (Optional)
              </FieldLabel>
              <Controller
                control={control}
                name="acquiredAt"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full rounded-xl justify-start text-left font-normal bg-transparent border-input",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.acquiredAt && <FieldError>{(errors.acquiredAt as any).message}</FieldError>}
            </Field>

            {/* Notes (Optional) */}
            <Field data-invalid={!!errors.notes}>
              <FieldLabel
                htmlFor="asset-notes"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Notes (Optional)
              </FieldLabel>
              <textarea
                id="asset-notes"
                placeholder="Purchasing details, registration details, or serial numbers..."
                className="flex min-h-[70px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                {...register("notes")}
              />
              {errors.notes && <FieldError>{(errors.notes as any).message}</FieldError>}
            </Field>
          </FieldGroup>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl font-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Item"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}