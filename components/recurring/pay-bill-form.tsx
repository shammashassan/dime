"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { BillInstance, Wallet, RecurringRule } from "@/types"
import { markBillAsPaid } from "@/lib/actions/bills"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

const payBillSchema = z.object({
  walletId: z.string().min(1, "Wallet is required"),
  actualAmount: z.coerce.number().positive("Amount must be positive"),
  paidDate: z.coerce.date(),
})

interface PayBillFormProps {
  bill: BillInstance
  rule?: RecurringRule
  wallets: Wallet[]
  onSuccess: () => void
}

export function PayBillForm({ bill, rule, wallets, onSuccess }: PayBillFormProps) {
  const [loading, setLoading] = useState(false)

  // Default to rule's wallet if available, or first wallet
  const defaultWalletId = rule?.walletId || wallets[0]?._id?.toString() || ""
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(payBillSchema),
    defaultValues: {
      walletId: defaultWalletId,
      actualAmount: bill.expectedAmount ? bill.expectedAmount / 100 : undefined,
      paidDate: new Date(),
    },
  })

  const selectedWalletId = watch("walletId")
  const selectedWallet = wallets.find((w) => w._id.toString() === selectedWalletId)
  const currency = selectedWallet?.currency || bill.currency || "USD"

  const onSubmit = async (data: any) => {
    setLoading(true)
    const p = new Promise(async (resolve, reject) => {
      try {
        const res = await markBillAsPaid(bill._id.toString(), data.actualAmount, data.walletId, data.paidDate)
        if (!res.success) reject(new Error("Failed to pay bill"))
        else {
          onSuccess()
          resolve(true)
        }
      } catch (err) {
        reject(err)
      }
    })

    toast.promise(p, {
      loading: "Processing payment...",
      success: "Bill marked as paid",
      error: (err: any) => err.message || "An error occurred",
    })
    
    try {
      await p
    } catch (_) {}
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
      <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-center flex flex-col gap-1">
        <p className="text-sm font-semibold text-muted-foreground">{bill.description}</p>
        <p className="text-3xl font-black">{formatCurrency(bill.expectedAmount || 0, currency)}</p>
        <p className="text-xs font-medium text-muted-foreground mt-1">Expected Amount</p>
      </div>

      <FieldGroup>
        <Field data-invalid={!!errors.actualAmount}>
          <FieldLabel>Actual Amount Paid</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>{currency}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              step="0.01"
              placeholder="0.00"
              aria-invalid={!!errors.actualAmount}
              {...register("actualAmount")}
            />
          </InputGroup>
          {errors.actualAmount && <FieldError>{(errors.actualAmount as any).message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.walletId}>
          <FieldLabel>Paid From</FieldLabel>
          <Controller
            control={control}
            name="walletId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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

        <Field data-invalid={!!errors.paidDate}>
          <FieldLabel>Date Paid</FieldLabel>
          <Controller
            control={control}
            name="paidDate"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal min-w-0"
                  >
                    <CalendarIcon className="mr-2 size-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1 text-left">
                      {field.value ? format(field.value as Date, "PP") : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border border-border/40 shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value as Date}
                    onSelect={(val) => val && field.onChange(val)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.paidDate && <FieldError>{(errors.paidDate as any).message}</FieldError>}
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end border-t border-border/40 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-8 rounded-xl font-bold gap-2"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Confirm Payment
        </Button>
      </div>
    </form>
  )
}
