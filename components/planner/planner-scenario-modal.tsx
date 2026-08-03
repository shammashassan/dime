"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupInput, InputGroupTextarea } from "@/components/ui/input-group"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createPlannerScenario } from "@/lib/actions/planner"
import { PlannerScenario } from "@/types"

interface PlannerScenarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentScenario: Partial<PlannerScenario>
  onSavedSuccess: () => void
}

export function PlannerScenarioModal({
  open,
  onOpenChange,
  currentScenario,
  onSavedSuccess,
}: PlannerScenarioModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Scenario name is required.")
      return
    }

    setLoading(true)

    try {
      await createPlannerScenario({
        name: name.trim(),
        description: description.trim(),
        monthlyIncomeAdjustment: currentScenario.monthlyIncomeAdjustment ?? 0,
        monthlyExpenseAdjustment: currentScenario.monthlyExpenseAdjustment ?? 0,
        extraLoanRepayment: currentScenario.extraLoanRepayment ?? 0,
        extraGoalContribution: currentScenario.extraGoalContribution ?? 0,
        pausedRecurringIds: currentScenario.pausedRecurringIds ?? [],
        investmentReturnRate: currentScenario.investmentReturnRate ?? 7,
        savingsApy: currentScenario.savingsApy ?? 4,
        horizonMonths: currentScenario.horizonMonths ?? 12,
      })

      toast.success(`Scenario "${name}" saved successfully!`)
      setName("")
      setDescription("")
      onOpenChange(false)
      onSavedSuccess()
    } catch (err: any) {
      toast.error(err.message || "Failed to save scenario.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto min-w-0 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Save Custom Scenario
          </DialogTitle>
          <DialogDescription>
            Save your current slider adjustments as a reusable scenario (e.g., "Debt Rush", "Job Promotion").
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 pt-2">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="scenario-name">Scenario Name</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="scenario-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aggressive Debt Payoff"
                  className="h-10 rounded-xl"
                  autoFocus
                  required
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="scenario-notes">Notes / Description (Optional)</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="scenario-notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What assumptions does this scenario test?"
                  className="rounded-xl"
                  rows={3}
                />
              </InputGroup>
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl font-bold px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Scenario"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
