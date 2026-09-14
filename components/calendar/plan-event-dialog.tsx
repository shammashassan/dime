"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { createCalendarPlanAction } from "@/lib/actions/calendar"

interface PlanEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: string
  currency: string
}

export function PlanEventDialog({
  open,
  onOpenChange,
  defaultDate,
  currency,
}: PlanEventDialogProps) {
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    defaultDate ? parseISO(defaultDate) : new Date()
  )
  const [flow, setFlow] = useState<"inflow" | "outflow">("outflow")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)

  useEffect(() => {
    if (open) {
      if (defaultDate) {
        setSelectedDate(parseISO(defaultDate))
      } else {
        setSelectedDate(new Date())
      }
    }
  }, [open, defaultDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !amount) {
      toast.error("Please provide a title and valid amount")
      return
    }

    const parsedAmount = Math.round(parseFloat(amount) * 100)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be greater than zero")
      return
    }

    const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")

    try {
      setLoading(true)
      await createCalendarPlanAction({
        title: title.trim(),
        amount: parsedAmount,
        currency,
        date: dateStr,
        flow,
        notes: notes.trim() || undefined,
      })

      toast.success("Planned event added to calendar")
      onOpenChange(false)
      setTitle("")
      setAmount("")
      setNotes("")
    } catch (err: any) {
      toast.error(err?.message || "Failed to add planned event")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Planned Event</DialogTitle>
          <DialogDescription>
            Pencil in a one-off upcoming expense or income to simulate its impact on your cash flow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="plan-title">Title</FieldLabel>
              <Input
                id="plan-title"
                placeholder="e.g. Flight Tickets, Freelance Bonus"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl"
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Type</FieldLabel>
                <Select value={flow} onValueChange={(val: "inflow" | "outflow") => setFlow(val)}>
                  <SelectTrigger className="rounded-xl w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectGroup>
                      <SelectItem value="outflow">Expense (Outflow)</SelectItem>
                      <SelectItem value="inflow">Income (Inflow)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="plan-amount">Amount ({currency})</FieldLabel>
                <Input
                  id="plan-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Date</FieldLabel>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full justify-start rounded-xl px-3 border border-input font-normal h-9 min-w-0"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1 text-left">
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border border-border/40 shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(newDate) => {
                      if (newDate) {
                        setSelectedDate(newDate)
                        setDatePopoverOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>

            <Field>
              <FieldLabel htmlFor="plan-notes">Notes (Optional)</FieldLabel>
              <Textarea
                id="plan-notes"
                placeholder="Add details, link, or context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl min-h-[80px]"
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl font-bold cursor-pointer"
            >
              {loading ? "Saving..." : "Add to Calendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
