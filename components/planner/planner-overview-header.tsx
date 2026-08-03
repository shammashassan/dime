"use client"

import { MetricCard } from "@/components/ui/metric-card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calculator,
  TrendingUp,
  Wallet,
  ShieldCheck,
  CalendarDays,
  Sparkles,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { ForecastResult, SerializedPlannerScenario } from "@/types"

interface PlannerOverviewHeaderProps {
  forecast: ForecastResult
  horizonMonths: number
  onHorizonChange: (months: number) => void
  onOpenSaveModal: () => void
  activeScenarioName?: string
  savedScenarios: SerializedPlannerScenario[]
  selectedScenarioId: string
  onSelectScenario: (id: string) => void
  onRequestDeleteScenario: (id: string) => void
}

const HORIZON_OPTIONS = [
  { label: "6 Months", value: 6 },
  { label: "1 Year", value: 12 },
  { label: "2 Years", value: 24 },
  { label: "3 Years", value: 36 },
  { label: "5 Years", value: 60 },
]

export function PlannerOverviewHeader({
  forecast,
  horizonMonths,
  onHorizonChange,
  onOpenSaveModal,
  activeScenarioName = "Baseline (Status Quo)",
  savedScenarios,
  selectedScenarioId,
  onSelectScenario,
  onRequestDeleteScenario,
}: PlannerOverviewHeaderProps) {
  const currency = forecast.targetCurrency

  const netWorthDelta12M = forecast.projectedSimulated12MNetWorth - forecast.projectedBaseline12MNetWorth
  const isNetWorthGain = netWorthDelta12M >= 0

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Title Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <Calculator className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Financial Planner</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Simulate what-if financial decisions, forecast cash flow, and optimize debt payoff.
            </p>
          </div>
        </div>

        {/* Action Controls — default Select dropdowns like report page */}
        <div className="flex items-center gap-2 flex-wrap md:ml-auto md:justify-end">
          {/* Scenario Select Dropdown */}
          <Select value={selectedScenarioId} onValueChange={(val) => onSelectScenario(val)}>
            <SelectTrigger className="w-full sm:w-50 h-10 rounded-xl border-border/40 shadow-xs text-xs font-semibold">
              <SelectValue placeholder="Select Scenario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baseline" className="text-xs font-semibold">Baseline (Status Quo)</SelectItem>
              {savedScenarios.map((s) => (
                <SelectItem key={s._id} value={s._id} className="text-xs font-semibold">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Horizon Select Dropdown */}
          <Select
            value={horizonMonths.toString()}
            onValueChange={(val) => onHorizonChange(parseInt(val, 10))}
          >
            <SelectTrigger className="w-full sm:w-32.5 h-10 rounded-xl border-border/40 shadow-xs text-xs font-semibold">
              <SelectValue placeholder="Forecast Horizon" />
            </SelectTrigger>
            <SelectContent>
              {HORIZON_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value.toString()} className="text-xs font-semibold">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Save Scenario Button */}
          <Button
            onClick={onOpenSaveModal}
            className="rounded-xl text-xs font-bold gap-1.5 h-10 px-4 shadow-sm cursor-pointer"
          >
            <Sparkles className="size-3.5" />
            Save Scenario
          </Button>
        </div>
      </div>

      {/* ── Top Metric Cards Grid — same MetricCard component used on net-worth page ── */}
      <div className="flex flex-wrap gap-4">
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={TrendingUp}
          color="#10b981"
          label="Projected 12M Net Worth"
          value={formatCurrency(forecast.projectedSimulated12MNetWorth, currency)}
          valueClassName={isNetWorthGain ? "text-emerald-600 dark:text-emerald-400" : undefined}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Wallet}
          color="#3b82f6"
          label="Liquid Cash Pool"
          value={formatCurrency(forecast.currentLiquidCash, currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={CalendarDays}
          color="#a855f7"
          label="Projected Debt-Free"
          value={forecast.simulatedDebtFreeDateStr || "No active debt"}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={ShieldCheck}
          color="#6366f1"
          label="Emergency Reserve"
          value={`${forecast.emergencyReserveMonths} months`}
          valueClassName={forecast.emergencyReserveMonths >= 3 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
        />
      </div>
    </div>
  )
}