"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Wallet, Loan } from "@/types"
import { createRepayment } from "@/lib/actions/loans"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarIcon, Loader2, Landmark, Coins, HandCoins } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

interface RepaymentDialogProps {
  loan: Loan
  wallets: Wallet[]
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function RepaymentDialog({
  loan,
  wallets,
  trigger,
  onSuccess,
}: RepaymentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxAmount = loan.remainingAmount / 100

  const clientRepaymentSchema = z.object({
    amount: z.coerce
      .number()
      .positive("Amount must be positive")
      .max(maxAmount, `Amount cannot exceed remaining balance of ${formatCurrency(loan.remainingAmount, loan.currency)}`),
    walletId: z.string().min(1, "Wallet is required"),
    date: z.coerce.date(),
    notes: z.string().optional(),
  })

  type ClientRepaymentInput = z.infer<typeof clientRepaymentSchema>

  const defaultValues: Partial<ClientRepaymentInput> = {
    amount: maxAmount,
    walletId: loan.walletId || (wallets.length > 0 ? wallets[0]._id.toString() : ""),
    date: new Date(),
    notes: "",
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(clientRepaymentSchema),
    defaultValues,
  })

  // Reload defaults when opened
  useEffect(() => {
    if (open) {
      setValue("amount", loan.remainingAmount / 100)
      setValue("walletId", loan.walletId || (wallets.length > 0 ? wallets[0]._id.toString() : ""))
      setValue("date", new Date())
      setValue("notes", "")
      setError(null)
    }
  }, [open, loan, wallets, setValue])

  const onSubmit = async (data: ClientRepaymentInput) => {
    setLoading(true)
    setError(null)

    const payload = {
      loanId: loan._id.toString(),
      amount: Math.round(data.amount * 100), // convert to cents/paise
      walletId: data.walletId,
      date: data.date,
      notes: data.notes || undefined,
    }

    const savePromise = new Promise(async (resolve, reject) => {
      try {
        const result = await createRepayment(payload)
        if (result && !result.success) {
          reject(new Error(result.error || "Failed to log repayment"))
          return
        }

        router.refresh()
        if (onSuccess) onSuccess()
        setOpen(false)
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })

    toast.promise(savePromise, {
      loading: "Logging repayment...",
      success: "Repayment logged successfully",
      error: (err: any) => {
        const errMsg = err.message || "Failed to log repayment. Please try again."
        setError(errMsg)
        return errMsg
      },
    })

    try {
      await savePromise
    } catch (err) {
      console.error("Repayment save error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto min-w-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="size-5 text-primary" />
            Log Repayment
          </DialogTitle>
          <DialogDescription>
            {loan.type === "lent"
              ? `Record money received from ${loan.personName} towards this loan.`
              : `Record money paid to ${loan.personName} towards this loan.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-3">
          {error && (
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <FieldGroup>
            {/* Amount */}
            <Field data-invalid={!!errors.amount}>
              <FieldLabel>Repayment Amount</FieldLabel>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-12"
                  {...register("amount")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  {loan.currency}
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">
                Remaining balance: {formatCurrency(loan.remainingAmount, loan.currency)}
              </span>
              {errors.amount && <FieldError>{(errors.amount as any).message}</FieldError>}
            </Field>

            {/* Wallet Selection */}
            <Field data-invalid={!!errors.walletId}>
              <FieldLabel>Wallet / Account</FieldLabel>
              <Controller
                control={control}
                name="walletId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="rounded-xl border border-input h-9">
                      <SelectValue placeholder="Select account/wallet" />
                    </SelectTrigger>
                    <SelectContent className="border border-border/40 shadow-lg">
                      {wallets.map((w) => (
                        <SelectItem key={w._id.toString()} value={w._id.toString()}>
                          {w.name} ({formatCurrency(w.balance, w.currency)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.walletId && <FieldError>{(errors.walletId as any).message}</FieldError>}
            </Field>

            {/* Date */}
            <Field data-invalid={!!errors.date}>
              <FieldLabel>Repayment Date</FieldLabel>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className="w-full justify-start rounded-xl px-3 border border-input font-normal h-9 min-w-0"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1 text-left">
                          {field.value ? format(field.value, "PP") : "Pick date"}
                        </span>
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

            {/* Notes */}
            <Field data-invalid={!!errors.notes}>
              <FieldLabel>Notes (Optional)</FieldLabel>
              <textarea
                placeholder="Repayment details..."
                className="flex min-h-[60px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                {...register("notes")}
              />
              {errors.notes && <FieldError>{(errors.notes as any).message}</FieldError>}
            </Field>
          </FieldGroup>

          {/* Submit */}
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
                  Logging...
                </>
              ) : (
                "Log Payment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
