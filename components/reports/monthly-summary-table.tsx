"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown, Download, FileSpreadsheet } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"

interface TrendDataItem {
  month: string
  income: number
  expense: number
}

export interface MonthlySummaryTableProps {
  data: TrendDataItem[]
  currency: string
  className?: string
}

type SortKey = "month" | "income" | "expense" | "netSavings" | "savingsRate"
type SortDir = "asc" | "desc"

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

export function MonthlySummaryTable({ data, currency, className }: MonthlySummaryTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("month")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")

  const rows = React.useMemo(() => {
    return data.map((item) => {
      const netSavings = item.income - item.expense
      const savingsRate = item.income > 0 ? (netSavings / item.income) * 100 : 0
      return { ...item, netSavings, savingsRate }
    })
  }, [data])

  const sorted = React.useMemo(() => {
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
      setSortDir("desc")
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
    a.download = `monthly-ledger-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="size-3 text-muted-foreground/40 ml-1" />
    if (sortDir === "asc") return <ArrowUp className="size-3 text-primary ml-1" />
    return <ArrowDown className="size-3 text-primary ml-1" />
  }

  const headerBtn = (label: string, col: SortKey, alignment: string = "") => (
    <button
      onClick={() => handleSort(col)}
      className={cn(
        "flex items-center gap-0.5 text-[11px] uppercase tracking-wider font-semibold font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
        alignment
      )}
    >
      {label}
      <SortIcon col={col} />
    </button>
  )

  // Cumulative totals
  const totals = React.useMemo(() => {
    const totalIncome = rows.reduce((s, r) => s + r.income, 0)
    const totalExpense = rows.reduce((s, r) => s + r.expense, 0)
    const totalNet = totalIncome - totalExpense
    const totalRate = totalIncome > 0 ? (totalNet / totalIncome) * 100 : 0
    return { totalIncome, totalExpense, totalNet, totalRate }
  }, [rows])

  return (
    <Card
      className={cn(
        "bento-tile flex flex-col justify-between border-border/50 bg-card shadow-xs rounded-2xl overflow-hidden p-0 py-0 gap-0",
        className
      )}
    >
      {/* Micro-header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-3">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 truncate min-w-0">
            historical // ledger
          </span>
          {data.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-muted text-muted-foreground whitespace-nowrap shrink-0">
              {data.length}m
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="self-start sm:self-center h-8 rounded-xl border-border/40 flex items-center gap-1.5 text-xs font-semibold"
        >
          <Download className="size-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/40 bg-muted/20">
            <tr>
              <th className="text-left px-5 py-3">{headerBtn("Month", "month")}</th>
              <th className="text-right px-5 py-3">{headerBtn("Income", "income", "ml-auto")}</th>
              <th className="text-right px-5 py-3">{headerBtn("Expenses", "expense", "ml-auto")}</th>
              <th className="text-right px-5 py-3">{headerBtn("Net Savings", "netSavings", "ml-auto")}</th>
              <th className="text-right px-5 py-3">{headerBtn("Savings Rate", "savingsRate", "ml-auto")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-28 text-center text-muted-foreground text-xs">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <FileSpreadsheet className="size-5 text-muted-foreground/50" />
                    <span>No data available for the selected timeframe.</span>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((row, idx) => {
                const isNetPositive = row.netSavings >= 0
                return (
                  <tr
                    key={row.month}
                    className={cn(
                      "border-b border-border/20 transition-colors hover:bg-muted/30",
                      idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                    )}
                  >
                    <td className="px-5 py-3 font-semibold text-foreground text-xs font-mono">
                      {row.month}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-medium font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.income * 100, currency)}
                    </td>
                    <td className="px-5 py-3 text-right text-xs font-medium font-mono text-rose-600 dark:text-rose-400">
                      {formatCurrency(row.expense * 100, currency)}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right text-xs font-semibold font-mono",
                        isNetPositive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {isNetPositive ? "+" : ""}
                      {formatCurrency(row.netSavings * 100, currency)}
                    </td>
                    <td className="px-5 py-3 text-right text-xs">
                      <span
                        className={cn(
                          "inline-flex items-center justify-end font-mono font-bold text-xs",
                          row.savingsRate >= 20
                            ? "text-emerald-600 dark:text-emerald-400"
                            : row.savingsRate > 0
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        {row.savingsRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>

          {/* Cumulative Totals Footer */}
          {rows.length > 0 && (
            <tfoot className="border-t-2 border-border/50 bg-muted/40 font-mono text-xs font-bold">
              <tr>
                <td className="px-5 py-3 uppercase tracking-wider text-muted-foreground text-[11px]">
                  Cumulative ({rows.length} mo)
                </td>
                <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totals.totalIncome * 100, currency)}
                </td>
                <td className="px-5 py-3 text-right text-rose-600 dark:text-rose-400">
                  {formatCurrency(totals.totalExpense * 100, currency)}
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-right",
                    totals.totalNet >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {totals.totalNet >= 0 ? "+" : ""}
                  {formatCurrency(totals.totalNet * 100, currency)}
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={cn(
                      totals.totalRate >= 20
                        ? "text-emerald-600 dark:text-emerald-400"
                        : totals.totalRate > 0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {totals.totalRate.toFixed(1)}% avg
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  )
}
