"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Asset, AssetCategory } from "@/types"
import { createAsset, updateAsset } from "@/lib/actions/assets"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarIcon, Loader2, Plus, Pencil, Percent } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  kind: z.enum(["asset", "liability"]),
  category: z.string().min(1, "Category is required"),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
  currentValue: z.coerce.number().nonnegative("Value cannot be negative"),
  valuationMethod: z.enum(["manual", "market", "calculated"]).default("manual"),
  ownershipPercentage: z.coerce.number().min(0, "Cannot be less than 0").max(100, "Cannot exceed 100").default(100),
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
}

export function AssetDialog({ initialAsset, trigger, onSuccess }: AssetDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialAsset

  const defaultValues = {
    name: initialAsset?.name || "",
    kind: initialAsset?.kind || "asset",
    category: initialAsset?.category || "",
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

  // Adjust category when kind changes
  useEffect(() => {
    const currentCategory = watch("category")
    const validCategories = kind === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES
    const isValid = validCategories.some(c => c.value === currentCategory)
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
          setError(result.error || "Failed to update asset")
          return
        }
        toast.success("Asset updated successfully")
      } else {
        const result = await createAsset(submissionData)
        if (!result.success) {
          setError(result.error || "Failed to create asset")
          return
        }
        toast.success("Asset created successfully")
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-xl font-semibold">
            {isEditing ? (
              <>
                <Pencil className="size-4 mr-1.5" />
                Edit Item
              </>
            ) : (
              <>
                <Plus className="size-4 mr-1.5" />
                Add Asset / Liability
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto rounded-2xl border border-border/40 p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Item" : "Add Asset or Liability"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your manual financial item."
              : "Add a manual asset (property, vehicle, investments) or liability (loans, mortgage) to track your net worth."}
          </DialogDescription>
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
              <FieldLabel>Type</FieldLabel>
              <Controller
                name="kind"
                control={control}
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(val) => {
                      if (val) field.onChange(val)
                    }}
                    className="w-full flex justify-start gap-1"
                  >
                    <ToggleGroupItem
                      value="asset"
                      className="flex-1 rounded-xl text-center py-2 border font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      Asset
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="liability"
                      className="flex-1 rounded-xl text-center py-2 border font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      Liability
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              />
              {errors.kind && <FieldError>{(errors.kind as any).message}</FieldError>}
            </Field>

            {/* Name */}
            <Field data-invalid={!!errors.name}>
              <FieldLabel>Name</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  placeholder="e.g. Main Residence or Tesla Stock"
                  className="rounded-xl"
                  {...register("name")}
                />
              </InputGroup>
              {errors.name && <FieldError>{(errors.name as any).message}</FieldError>}
            </Field>

            {/* Category */}
            <Field data-invalid={!!errors.category}>
              <FieldLabel>Category</FieldLabel>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="rounded-xl bg-transparent">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {categoriesList.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <FieldError>{(errors.category as any).message}</FieldError>}
            </Field>

            {/* Value and Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field data-invalid={!!errors.currentValue}>
                  <FieldLabel>Current Value</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      type="number"
                      step="any"
                      placeholder="0.00"
                      className="rounded-xl"
                      {...register("currentValue")}
                    />
                  </InputGroup>
                  {errors.currentValue && <FieldError>{(errors.currentValue as any).message}</FieldError>}
                </Field>
              </div>
              <div>
                <Field data-invalid={!!errors.currency}>
                  <FieldLabel>Currency</FieldLabel>
                  <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="rounded-xl bg-transparent">
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {CURRENCIES.map((curr) => (
                            <SelectItem key={curr} value={curr}>
                              {curr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.currency && <FieldError>{(errors.currency as any).message}</FieldError>}
                </Field>
              </div>
            </div>

            {/* Valuation Method */}
            <Field data-invalid={!!errors.valuationMethod}>
              <FieldLabel>Valuation Method</FieldLabel>
              <Controller
                name="valuationMethod"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="rounded-xl bg-transparent">
                      <SelectValue placeholder="Manual" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="manual">Manual Valuations</SelectItem>
                      <SelectItem value="market" disabled>Market Sync (Coming Soon)</SelectItem>
                      <SelectItem value="calculated" disabled>Calculated (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.valuationMethod && <FieldError>{(errors.valuationMethod as any).message}</FieldError>}
            </Field>

            {/* Ownership % */}
            <Field data-invalid={!!errors.ownershipPercentage}>
              <FieldLabel>Ownership Percentage (%)</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  type="number"
                  step="any"
                  placeholder="100"
                  className="rounded-xl pr-8"
                  {...register("ownershipPercentage")}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Percent className="size-3.5" />
                </div>
              </InputGroup>
              {errors.ownershipPercentage && <FieldError>{(errors.ownershipPercentage as any).message}</FieldError>}
            </Field>

            {/* Acquired At Date */}
            <Field data-invalid={!!errors.acquiredAt}>
              <FieldLabel>Acquisition Date (Optional)</FieldLabel>
              <Controller
                control={control}
                name="acquiredAt"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full rounded-xl justify-start text-left font-normal bg-transparent border-input",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 size-4" />
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

            {/* Notes */}
            <Field data-invalid={!!errors.notes}>
              <FieldLabel>Notes (Optional)</FieldLabel>
              <textarea
                placeholder="Purchasing details, registration details, or serial numbers..."
                className="flex min-h-[70px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
              className="flex-1 rounded-xl font-semibold"
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
                "Create Asset"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
