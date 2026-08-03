"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  PlannerScenario,
  SerializedPlannerScenario,
} from "@/types"
import {
  generateFinancialForecast,
  BaselineFinancialState,
} from "@/lib/calculations/forecasting"
import { deletePlannerScenario } from "@/lib/actions/planner"
import { PlannerOverviewHeader } from "./planner-overview-header"
import { PlannerControls } from "./planner-controls"
import { PlannerChart } from "./planner-chart"
import { PlannerMilestones } from "./planner-milestones"
import { PlannerInsights } from "./planner-insights"
import { PlannerScenarioModal } from "./planner-scenario-modal"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table as TableIcon,
  LayoutDashboard,
  Target,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, cn } from "@/lib/utils"
import { toast } from "sonner"

interface PlannerClientProps {
  baseline: BaselineFinancialState
  savedScenarios: SerializedPlannerScenario[]
}

const DEFAULT_SCENARIO: Partial<PlannerScenario> = {
  monthlyIncomeAdjustment: 0,
  monthlyExpenseAdjustment: 0,
  extraLoanRepayment: 0,
  extraGoalContribution: 0,
  pausedRecurringIds: [],
  investmentReturnRate: 7,
  savingsApy: 4,
  horizonMonths: 12,
}

export function PlannerClient({ baseline, savedScenarios }: PlannerClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("baseline")
  const [activeScenario, setActiveScenario] = useState<Partial<PlannerScenario>>(DEFAULT_SCENARIO)
  const [activeScenarioName, setActiveScenarioName] = useState("Baseline (Status Quo)")

  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"dashboard" | "milestones" | "table">("dashboard")

  const forecast = generateFinancialForecast(baseline, activeScenario)

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id)
    if (id === "baseline") {
      setActiveScenario(DEFAULT_SCENARIO)
      setActiveScenarioName("Baseline (Status Quo)")
    } else {
      const match = savedScenarios.find((s) => s._id === id)
      if (match) {
        setActiveScenario({
          monthlyIncomeAdjustment: match.monthlyIncomeAdjustment,
          monthlyExpenseAdjustment: match.monthlyExpenseAdjustment,
          extraLoanRepayment: match.extraLoanRepayment,
          extraGoalContribution: match.extraGoalContribution,
          pausedRecurringIds: match.pausedRecurringIds,
          investmentReturnRate: match.investmentReturnRate,
          savingsApy: match.savingsApy ?? 4,
          horizonMonths: match.horizonMonths,
        })
        setActiveScenarioName(match.name)
      }
    }
  }

  const handleIncomeAdj = (val: number) => setActiveScenario((prev) => ({ ...prev, monthlyIncomeAdjustment: val }))
  const handleExpenseAdj = (val: number) => setActiveScenario((prev) => ({ ...prev, monthlyExpenseAdjustment: val }))
  const handleExtraLoan = (val: number) => setActiveScenario((prev) => ({ ...prev, extraLoanRepayment: val }))
  const handleExtraGoal = (val: number) => setActiveScenario((prev) => ({ ...prev, extraGoalContribution: val }))
  const handleRoi = (val: number) => setActiveScenario((prev) => ({ ...prev, investmentReturnRate: val }))
  const handleSavingsApy = (val: number) => setActiveScenario((prev) => ({ ...prev, savingsApy: val }))
  const handleHorizon = (months: number) => setActiveScenario((prev) => ({ ...prev, horizonMonths: months }))

  const handleTogglePause = (ruleId: string) => {
    setActiveScenario((prev) => {
      const set = new Set(prev.pausedRecurringIds || [])
      if (set.has(ruleId)) set.delete(ruleId)
      else set.add(ruleId)
      return { ...prev, pausedRecurringIds: Array.from(set) }
    })
  }

  const handleResetControls = () => {
    setActiveScenario(DEFAULT_SCENARIO)
    setSelectedScenarioId("baseline")
    setActiveScenarioName("Baseline (Status Quo)")
    toast.info("Reset to baseline values.")
  }

  const handleDeleteScenario = async (id: string) => {
    try {
      await deletePlannerScenario(id)
      toast.success("Scenario deleted successfully.")
      if (selectedScenarioId === id) {
        handleSelectScenario("baseline")
      }
      startTransition(() => {
        router.refresh()
      })
    } catch (err: any) {
      toast.error(err.message || "Failed to delete scenario.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── Top Overview Header: title, scenario/horizon dropdowns, metric cards ── */}
      <PlannerOverviewHeader
        forecast={forecast}
        horizonMonths={activeScenario.horizonMonths || 12}
        onHorizonChange={handleHorizon}
        onOpenSaveModal={() => setSaveModalOpen(true)}
        activeScenarioName={activeScenarioName}
        savedScenarios={savedScenarios}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
        onRequestDeleteScenario={setDeletingId}
      />

      {/* ── Interactive Sliders & Controls (compact, single row) ── */}
      <PlannerControls
        currency={baseline.targetCurrency}
        monthlyIncomeAdj={activeScenario.monthlyIncomeAdjustment || 0}
        monthlyExpenseAdj={activeScenario.monthlyExpenseAdjustment || 0}
        extraLoanRepayment={activeScenario.extraLoanRepayment || 0}
        extraGoalContribution={activeScenario.extraGoalContribution || 0}
        investmentRoi={activeScenario.investmentReturnRate ?? 7}
        savingsApy={activeScenario.savingsApy ?? 4}
        pausedRecurringIds={activeScenario.pausedRecurringIds || []}
        recurringRules={baseline.recurringRules}
        onChangeIncomeAdj={handleIncomeAdj}
        onChangeExpenseAdj={handleExpenseAdj}
        onChangeExtraLoan={handleExtraLoan}
        onChangeExtraGoal={handleExtraGoal}
        onChangeRoi={handleRoi}
        onChangeSavingsApy={handleSavingsApy}
        onTogglePauseRecurring={handleTogglePause}
        onResetControls={handleResetControls}
      />

      {/* ── Forecast Visualizations & View Tabs ── */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
          {/* Desktop Tab Selector (matches Net Worth / Contacts / Goals / Loans) */}
          <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
                activeTab === "dashboard"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutDashboard className="size-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("milestones")}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
                activeTab === "milestones"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Target className="size-3.5" />
              Goals &amp; Debt
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
                activeTab === "table"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TableIcon className="size-3.5" />
              Monthly Table
            </button>
          </div>

          {/* Mobile Tab Selector */}
          <div className="sm:hidden w-full">
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <SelectTrigger className="w-full border-border/40 bg-card h-10 rounded-xl text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border/40 rounded-xl">
                <SelectItem value="dashboard" className="rounded-lg text-xs font-semibold">Overview</SelectItem>
                <SelectItem value="milestones" className="rounded-lg text-xs font-semibold">Goals &amp; Debt</SelectItem>
                <SelectItem value="table" className="rounded-lg text-xs font-semibold">Monthly Table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs text-muted-foreground font-mono font-semibold">
            {forecast.points.length} Month Forecast
          </span>
        </div>

        {/* Tab 1: Bento — Chart (2 cols) + Insights (1 col) */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PlannerChart
                points={forecast.points}
                currency={baseline.targetCurrency}
                horizonMonths={activeScenario.horizonMonths || 12}
              />
            </div>
            <div className="lg:col-span-1">
              <PlannerInsights insights={forecast.insights} />
            </div>
          </div>
        )}

        {/* Tab 2: Goals & Debt Freedom Milestones */}
        {activeTab === "milestones" && (
          <PlannerMilestones
            goalMilestones={forecast.goalMilestones}
            loanMilestones={forecast.loanMilestones}
            currency={baseline.targetCurrency}
          />
        )}

        {/* Tab 3: Detailed Monthly Forecast Table — exactly matches Transaction Table styling */}
        {activeTab === "table" && (
          <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">Month</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Baseline Cash</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-right text-emerald-500">
                      Simulated Cash
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Baseline Net Worth</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-right text-primary">
                      Simulated Net Worth
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Remaining Debt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.points.map((p) => {
                    const cashDiff = p.simulatedLiquidCash - p.baselineLiquidCash
                    const nwDiff = p.simulatedNetWorth - p.baselineNetWorth

                    return (
                      <TableRow key={p.monthIndex} className="border-border/40 transition-colors hover:bg-muted/40 text-xs">
                        <TableCell className="font-semibold text-foreground text-xs">{p.dateStr}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatCurrency(p.baselineLiquidCash, baseline.targetCurrency)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-emerald-500">
                          {formatCurrency(p.simulatedLiquidCash, baseline.targetCurrency)}
                          {cashDiff !== 0 && (
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              ({cashDiff > 0 ? "+" : ""}{formatCurrency(cashDiff, baseline.targetCurrency)})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatCurrency(p.baselineNetWorth, baseline.targetCurrency)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-primary">
                          {formatCurrency(p.simulatedNetWorth, baseline.targetCurrency)}
                          {nwDiff !== 0 && (
                            <span className="block text-[9px] text-muted-foreground font-normal">
                              ({nwDiff > 0 ? "+" : ""}{formatCurrency(nwDiff, baseline.targetCurrency)})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-rose-500 font-semibold">
                          {formatCurrency(p.simulatedTotalDebt, baseline.targetCurrency)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* ── Save Scenario Modal ── */}
      <PlannerScenarioModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        currentScenario={activeScenario}
        onSavedSuccess={() => {
          startTransition(() => {
            router.refresh()
          })
        }}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scenario?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will only remove the saved scenario configuration. None of your actual financial data (wallets, loans, goals) will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDeleteScenario(deletingId)}
              className="rounded-xl text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Scenario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}