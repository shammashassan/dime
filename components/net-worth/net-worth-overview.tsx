"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { NetWorthOverviewViewModel, Asset, HistoricalNetWorthPoint } from "@/types"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { AssetsListTab } from "./assets-list-tab"
import { Landmark, Info, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)


// Modular Dashboard sub-cards
import { SummaryCards } from "./overview/summary-cards"
import { TimelineCard } from "./overview/timeline-card"
import { FinancialHealthCard } from "./overview/financial-health-card"
import { AssetAllocationCard } from "./overview/asset-allocation-card"
import { CurrencyAllocationCard } from "./overview/currency-allocation-card"
import { TopAssetsCard } from "./overview/top-assets-card"
import { TopLiabilitiesCard } from "./overview/top-liabilities-card"
import { RecentActivityCard } from "./overview/recent-activity-card"
import { QuickActionsCard } from "./overview/quick-actions-card"
import { InsightsCard } from "./overview/insights-card"

interface NetWorthOverviewProps {
  viewModel: NetWorthOverviewViewModel
  historyData: HistoricalNetWorthPoint[]
  assets: Asset[]
}

interface DashboardCardConfig {
  id: string
  type:
  | "timeline"
  | "health"
  | "asset_allocation"
  | "currency_allocation"
  | "top_assets"
  | "top_liabilities"
  | "recent_activity"
  | "quick_actions"
  | "insights"
  className?: string
}

// Extensible Layout Configuration — bento grid, dense rows, no orphaned gaps.
const DEFAULT_BENTO_LAYOUT: DashboardCardConfig[] = [
  { id: "timeline", type: "timeline", className: "lg:col-span-2" },
  { id: "health", type: "health", className: "lg:col-span-1" },
  { id: "asset_allocation", type: "asset_allocation", className: "lg:col-span-1" },
  { id: "currency_allocation", type: "currency_allocation", className: "lg:col-span-1" },
  { id: "quick_actions", type: "quick_actions", className: "lg:col-span-1" },
  { id: "top_assets", type: "top_assets", className: "lg:col-span-1" },
  { id: "top_liabilities", type: "top_liabilities", className: "lg:col-span-1" },
  { id: "recent_activity", type: "recent_activity", className: "lg:col-span-2" },
  { id: "insights", type: "insights", className: "col-span-full" },
]

export function NetWorthOverview({ viewModel, historyData, assets }: NetWorthOverviewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<"overview" | "assets-list">("overview")
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (activeTab !== "overview") return
      const tiles = gsap.utils.toArray<HTMLElement>(".net-worth-card")
      const mm = gsap.matchMedia()

      gsap.set(tiles, { opacity: 0, y: 16 })

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(tiles, { opacity: 1, y: 0 })
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(tiles, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.05,
          ease: "power2.out",
          clearProps: "transform",
        })
      })

      return () => mm.revert()
    },
    { dependencies: [activeTab], scope: containerRef }
  )

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    // Router refresh is fire-and-forget; drop the spin state shortly after so the
    // icon doesn't get stuck if refresh resolves faster than the animation frame.
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const renderCard = (card: DashboardCardConfig) => {
    switch (card.type) {
      case "timeline":
        return <TimelineCard key={card.id} historyData={historyData} currency={viewModel.currency} />
      case "health":
        return <FinancialHealthCard key={card.id} viewModel={viewModel} />
      case "asset_allocation": {
        const currentBreakdown = {
          cash: viewModel.topAssets.filter((a) => a.category === "cash").reduce((s, a) => s + a.originalValue, 0),
          bank: viewModel.topAssets.filter((a) => a.category !== "cash" && a.source === "wallet").reduce((s, a) => s + a.originalValue, 0),
          investments: viewModel.topAssets.filter((a) => a.category === "investment" || a.category === "gold" || a.category === "crypto").reduce((s, a) => s + a.originalValue, 0),
          loans: viewModel.topAssets.filter((a) => a.source === "loan").reduce((s, a) => s + a.originalValue, 0),
          manualAssets: viewModel.topAssets.filter((a) => a.source === "asset" && a.category !== "cash" && a.category !== "investment").reduce((s, a) => s + a.originalValue, 0),
        }
        return <AssetAllocationCard key={card.id} viewModel={viewModel} breakdowns={currentBreakdown} />
      }
      case "currency_allocation": {
        const currencyMap: Record<string, { assets: number; liabilities: number; netWorth: number }> = {}
        const allHoldings = [...viewModel.topAssets, ...viewModel.topLiabilities]
        allHoldings.forEach((h) => {
          if (!currencyMap[h.originalCurrency]) {
            currencyMap[h.originalCurrency] = { assets: 0, liabilities: 0, netWorth: 0 }
          }
          if (h.kind === "asset") {
            currencyMap[h.originalCurrency].assets += h.originalValue
            currencyMap[h.originalCurrency].netWorth += h.originalValue
          } else {
            currencyMap[h.originalCurrency].liabilities += h.originalValue
            currencyMap[h.originalCurrency].netWorth -= h.originalValue
          }
        })
        return <CurrencyAllocationCard key={card.id} viewModel={viewModel} currencyBreakdown={currencyMap} />
      }
      case "top_assets":
        return <TopAssetsCard key={card.id} viewModel={viewModel} />
      case "top_liabilities":
        return <TopLiabilitiesCard key={card.id} viewModel={viewModel} />
      case "recent_activity":
        return <RecentActivityCard key={card.id} viewModel={viewModel} />
      case "quick_actions":
        return <QuickActionsCard key={card.id} assets={assets} onRefresh={handleRefresh} />
      case "insights":
        return <InsightsCard key={card.id} viewModel={viewModel} />
      default:
        return null
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full">
      {/* ── Page Header (Volt style reference) ── */}
      <header className="flex flex-col gap-2 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <p className="font-mono text-[10px] lowercase tracking-widest text-muted-foreground/50">
              dime command center
            </p>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-medium text-primary border border-primary/20">
              v2.0
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Net Worth overview
          </h1>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <p className="text-sm italic lowercase text-muted-foreground/60 hidden md:block">
            track assets, liabilities, allocations, and historical trends.
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-xl bg-card border-border/40 hover:bg-muted/40 cursor-pointer active:scale-95 transition-all"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Refresh data</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* ── Summary Row ── */}
      <SummaryCards viewModel={viewModel} />

      {/* ── Tab Selector ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "overview" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("assets-list")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "assets-list" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Assets &amp; Liabilities ({assets.length})
          </button>
        </div>

        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={(val) => setActiveTab(val as "overview" | "assets-list")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={activeTab === "overview" ? "Overview" : `Assets & Liabilities (${assets.length})`} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="assets-list">Assets &amp; Liabilities ({assets.length})</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeTab === "overview" ? (
        // Dense bento grid — tight gap-4 (not gap-6) to match Loan Detail's compact rhythm.
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {DEFAULT_BENTO_LAYOUT.map((card) => (
            <div key={card.id} className={cn("net-worth-card", card.className)}>
              {renderCard(card)}
            </div>
          ))}
        </div>
      ) : (
        <ScrollArea className="w-full">
          <AssetsListTab assets={assets} />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}