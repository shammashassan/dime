"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendDataItem {
  month: string
  income: number
  expense: number
}

interface MonthlySummaryTableProps {
  data: TrendDataItem[]
  currency: string
}

type SortKey = "month" | "income" | "expense" | "netSavings" | "savingsRate"
type SortDir = "asc" | "desc"

function formatVal(val: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(val)
}

const monthMap: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
}

function parseMonthYear(monthStr: string): number {
  if (!monthStr) return 0
  const parts = monthStr.split(" ")
  if (parts.length < 2) return 0
  const [mmm, yy] = parts
  const month = monthMap[mmm] ?? 0
  const year = parseInt(yy, 10) || 0
  return year * 12 + month
}

export function MonthlySummaryTable({ data, currency }: MonthlySummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("month")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const rows = useMemo(() => {
    return data.map((item) => {
      const netSavings = item.income - item.expense
      const savingsRate = item.income > 0 ? (netSavings / item.income) * 100 : 0
      return { ...item, netSavings, savingsRate }
    })
  }, [data])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let cmp = 0
      if (sortKey === "month") {
        cmp = parseMonthYear(a.month) - parseMonthYear(b.month)
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number)
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [rows, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const handleExportCSV = () => {
    const headers = ["Month", "Income", "Expenses", "Net Savings", "Savings Rate (%)"]
    const csvRows = sorted.map((r) => [
      r.month,
      r.income.toFixed(2),
      r.expense.toFixed(2),
      r.netSavings.toFixed(2),
      r.savingsRate.toFixed(1),
    ])
    const csv = [headers, ...csvRows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `monthly-summary-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="size-3.5 text-muted-foreground/50 ml-1" />
    if (sortDir === "asc") return <ArrowUp className="size-3.5 text-primary ml-1" />
    return <ArrowDown className="size-3.5 text-primary ml-1" />
  }

  const headerBtn = (label: string, col: SortKey, className?: string) => (
    <button
      onClick={() => handleSort(col)}
      className={cn(
        "flex items-center gap-0.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      {label}
      <SortIcon col={col} />
    </button>
  )

  // Totals row
  const totals = useMemo(() => {
    const totalIncome = rows.reduce((s, r) => s + r.income, 0)
    const totalExpense = rows.reduce((s, r) => s + r.expense, 0)
    const totalNet = totalIncome - totalExpense
    const totalRate = totalIncome > 0 ? (totalNet / totalIncome) * 100 : 0
    return { totalIncome, totalExpense, totalNet, totalRate }
  }, [rows])

  return (
    <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <CardTitle className="text-lg font-bold">Monthly Performance Summary</CardTitle>
          <CardDescription>
            Month-by-month income, expenses, net savings, and savings rate
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="self-start rounded-xl border-border/40 flex items-center gap-1.5 text-xs font-semibold"
        >
          <Download className="size-3.5" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/40 bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3">{headerBtn("Month", "month")}</th>
                <th className="text-right px-4 py-3">{headerBtn("Income", "income", "ml-auto")}</th>
                <th className="text-right px-4 py-3">{headerBtn("Expenses", "expense", "ml-auto")}</th>
                <th className="text-right px-4 py-3">{headerBtn("Net Savings", "netSavings", "ml-auto")}</th>
                <th className="text-right px-4 py-3">{headerBtn("Rate", "savingsRate", "ml-auto")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center text-muted-foreground text-xs">
                    No data available for the selected period.
                  </td>
                </tr>
              ) : (
                sorted.map((row, idx) => (
                  <tr
                    key={row.month}
                    className={cn(
                      "border-b border-border/20 transition-colors hover:bg-muted/30",
                      idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                    )}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground text-xs">{row.month}</td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {formatVal(row.income, currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-rose-600 dark:text-rose-400">
                      {formatVal(row.expense, currency)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right text-xs font-bold",
                        row.netSavings >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {row.netSavings >= 0 ? "+" : ""}
                      {formatVal(row.netSavings, currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
                          row.savingsRate >= 20
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : row.savingsRate > 0
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                        )}
                      >
                        {row.savingsRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sorted.length > 0 && (
              <tfoot className="border-t border-border/40 bg-muted/20">
                <tr>
                  <td className="px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wider">Total</td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatVal(totals.totalIncome, currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                    {formatVal(totals.totalExpense, currency)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right text-xs font-bold",
                      totals.totalNet >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {totals.totalNet >= 0 ? "+" : ""}
                    {formatVal(totals.totalNet, currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
                        totals.totalRate >= 20
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : totals.totalRate > 0
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                      )}
                    >
                      {totals.totalRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
