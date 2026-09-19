"use client"

import * as React from "react"
import { BentoEntrance } from "@/components/dashboard/bento-entrance"
import { MetricCard } from "@/components/ui/metric-card"
import { IncomeExpenseTrendChart } from "./income-expense-trend-chart"
import { CategoryBreakdownChart } from "./category-breakdown-chart"
import { SpendingDayChart } from "./spending-day-chart"
import { NetWorthHistoryChart } from "./net-worth-history-chart"
import { NetSavingsChart } from "./net-savings-chart"
import { BudgetPerformanceChart } from "./budget-performance-chart"
import { CommitmentBurdenChart, type CommitmentBurdenData } from "./commitment-burden-chart"
import { CapitalAllocationChart, type CapitalAllocationData } from "./capital-allocation-chart"
import { MonthlySummaryTable } from "./monthly-summary-table"
import { formatCurrency } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Wallet, Percent, TrendingDown, PieChart } from "lucide-react"

export interface ReportsOverviewViewProps {
  trendData: { month: string; income: number; expense: number }[]
  dailyTrendData: { date: string; income: number; expense: number }[]
  breakdownData: { category: string; value: number; color: string; icon: string }[]
  spendingDayData: { day: string; amount: number }[]
  walletHistoryData: { date?: string; month?: string; netWorth: number; totalAssets: number; totalLiabilities: number }[]
  savingsData: { month: string; savings: number }[]
  budgetPerformanceData: { name: string; category: string; limit: number; spent: number }[]
  commitmentBurdenData?: CommitmentBurdenData
  capitalAllocationData?: CapitalAllocationData
  monthsCount: number
  currency: string
  navTabs?: React.ReactNode
}

export function ReportsOverviewView({
  trendData,
  dailyTrendData,
  breakdownData,
  spendingDayData,
  walletHistoryData,
  savingsData,
  budgetPerformanceData,
  commitmentBurdenData = { fixed: 0, discretionary: 0, total: 0, fixedPercentage: 0, activeRulesCount: 0 },
  capitalAllocationData = { items: [], totalGoals: 0, totalDebt: 0, totalAllocated: 0 },
  monthsCount,
  currency,
  navTabs,
}: ReportsOverviewViewProps) {
  // Aggregate KPIs calculated from monthly trendData
  const totalIncome = React.useMemo(
    () => trendData.reduce((sum, item) => sum + item.income, 0),
    [trendData]
  )
  const totalExpense = React.useMemo(
    () => trendData.reduce((sum, item) => sum + item.expense, 0),
    [trendData]
  )
  const netSavings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0
  const effectiveMonths = Math.max(1, monthsCount)
  const avgMonthlyIncome = totalIncome / effectiveMonths
  const avgMonthlyExpense = totalExpense / effectiveMonths

  const topCategory = React.useMemo(() => {
    return breakdownData.length > 0 ? breakdownData[0] : null
  }, [breakdownData])
  const topCategoryPct = totalExpense > 0 && topCategory ? ((topCategory.value / totalExpense) * 100).toFixed(0) : "0"

  return (
    <BentoEntrance className="flex flex-col gap-6 w-full">
      {/* 1. MetricCards row with 3x2 balanced grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <MetricCard
          className="bento-tile"
          icon={ArrowUpRight}
          color="#10b981"
          label="Total Income"
          value={formatCurrency(totalIncome * 100, currency)}
          subtext={`Avg. ${formatCurrency(avgMonthlyIncome * 100, currency)}/mo`}
        />
        <MetricCard
          className="bento-tile"
          icon={ArrowDownRight}
          color="#f43f5e"
          label="Total Expenses"
          value={formatCurrency(totalExpense * 100, currency)}
          subtext={`Avg. ${formatCurrency(avgMonthlyExpense * 100, currency)}/mo`}
        />
        <MetricCard
          className="bento-tile"
          icon={Wallet}
          color="#8b5cf6"
          label="Net Savings"
          value={`${netSavings >= 0 ? "+" : ""}${formatCurrency(netSavings * 100, currency)}`}
          subtext={netSavings >= 0 ? "Surplus capital retained" : "Net cash flow deficit"}
        />
        <MetricCard
          className="bento-tile"
          icon={Percent}
          color="#3b82f6"
          label="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          subtext={savingsRate >= 20 ? "Target 20%+ achieved" : "Below 20% benchmark"}
        />
        <MetricCard
          className="bento-tile"
          icon={TrendingDown}
          color="#f59e0b"
          label="Avg Monthly Expense"
          value={formatCurrency(avgMonthlyExpense * 100, currency)}
          subtext={`Over ${monthsCount} mo tracking`}
        />
        <MetricCard
          className="bento-tile"
          icon={PieChart}
          color="#06b6d4"
          label="Top Spending Category"
          value={topCategory ? topCategory.category : "None"}
          subtext={topCategory ? `${topCategoryPct}% of total expenses` : "No expenses recorded"}
        />
      </div>

      {/* 2. Navigation Tabs positioned right below KPI Strip */}
      {navTabs && <div className="flex items-center">{navTabs}</div>}

      {/* 3. Packed Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch w-full">
        {/* Tier 1: Cash Flow & Category Distribution (2 : 1) */}
        <div className="lg:col-span-2 flex flex-col">
          <IncomeExpenseTrendChart
            data={dailyTrendData.length > 0 ? dailyTrendData : trendData.map(t => ({ date: t.month, income: t.income, expense: t.expense }))}
            currency={currency}
          />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <CategoryBreakdownChart
            data={breakdownData}
            currency={currency}
          />
        </div>

        {/* Tier 2: Savings Momentum & Wealth Timeline (1 : 2) */}
        <div className="lg:col-span-1 flex flex-col">
          <NetSavingsChart
            data={savingsData}
            currency={currency}
          />
        </div>
        <div className="lg:col-span-2 flex flex-col">
          <NetWorthHistoryChart
            data={walletHistoryData}
            currency={currency}
          />
        </div>

        {/* Tier 3: Budget Adherence & Spending Rhythm (2 : 1) */}
        <div className="lg:col-span-2 flex flex-col">
          <BudgetPerformanceChart
            data={budgetPerformanceData}
            currency={currency}
          />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <SpendingDayChart
            data={spendingDayData}
            currency={currency}
          />
        </div>

        {/* Tier 4: Commitment Burden & Capital Allocation (1 : 2) */}
        <div className="lg:col-span-1 flex flex-col">
          <CommitmentBurdenChart
            data={commitmentBurdenData}
            currency={currency}
          />
        </div>
        <div className="lg:col-span-2 flex flex-col">
          <CapitalAllocationChart
            data={capitalAllocationData}
            currency={currency}
          />
        </div>

        {/* Tier 5: Monthly Performance Ledger (Full width 3 columns) */}
        {trendData.length > 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <MonthlySummaryTable
              data={trendData}
              currency={currency}
            />
          </div>
        )}
      </div>
    </BentoEntrance>
  )
}
