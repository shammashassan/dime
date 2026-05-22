"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  TrendingUp,
  Receipt,
  ArrowLeftRight,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"

interface CategoryItem {
  category: string
  value: number
  color: string
  icon: string
}

interface CategoryBreakdownProps {
  data?: CategoryItem[]
  currency?: string
}

export function CategoryBreakdown({ data = [], currency = "USD" }: CategoryBreakdownProps) {
  const router = useRouter()

  // Calculate total expense to compute percentages
  const totalExpense = React.useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  // Filter out zero-values and sort descending by value
  const sortedData = React.useMemo(() => {
    return [...data]
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [data])

  return (
    <Card className="w-full h-full max-h-[420px] flex flex-col border border-border/40 shadow-xl bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-bold">Category Breakdown</CardTitle>
          <CardDescription className="text-xs">Expense distribution for the current month</CardDescription>
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="outline" aria-label="Menu" className="h-8 w-8 rounded-xl border border-border/30">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push("/reports")} className="rounded-lg cursor-pointer">
                  <TrendingUp className="size-4 mr-2 text-muted-foreground" />
                  View Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/transactions")} className="rounded-lg cursor-pointer">
                  <ArrowLeftRight className="size-4 mr-2 text-muted-foreground" />
                  Transactions
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-auto px-4 -mx-1">
        {sortedData.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-muted-foreground text-sm">
            No expenses recorded this month.
          </div>
        ) : (
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-left pl-2 text-xs font-semibold uppercase tracking-wider">Category</TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wider">Share</TableHead>
                  <TableHead className="text-right pr-2 text-xs font-semibold uppercase tracking-wider">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item) => {
                  const share = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0
                  return (
                    <TableRow key={item.category} className="border-border/40 hover:bg-muted/40 transition-colors">
                      <TableCell className="pl-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-xs truncate max-w-[120px]">{item.category}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="secondary" className="whitespace-nowrap font-normal text-[10px] px-2 py-0.5 rounded-full border border-border/30">
                          {share.toFixed(1)}%
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-2 font-mono font-bold text-xs">
                        {formatCurrency(item.value * 100, currency)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
