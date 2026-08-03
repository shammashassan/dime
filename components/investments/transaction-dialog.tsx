"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { investmentTransactionSchema, InvestmentTransactionInput } from "@/lib/validations/investment.schema"
import { recordTransaction } from "@/lib/actions/investments"
import { Wallet } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { toast } from "sonner"
import { Loader2, Plus, TrendingUp, CalendarIcon } from "lucide-react"

interface TransactionDialogProps {
  accounts?: Wallet[]
  defaultAccountId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function TransactionDialog({
  accounts = [],
  defaultAccountId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  trigger
}: TransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = (val: boolean) => {
    if (isControlled && externalOnOpenChange) {
      externalOnOpenChange(val)
    } else {
      setInternalOpen(val)
    }
  }

  const selectedAccountId = defaultAccountId || (accounts.length > 0 ? accounts[0]._id.toString() : "")

  const { register, handleSubmit, setValue, watch, control, formState: { errors }, reset } = useForm<InvestmentTransactionInput>({
    resolver: zodResolver(investmentTransactionSchema) as any,
    defaultValues: {
      walletId: selectedAccountId,
      type: "buy",
      assetType: "stock",
      quantity: 1,
      price: 0,
      fees: 0,
      date: new Date(),
    }
  })

  const currentType = watch("type")
  const currentWalletId = watch("walletId")

  const onSubmit = async (data: InvestmentTransactionInput) => {
    if (!data.walletId) {
      toast.error("Please select a brokerage account")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await recordTransaction(data)
      if (res.success) {
        toast.success("Transaction recorded successfully")
        reset()
        setOpen(false)
      } else {
        toast.error("Failed to record transaction")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button size="sm" className="rounded-xl font-bold gap-2 shadow-sm">
            <Plus className="size-4" />
            Record Transaction
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TrendingUp className="size-4.5" />
            </div>
            <DialogTitle className="text-xl font-extrabold">Record Investment Transaction</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <FieldGroup>
            {/* Account Selector */}
            {accounts.length > 0 && (
              <Field data-invalid={!!errors.walletId}>
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brokerage Account</FieldLabel>
                <Select
                  value={currentWalletId || selectedAccountId}
                  onValueChange={(v) => setValue("walletId", v)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectGroup>
                      {accounts.map((acc) => (
                        <SelectItem key={acc._id.toString()} value={acc._id.toString()} className="rounded-lg">
                          {acc.name} ({acc.currency})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Type */}
              <Field data-invalid={!!errors.type}>
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</FieldLabel>
                <Select onValueChange={(v) => setValue("type", v as any)} value={currentType}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectGroup>
                      <SelectItem value="buy" className="rounded-lg">Buy</SelectItem>
                      <SelectItem value="sell" className="rounded-lg">Sell</SelectItem>
                      <SelectItem value="cash_dividend" className="rounded-lg">Dividend</SelectItem>
                      <SelectItem value="stock_split" className="rounded-lg">Stock Split</SelectItem>
                      <SelectItem value="fee" className="rounded-lg">Fee</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {/* Asset Type */}
              <Field data-invalid={!!errors.assetType}>
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Asset Class</FieldLabel>
                <Select onValueChange={(v) => setValue("assetType", v as any)} defaultValue={watch("assetType")}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectGroup>
                      <SelectItem value="stock" className="rounded-lg">Stock</SelectItem>
                      <SelectItem value="etf" className="rounded-lg">ETF</SelectItem>
                      <SelectItem value="crypto" className="rounded-lg">Crypto</SelectItem>
                      <SelectItem value="mutual_fund" className="rounded-lg">Mutual Fund</SelectItem>
                      <SelectItem value="bond" className="rounded-lg">Bond</SelectItem>
                      <SelectItem value="commodity" className="rounded-lg">Commodity</SelectItem>
                      <SelectItem value="other" className="rounded-lg">Other</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.symbol}>
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ticker / Symbol</FieldLabel>
                <Input {...register("symbol")} placeholder="e.g. AAPL" className="uppercase rounded-xl" />
              </Field>

              <Field data-invalid={!!errors.name}>
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Asset Name</FieldLabel>
                <Input {...register("name")} placeholder="e.g. Apple Inc." className="rounded-xl" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.quantity}>
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity</FieldLabel>
                <Input type="number" step="any" {...register("quantity", { valueAsNumber: true })} className="rounded-xl" />
              </Field>

              <Field data-invalid={!!errors.price}>
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price per Unit</FieldLabel>
                <Input type="number" step="any" {...register("price", { valueAsNumber: true })} className="rounded-xl" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.fees}>
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fees</FieldLabel>
                <Input type="number" step="any" {...register("fees", { valueAsNumber: true })} className="rounded-xl" />
              </Field>

              <Field data-invalid={!!errors.date}>
                <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</FieldLabel>
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
                          <CalendarIcon className="mr-2 size-4 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1 text-left text-xs font-semibold">
                            {field.value ? format(new Date(field.value), "PP") : "Pick date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border border-border/40 shadow-lg" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(val) => val && field.onChange(val)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </Field>
            </div>

            <Field data-invalid={!!errors.notes}>
              <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes (Optional)</FieldLabel>
              <Textarea {...register("notes")} placeholder="Transaction notes or confirmation reference..." className="rounded-xl resize-none" rows={2} />
            </Field>

          </FieldGroup>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold gap-2">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
