"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { addAssetValuation } from "@/lib/actions/assets"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarIcon, Loader2, Plus } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  date: z.coerce.date(),
  value: z.coerce.number().nonnegative("Value cannot be negative"),
  notes: z.string().optional(),
})

type FormInput = z.infer<typeof formSchema>

interface ValuationDialogProps {
  assetId: string
  assetCurrency: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function ValuationDialog({ assetId, assetCurrency, trigger, onSuccess }: ValuationDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultValues = {
    assetId,
    date: new Date(),
    value: 0,
    notes: "",
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
      setError(null)
    }
  }, [open, assetId, reset])

  const onSubmit = async (data: FormInput) => {
    setLoading(true)
    setError(null)

    try {
      const result = await addAssetValuation({
        assetId: data.assetId,
        date: data.date,
        value: Math.round(data.value * 100), // convert to cents/paise
        source: "manual",
        notes: data.notes || undefined,
      })

      if (!result.success) {
        setError(result.error || "Failed to add valuation record")
        return
      }

      toast.success("Valuation recorded successfully")
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-xl font-semibold">
            <Plus className="size-4 mr-1.5" />
            Log Valuation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto rounded-2xl border border-border/40 p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle>Log Valuation</DialogTitle>
          <DialogDescription>
            Record a point-in-time value change for this asset/liability.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <FieldGroup className="space-y-3">
            
            {/* Date picker */}
            <Field data-invalid={!!errors.date}>
              <FieldLabel>Valuation Date</FieldLabel>
              <Controller
                control={control}
                name="date"
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
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && <FieldError>{(errors.date as any).message}</FieldError>}
            </Field>

            {/* New Value */}
            <Field data-invalid={!!errors.value}>
              <FieldLabel>New Value ({assetCurrency})</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  type="number"
                  step="any"
                  placeholder="0.00"
                  className="rounded-xl"
                  {...register("value")}
                />
              </InputGroup>
              {errors.value && <FieldError>{(errors.value as any).message}</FieldError>}
            </Field>

            {/* Notes */}
            <Field data-invalid={!!errors.notes}>
              <FieldLabel>Notes (Optional)</FieldLabel>
              <textarea
                placeholder="Details regarding this appraisal or price change..."
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
              ) : (
                "Log Valuation"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
