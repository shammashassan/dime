"use client"

import React, { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { goalSchema, GoalInput } from "@/lib/validations/goal.schema"
import { Goal } from "@/types"
import { createGoal, updateGoal } from "@/lib/actions/goals"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { 
  FieldGroup, 
  Field, 
  FieldLabel, 
  FieldError 
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Target, 
  PiggyBank, 
  Car, 
  Home, 
  Gift, 
  Gamepad2, 
  Plane, 
  Laptop 
} from "lucide-react"

const ICONS = ["Target", "PiggyBank", "Car", "Home", "Gift", "Gamepad2", "Plane", "Laptop"]
const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#64748b"]
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "SGD"]

const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  Target,
  PiggyBank,
  Car,
  Home,
  Gift,
  Gamepad2,
  Plane,
  Laptop,
}

interface GoalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: Goal // If provided, we are editing
}

export function GoalFormDialog({ open, onOpenChange, goal }: GoalFormDialogProps) {
  const isEditing = !!goal
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      currency: "USD",
      targetDate: new Date(),
      color: "#8b5cf6",
      icon: "Target",
    },
  })

  // Reset form when dialog opens/closes or goal changes
  useEffect(() => {
    if (open) {
      if (goal) {
        reset({
          name: goal.name,
          targetAmount: goal.targetAmount / 100, // Convert to decimal dollars
          currentAmount: goal.currentAmount / 100,
          currency: goal.currency,
          targetDate: new Date(goal.targetDate),
          color: goal.color,
          icon: goal.icon,
        })
      } else {
        reset({
          name: "",
          targetAmount: 0,
          currentAmount: 0,
          currency: "USD",
          targetDate: new Date(new Date().setMonth(new Date().getMonth() + 6)), // 6 months from now
          color: "#8b5cf6",
          icon: "Target",
        })
      }
    }
  }, [open, goal, reset])

  const onSubmit = async (data: GoalInput) => {
    setIsSubmitting(true)
    try {
      // Map decimal input values to integers (cents) before submitting
      const payload: GoalInput = {
        ...data,
        targetAmount: Math.round(data.targetAmount * 100),
        currentAmount: Math.round((data.currentAmount || 0) * 100),
      }

      let res
      if (isEditing && goal) {
        res = await updateGoal(goal._id.toString(), payload)
        if (res.success) {
          toast.success(`Goal "${data.name}" updated successfully`)
          onOpenChange(false)
        } else {
          toast.error("Failed to update goal")
        }
      } else {
        res = await createGoal(payload)
        if (res.success) {
          toast.success(`Goal "${data.name}" created successfully`)
          onOpenChange(false)
        } else {
          toast.error("Failed to create goal")
        }
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred during submission")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for the input element
  const dateValue = watch("targetDate")
  const formattedDate = dateValue instanceof Date && !isNaN(dateValue.getTime())
    ? dateValue.toISOString().split("T")[0]
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-border/50 shadow-2xl p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Edit Savings Goal" : "Create Savings Goal"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <FieldGroup>
            {/* Goal Name */}
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="goal-name">Goal Name</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="goal-name"
                  {...register("name")}
                  placeholder="e.g. Europe Trip, Emergency Fund"
                  aria-invalid={!!errors.name}
                />
              </InputGroup>
              {errors.name && <FieldError>{(errors.name as any).message}</FieldError>}
            </Field>

            {/* Target Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field data-invalid={!!errors.targetAmount}>
                <FieldLabel htmlFor="target-amount">Target Amount</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="target-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("targetAmount", { valueAsNumber: true })}
                    aria-invalid={!!errors.targetAmount}
                  />
                </InputGroup>
                {errors.targetAmount && <FieldError>{(errors.targetAmount as any).message}</FieldError>}
              </Field>

              {/* Initial Saved Balance */}
              <Field data-invalid={!!errors.currentAmount}>
                <FieldLabel htmlFor="current-amount">Already Saved</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="current-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    disabled={isEditing}
                    {...register("currentAmount", { valueAsNumber: true })}
                    aria-invalid={!!errors.currentAmount}
                  />
                </InputGroup>
                {errors.currentAmount && <FieldError>{(errors.currentAmount as any).message}</FieldError>}
              </Field>
            </div>

            {/* Currency & Target Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field data-invalid={!!errors.currency}>
                <FieldLabel>Currency</FieldLabel>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.currency} className="h-10 rounded-xl">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {CURRENCIES.map((cur) => (
                          <SelectItem key={cur} value={cur} className="cursor-pointer">
                            {cur}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.currency && <FieldError>{(errors.currency as any).message}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.targetDate}>
                <FieldLabel htmlFor="target-date">Target Date</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="target-date"
                    type="date"
                    value={formattedDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setValue("targetDate", new Date(e.target.value), { shouldDirty: true })
                      }
                    }}
                    aria-invalid={!!errors.targetDate}
                  />
                </InputGroup>
                {errors.targetDate && <FieldError>{(errors.targetDate as any).message}</FieldError>}
              </Field>
            </div>

            {/* Icon selection */}
            <Field data-invalid={!!errors.icon}>
              <FieldLabel>Select Icon</FieldLabel>
              <Controller
                control={control}
                name="icon"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((ico) => {
                      const IconComp = ICON_COMPONENTS[ico] || Target
                      const isSelected = field.value === ico
                      return (
                        <button
                          key={ico}
                          type="button"
                          onClick={() => field.onChange(ico)}
                          className={`flex size-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? "border-primary bg-primary/10 text-primary scale-110 shadow-xs" 
                              : "border-border/40 hover:bg-muted"
                          }`}
                        >
                          <IconComp className="size-4.5" />
                        </button>
                      )
                    })}
                  </div>
                )}
              />
              {errors.icon && <FieldError>{(errors.icon as any).message}</FieldError>}
            </Field>

            {/* Color selection */}
            <Field data-invalid={!!errors.color}>
              <FieldLabel>Color Accent</FieldLabel>
              <Controller
                control={control}
                name="color"
                render={({ field }) => (
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((col) => {
                      const isSelected = field.value === col
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => field.onChange(col)}
                          className={`size-7 rounded-full transition-all border border-black/10 cursor-pointer ${
                            isSelected ? "scale-125 ring-2 ring-primary ring-offset-2" : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      )
                    })}
                  </div>
                )}
              />
              {errors.color && <FieldError>{(errors.color as any).message}</FieldError>}
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl font-bold cursor-pointer"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
