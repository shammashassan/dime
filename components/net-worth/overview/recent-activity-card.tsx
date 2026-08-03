"use client"

import { NetWorthOverviewViewModel } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  History,
  TrendingUp,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  HandCoins,
  Plus,
} from "lucide-react"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemHeader,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item"

interface RecentActivityCardProps {
  viewModel: NetWorthOverviewViewModel
}

function getActivityStyle(type: string, title?: string) {
  switch (type) {
    case "valuation":
      return {
        icon: TrendingUp,
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      }
    case "repayment":
      return {
        icon: CheckCircle2,
        color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      }
    case "transaction":
      if (title === "High Income") {
        return {
          icon: ArrowDownLeft,
          color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        }
      }
      return {
        icon: ArrowUpRight,
        color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      }
    case "new_loan":
      return {
        icon: HandCoins,
        color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      }
    case "new_asset":
      return {
        icon: Plus,
        color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      }
    default:
      return {
        icon: Clock,
        color: "bg-muted text-muted-foreground border-border/40",
      }
  }
}

export function RecentActivityCard({ viewModel }: RecentActivityCardProps) {
  const { recentActivity } = viewModel

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-auto lg:h-full flex flex-col bg-card">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="size-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recent Activity</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums shrink-0">
          {recentActivity.length} event{recentActivity.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Quick stat strip */}
      <div className="grid grid-cols-3 divide-x divide-border/30 border-b border-border/30 bg-muted/5">
        <div className="px-4 py-2.5 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Last Activity</span>
          <span className="text-xs font-bold">
            {recentActivity[0] ? format(new Date(recentActivity[0].date), "MMM d, yyyy") : "—"}
          </span>
        </div>
        <div className="px-4 py-2.5 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Total Events</span>
          <span className="text-xs font-bold">{recentActivity.length}</span>
        </div>
        <div className="px-4 py-2.5 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">MoM Change</span>
          <span
            className={cn(
              "text-xs font-bold",
              viewModel.moMChangePct > 0
                ? "text-emerald-500"
                : viewModel.moMChangePct < 0
                  ? "text-rose-500"
                  : "text-muted-foreground"
            )}
          >
            {viewModel.moMChangePct >= 0 ? "+" : ""}
            {viewModel.moMChangePct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Row-card timeline list inside ScrollArea */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {recentActivity.length > 0 ? (
          <ScrollArea className="h-[220px] w-full px-2">
            <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-2">
              {recentActivity.map((activity) => {
                const { icon: DotIcon, color: iconColor } = getActivityStyle(activity.type, activity.title)

                return (
                  <Item
                    key={activity.id}
                    asChild
                    className={cn(
                      "px-2.5 py-2 hover:bg-muted/60 transition-colors rounded-xl",
                      activity.href ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    {activity.href ? (
                      <Link href={activity.href} className="w-full flex items-center gap-2.5">
                        <ItemMedia className={cn("size-8 rounded-xl border", iconColor)}>
                          <DotIcon className="size-3.5" />
                        </ItemMedia>

                        <ItemContent className="min-w-0">
                          <ItemHeader>
                            <ItemTitle className="text-xs font-bold text-foreground">
                              {activity.title}
                            </ItemTitle>
                            <span className="text-[10px] font-normal text-muted-foreground shrink-0">
                              {format(new Date(activity.date), "PP")}
                            </span>
                          </ItemHeader>
                          <ItemDescription className="text-[11px] leading-relaxed truncate mt-0.5">
                            {activity.description}
                          </ItemDescription>
                        </ItemContent>

                        {activity.amount !== undefined && (
                          <ItemActions className="shrink-0">
                            <span className="text-xs font-bold whitespace-nowrap tabular-nums min-w-19 text-right">
                              {activity.title === "High Expense" ? "-" : ""}
                              {formatCurrency(activity.amount / 100, activity.currency || viewModel.currency)}
                            </span>
                            <div className="size-6 shrink-0" />
                          </ItemActions>
                        )}
                      </Link>
                    ) : (
                      <div className="w-full flex items-center gap-2.5">
                        <ItemMedia className={cn("size-8 rounded-xl border", iconColor)}>
                          <DotIcon className="size-3.5" />
                        </ItemMedia>

                        <ItemContent className="min-w-0">
                          <ItemHeader>
                            <ItemTitle className="text-xs font-bold text-foreground">
                              {activity.title}
                            </ItemTitle>
                            <span className="text-[10px] font-normal text-muted-foreground shrink-0">
                              {format(new Date(activity.date), "PP")}
                            </span>
                          </ItemHeader>
                          <ItemDescription className="text-[11px] leading-relaxed truncate mt-0.5">
                            {activity.description}
                          </ItemDescription>
                        </ItemContent>

                        {activity.amount !== undefined && (
                          <ItemActions className="shrink-0">
                            <span className="text-xs font-bold whitespace-nowrap tabular-nums min-w-19 text-right">
                              {activity.title === "High Expense" ? "-" : ""}
                              {formatCurrency(activity.amount / 100, activity.currency || viewModel.currency)}
                            </span>
                            <div className="size-6 shrink-0" />
                          </ItemActions>
                        )}
                      </div>
                    )}
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <div className="text-xs text-muted-foreground py-10 text-center flex items-center justify-center h-53.75">
            No recent financial logs.
          </div>
        )}
      </div>
    </div>
  )
}