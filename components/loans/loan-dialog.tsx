"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Wallet, Contact, Loan } from "@/types"
import { createLoan, updateLoan } from "@/lib/actions/loans"
import { ContactDialog } from "@/components/contacts/contact-dialog"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput, InputGroupTextarea } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarIcon, Loader2, Plus, Users, HandCoins, Mail, Phone, Percent, Info, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn, formatCurrency } from "@/lib/utils"

const clientLoanSchema = z.object({
  type: z.enum(["lent", "borrowed"]),
  contactId: z.string().optional(),
  personName: z.string().min(1, "Person name is required").max(100, "Person name is too long"),
  amount: z.coerce.number().positive("Amount must be positive"),
  interestRate: z.coerce.number().nonnegative("Interest rate cannot be negative").optional(),
  walletId: z.string().min(1, "Wallet is required"),
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["active", "partially_repaid", "fully_repaid", "overdue", "cancelled"]).default("active"),
  reminder_7d: z.boolean().default(true),
  reminder_3d: z.boolean().default(true),
  reminder_1d: z.boolean().default(true),
  reminder_0d: z.boolean().default(true),
})

type ClientLoanInput = z.infer<typeof clientLoanSchema>

interface LoanDialogProps {
  wallets: Wallet[]
  contacts: Contact[]
  initialLoan?: Loan
  trigger?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function LoanDialog({
  wallets,
  contacts,
  initialLoan,
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: LoanDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Combobox state
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [currentContacts, setCurrentContacts] = useState<Contact[]>(contacts)

  useEffect(() => {
    setCurrentContacts(contacts)
  }, [contacts])

  const isEditing = !!initialLoan

  const defaultValues: Partial<ClientLoanInput> = {
    type: initialLoan?.type || "lent",
    contactId: initialLoan?.contactId || "",
    personName: initialLoan?.personName || "",
    amount: initialLoan?.amount ? initialLoan.amount / 100 : 0,
    interestRate: initialLoan?.interestRate || 0,
    walletId: initialLoan?.walletId || (wallets.length > 0 ? wallets[0]._id.toString() : ""),
    date: initialLoan?.date ? new Date(initialLoan.date) : new Date(),
    dueDate: initialLoan?.dueDate ? new Date(initialLoan.dueDate) : null,
    notes: initialLoan?.notes || "",
    status: initialLoan?.status || "active",
    reminder_7d: initialLoan?.reminderSchedule ? initialLoan.reminderSchedule.includes(7) : true,
    reminder_3d: initialLoan?.reminderSchedule ? initialLoan.reminderSchedule.includes(3) : true,
    reminder_1d: initialLoan?.reminderSchedule ? initialLoan.reminderSchedule.includes(1) : true,
    reminder_0d: initialLoan?.reminderSchedule ? initialLoan.reminderSchedule.includes(0) : true,
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(clientLoanSchema),
    defaultValues,
  })

  const selectedType = watch("type")
  const selectedWalletId = watch("walletId")
  const selectedWallet = wallets.find((w) => w._id.toString() === selectedWalletId)
  const selectedDate = watch("date")
  const selectedDueDate = watch("dueDate")
  const selectedContactName = watch("personName")

  // Reset form when dialog opens/closes or initialLoan changes
  useEffect(() => {
    if (open) {
      // Re-populate with defaults
      const schedule = initialLoan?.reminderSchedule || [7, 3, 1, 0]
      setValue("type", initialLoan?.type || "lent")
      setValue("contactId", initialLoan?.contactId || "")
      setValue("personName", initialLoan?.personName || "")
      setValue("amount", initialLoan?.amount ? initialLoan.amount / 100 : 0)
      setValue("interestRate", initialLoan?.interestRate || 0)
      setValue("walletId", initialLoan?.walletId || (wallets.length > 0 ? wallets[0]._id.toString() : ""))
      setValue("date", initialLoan?.date ? new Date(initialLoan.date) : new Date())
      setValue("dueDate", initialLoan?.dueDate ? new Date(initialLoan.dueDate) : null)
      setValue("notes", initialLoan?.notes || "")
      setValue("status", initialLoan?.status || "active")
      setValue("reminder_7d", schedule.includes(7))
      setValue("reminder_3d", schedule.includes(3))
      setValue("reminder_1d", schedule.includes(1))
      setValue("reminder_0d", schedule.includes(0))
      setError(null)
    }
  }, [open, initialLoan, wallets, setValue])

  const onSubmit = async (data: ClientLoanInput) => {
    setLoading(true)
    setError(null)

    // Construct reminder schedule based on checkboxes
    const reminderSchedule: number[] = []
    if (data.reminder_7d) reminderSchedule.push(7)
    if (data.reminder_3d) reminderSchedule.push(3)
    if (data.reminder_1d) reminderSchedule.push(1)
    if (data.reminder_0d) reminderSchedule.push(0)

    const payload = {
      type: data.type,
      contactId: data.contactId || undefined,
      personName: data.personName,
      amount: Math.round(data.amount * 100), // convert to cents/paise
      interestRate: data.interestRate || 0,
      walletId: data.walletId,
      currency: selectedWallet?.currency || "USD",
      date: data.date,
      dueDate: data.dueDate || undefined,
      notes: data.notes || undefined,
      status: data.status,
      reminderSchedule,
      metadata: {},
    }

    const savePromise = new Promise(async (resolve, reject) => {
      try {
        let result
        if (isEditing && initialLoan) {
          result = await updateLoan(initialLoan._id.toString(), payload as any)
        } else {
          result = await createLoan(payload as any)
        }

        if (result && !result.success) {
          reject(new Error(result.error || "Save failed"))
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
      loading: isEditing ? "Saving changes..." : "Recording loan...",
      success: isEditing ? "Loan updated successfully" : "Loan recorded successfully",
      error: (err: any) => {
        const errMsg = err.message || "Failed to save loan. Please try again."
        setError(errMsg)
        return errMsg
      },
    })

    try {
      await savePromise
    } catch (err) {
      console.error("Loan save error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto min-w-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="size-5 text-primary" />
            {isEditing ? "Edit Loan Details" : "Record New Loan"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update loan information, due dates, or status details."
              : "Record money lent or borrowed to keep your balances and calendars in sync."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-3">
          {error && (
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          {/* Toggle Lent vs Borrowed */}
          <Field>
            <FieldLabel>Loan Type</FieldLabel>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg text-xs font-semibold">
                  {[
                    { value: "lent", label: "I Lent Money", icon: ArrowUpRight },
                    { value: "borrowed", label: "I Borrowed Money", icon: ArrowDownLeft },
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

          <FieldGroup>
            {/* Person Name Combobox Autocomplete */}
            <Field data-invalid={!!errors.personName}>
              <div className="flex justify-between items-center mb-0.5">
                <FieldLabel>Contact Name</FieldLabel>
                <ContactDialog
                  onSuccess={(contactId, contactName) => {
                    setValue("personName", contactName)
                    setValue("contactId", contactId)
                    setCurrentContacts((prev) => [
                      ...prev,
                      { _id: contactId, name: contactName } as any
                    ])
                    toast.success(`Selected newly created contact: ${contactName}`)
                  }}
                  trigger={
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Plus className="size-3" /> Add Contact
                    </button>
                  }
                />
              </div>
              <Controller
                control={control}
                name="personName"
                render={({ field }) => (
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className={cn(
                          "w-full justify-between rounded-xl px-3 text-left font-normal border border-input h-9",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value || "Select or enter contact name..."}
                        <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 border border-border/40 shadow-lg" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search or type a new name..."
                          value={searchQuery}
                          onValueChange={(val) => {
                            setSearchQuery(val)
                            // If they are typing a custom name, update the form value directly
                            field.onChange(val)
                            setValue("contactId", "") // Custom name is not linked to existing ID
                          }}
                        />
                        <CommandList className="max-h-48 overflow-y-auto">
                          <CommandEmpty className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-xs rounded-lg"
                              onClick={() => {
                                field.onChange(searchQuery)
                                setValue("contactId", "")
                                setComboboxOpen(false)
                              }}
                            >
                              <Plus className="mr-1.5 size-3.5" />
                              Use custom name "{searchQuery}"
                            </Button>
                          </CommandEmpty>
                          {currentContacts.length > 0 && (
                            <CommandGroup heading="Recent Contacts">
                              {currentContacts.map((contact) => (
                                <CommandItem
                                  key={contact._id.toString()}
                                  value={contact.name}
                                  onSelect={() => {
                                    field.onChange(contact.name)
                                    setValue("contactId", contact._id.toString())
                                    setComboboxOpen(false)
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">{contact.name}</span>
                                    {(contact.email || contact.phone) && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        {contact.email && <span className="flex items-center gap-0.5"><Mail className="size-3" />{contact.email}</span>}
                                        {contact.phone && <span className="flex items-center gap-0.5"><Phone className="size-3" />{contact.phone}</span>}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.personName && <FieldError>{(errors.personName as any).message}</FieldError>}
            </Field>

            {/* Wallet Selection */}
            <Field data-invalid={!!errors.walletId}>
              <FieldLabel>Wallet</FieldLabel>
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
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <Field data-invalid={!!errors.amount}>
              <FieldLabel>Amount</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  type="number"
                  step="any"
                  placeholder="0.00"
                  className="rounded-xl"
                  {...register("amount")}
                />
              </InputGroup>
              {errors.amount && <FieldError>{(errors.amount as any).message}</FieldError>}
            </Field>

            {/* Interest Rate */}
            <Field data-invalid={!!errors.interestRate}>
              <FieldLabel className="flex items-center gap-1">
                Interest Rate
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground">
                      <Info className="size-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-3 text-xs w-60 border border-border/40 shadow-lg">
                    Store an annual interest percentage for record-keeping. Simple interest calculations can be done on the detail page. Automatic accrual is not implemented yet.
                  </PopoverContent>
                </Popover>
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  type="number"
                  step="0.01"
                  placeholder="0"
                  className="rounded-xl pr-6"
                  {...register("interestRate")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
              </InputGroup>
              {errors.interestRate && <FieldError>{(errors.interestRate as any).message}</FieldError>}
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <Field data-invalid={!!errors.date}>
              <FieldLabel>Start Date</FieldLabel>
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

            {/* Due Date */}
            <Field data-invalid={!!errors.dueDate}>
              <FieldLabel>Due Date (Optional)</FieldLabel>
              <Controller
                control={control}
                name="dueDate"
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
                          {field.value ? format(field.value, "PP") : <span className="text-muted-foreground">None</span>}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border border-border/40 shadow-lg" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={(val) => field.onChange(val || null)}
                        initialFocus
                      />
                      {field.value && (
                        <div className="p-2 border-t border-border/30 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs w-full text-destructive hover:bg-destructive/10"
                            onClick={() => field.onChange(null)}
                          >
                            Clear due date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.dueDate && <FieldError>{(errors.dueDate as any).message}</FieldError>}
            </Field>
          </div>

          {/* Configurable Reminder Schedule */}
          {selectedDueDate && (
            <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-2">
              <span className="text-xs font-semibold text-foreground/80 block">Schedule Alerts / Reminders</span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Controller
                    control={control}
                    name="reminder_7d"
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  7 Days before
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Controller
                    control={control}
                    name="reminder_3d"
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  3 Days before
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Controller
                    control={control}
                    name="reminder_1d"
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  1 Day before
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Controller
                    control={control}
                    name="reminder_0d"
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  On the due date
                </label>
              </div>
            </div>
          )}

          {/* Status Selection (Only when editing) */}
          {isEditing && (
            <Field data-invalid={!!errors.status}>
              <FieldLabel>Status</FieldLabel>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="rounded-xl border border-input h-9">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="border border-border/40 shadow-lg">
                      <SelectItem value="active">Active (Unpaid)</SelectItem>
                      <SelectItem value="partially_repaid">Partially Repaid</SelectItem>
                      <SelectItem value="fully_repaid">Fully Repaid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <FieldError>{(errors.status as any).message}</FieldError>}
            </Field>
          )}

          {/* Notes */}
          <Field data-invalid={!!errors.notes}>
            <FieldLabel>Notes (Optional)</FieldLabel>
            <InputGroup>
              <InputGroupTextarea
                placeholder="Details about the loan..."
                className="rounded-xl min-h-[70px]"
                {...register("notes")}
              />
            </InputGroup>
            {errors.notes && <FieldError>{(errors.notes as any).message}</FieldError>}
          </Field>

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
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Record Loan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
