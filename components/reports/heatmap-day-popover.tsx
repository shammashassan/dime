"use client"

import * as React from "react"
import Link from "next/link"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item"
import { formatCurrency } from "@/lib/utils"
import type { HeatmapDaySummary, HeatmapMetric } from "@/lib/calculations/heatmaps"
import { format, parseISO } from "date-fns"
import { Sparkles, ArrowDownRight, ArrowUpRight, Percent, Receipt, ExternalLink } from "lucide-react"

interface HeatmapDayPopoverProps {
  day: HeatmapDaySummary | null
  anchorRect: DOMRect | null
  onClose: () => void
  currency: string
  metric: HeatmapMetric
}

export function HeatmapDayPopover({
  day,
  anchorRect,
  onClose,
  currency,
  metric,
}: HeatmapDayPopoverProps) {
  const virtualRef = React.useRef({
    getBoundingClientRect: () => anchorRect || new DOMRect(),
  })

  // Update virtual ref whenever anchorRect changes
  React.useEffect(() => {
    virtualRef.current = {
      getBoundingClientRect: () => anchorRect || new DOMRect(),
    }
  }, [anchorRect])

  if (!day || !anchorRect) {
    return null
  }

  const parsedDate = parseISO(day.date)
  // Abbreviated day name as requested
  const formattedDate = format(parsedDate, "EEE, MMM d, yyyy")

  const getMetricBadge = () => {
    if (day.count === 0) {
      return (
        <Badge variant="secondary" className="gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 py-0.5 px-2">
          <Sparkles className="size-3" />
          Zero Spend
        </Badge>
      )
    }

    switch (metric) {
      case "income":
        return (
          <Badge variant="secondary" className="gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 py-0.5 px-2">
            <ArrowUpRight className="size-3" />
            +{formatCurrency(day.income, currency)}
          </Badge>
        )
      case "net":
        const isPositive = day.net >= 0
        return (
          <Badge
            variant="secondary"
            className={`gap-1 text-[11px] py-0.5 px-2 ${
              isPositive
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20"
            }`}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(day.net, currency)}
          </Badge>
        )
      case "count":
        return (
          <Badge variant="secondary" className="gap-1 text-[11px] py-0.5 px-2">
            <Receipt className="size-3" />
            {day.count} {day.count === 1 ? "tx" : "txs"}
          </Badge>
        )
      case "expense":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 py-0.5 px-2">
            <ArrowDownRight className="size-3" />
            {formatCurrency(day.expense, currency)}
          </Badge>
        )
    }
  }

  return (
    <Popover open={Boolean(day)} onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        className="w-76 p-3 shadow-xl ring-1 ring-border/50 rounded-2xl"
      >
        {/* Header with Title, Badge, and Quick Icon Link */}
        <PopoverHeader className="gap-1 pb-2 border-b border-border/40">
          <div className="flex items-center justify-between gap-1.5">
            <PopoverTitle className="text-xs font-semibold truncate text-foreground">
              {formattedDate}
            </PopoverTitle>

            <div className="flex items-center gap-1.5 shrink-0">
              {getMetricBadge()}

              {day.count > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="size-6 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Link
                        href={`/transactions?from=${day.date}&to=${day.date}`}
                        onClick={onClose}
                      >
                        <ExternalLink className="size-3.5" />
                        <span className="sr-only">View in Transactions</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    View in Transactions
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <PopoverDescription className="text-[11px] text-muted-foreground flex items-center justify-between">
            <span>
              {day.count} {day.count === 1 ? "transaction" : "transactions"}
            </span>
            {day.count > 0 && metric !== "expense" && day.expense > 0 && (
              <span>Spend: {formatCurrency(day.expense, currency)}</span>
            )}
          </PopoverDescription>
        </PopoverHeader>

        {/* Transactions list using shadcn ScrollArea and Item primitives */}
        <div className="pt-2">
          {day.transactions.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1">
              <span className="p-1.5 rounded-full bg-muted/40 text-muted-foreground">
                <Sparkles className="size-3.5 text-emerald-500" />
              </span>
              <p className="font-medium text-foreground text-xs">Zero-Spend Day</p>
              <p className="text-[10px]">No expenses recorded.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-36 w-full pr-1.5">
              <ItemGroup className="gap-1.5">
                {day.transactions.map((tx) => (
                  <Item
                    key={tx.id}
                    variant="muted"
                    size="xs"
                    className="rounded-xl px-2 py-1.5 bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    <ItemMedia>
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: tx.categoryColor || "var(--primary)" }}
                      />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="text-xs font-medium text-foreground truncate max-w-[130px]">
                        {tx.description}
                      </ItemTitle>
                      <ItemDescription className="text-[10px] text-muted-foreground truncate">
                        {tx.categoryName} • {tx.walletName}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          tx.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount, currency)}
                      </span>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
