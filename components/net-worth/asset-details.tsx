"use client"

import { useState, useTransition, useMemo } from "react"
import { Asset, AssetValuation } from "@/types"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog"
import { AssetDialog } from "./asset-dialog"
import { ValuationDialog } from "./valuation-dialog"
import { deleteAsset, deleteAssetValuation } from "@/lib/actions/assets"
import { toast } from "sonner"
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Building,
  Car,
  Coins,
  Globe,
  TrendingUp,
  Wallet,
  Building2,
  GraduationCap,
  HandCoins,
  CreditCard,
  HelpCircle,
  Calendar,
  Percent,
  Trash2,
  Edit,
  Info,
  Layers,
  Sparkles,
  Link2,
  Plus,
  Clock,
  PlusCircle,
} from "lucide-react"

const categoryIconMap: Record<string, React.ElementType> = {
  real_estate: Building2,
  vehicle: Car,
  gold: Coins,
  crypto: Globe,
  investment: TrendingUp,
  cash: Wallet,
  mortgage: Building,
  student_loan: GraduationCap,
  auto_loan: Car,
  personal_loan: HandCoins,
  credit_card: CreditCard,
  other: HelpCircle,
}

const categoryLabels: Record<string, string> = {
  real_estate: "Real Estate",
  vehicle: "Vehicle",
  gold: "Gold",
  crypto: "Crypto",
  investment: "Investment",
  cash: "Cash",
  mortgage: "Mortgage",
  student_loan: "Student Loan",
  auto_loan: "Auto Loan",
  personal_loan: "Personal Loan",
  credit_card: "Credit Card",
  other: "Other",
}

interface AssetDetailsProps {
  asset: Asset
  valuations: AssetValuation[]
}

export function AssetDetails({ asset, valuations }: AssetDetailsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isAsset = asset.kind === "asset"
  const accent = isAsset ? "#10b981" : "#ef4444"
  const Icon = categoryIconMap[asset.category] || HelpCircle
  const categoryLabel = categoryLabels[asset.category] || asset.category

  const netOwnedValue = Math.round(asset.currentValue * (asset.ownershipPercentage / 100))

  const sortedValuations = [...valuations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const [timeRange, setTimeRange] = useState("all")

  const chartConfig = {
    value: {
      label: "Value",
      color: isAsset ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)",
    },
  } satisfies ChartConfig

  const { chartData, filteredData } = useMemo(() => {
    // chartData maps all raw logged valuations
    const rawData = sortedValuations.map((v) => ({
      dateStr: formatDate(v.date),
      dateStrShort: new Date(v.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      date: new Date(v.date),
      value: v.value / 100,
    }))

    if (rawData.length === 0) {
      return { chartData: [], filteredData: [] }
    }

    // Function to construct a daily time-series filled forward
    const getDailyFilledData = (startDate: Date, endDate: Date) => {
      const result = []

      const getValuationForDate = (date: Date) => {
        let lastVal = sortedValuations[0]
        for (const val of sortedValuations) {
          const valDate = new Date(val.date)
          valDate.setUTCHours(0, 0, 0, 0)
          if (valDate <= date) {
            lastVal = val
          } else {
            break
          }
        }
        return lastVal.value / 100
      }

      // Determine step interval based on length of timeframe to optimize performance
      let stepDays = 1
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 365) {
        stepDays = 7 // Weekly steps for > 1 year
      }
      if (diffDays > 365 * 3) {
        stepDays = 30 // Monthly steps for > 3 years
      }

      const current = new Date(startDate)
      current.setUTCHours(0, 0, 0, 0)

      while (current <= endDate) {
        const dateStr = formatDate(current)
        const dateStrShort = current.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })

        result.push({
          dateStr,
          dateStrShort,
          date: new Date(current),
          value: getValuationForDate(current),
        })

        current.setUTCDate(current.getUTCDate() + stepDays)
      }

      // Ensure the last valuation point is always added exactly at the endDate
      const lastPoint = result[result.length - 1]
      if (lastPoint && lastPoint.date.getTime() !== endDate.getTime()) {
        result.push({
          dateStr: formatDate(endDate),
          dateStrShort: endDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }),
          date: new Date(endDate),
          value: getValuationForDate(endDate),
        })
      }

      return result
    }

    const latestValuationDate = new Date(sortedValuations[sortedValuations.length - 1].date)
    latestValuationDate.setUTCHours(0, 0, 0, 0)

    // Calculate start date
    let startDate = new Date(latestValuationDate)
    if (timeRange === "all") {
      startDate = new Date(sortedValuations[0].date)
    } else {
      let daysToSubtract = 90
      if (timeRange === "30d") {
        daysToSubtract = 30
      } else if (timeRange === "7d") {
        daysToSubtract = 7
      }
      startDate.setUTCDate(startDate.getUTCDate() - daysToSubtract)
    }
    startDate.setUTCHours(0, 0, 0, 0)

    const dailyData = getDailyFilledData(startDate, latestValuationDate)

    return { chartData: rawData, filteredData: dailyData }
  }, [sortedValuations, timeRange])

  // Change since first recorded valuation
  const valueChange = (() => {
    if (sortedValuations.length < 2) return null
    const first = sortedValuations[0].value
    const latest = sortedValuations[sortedValuations.length - 1].value
    if (first === 0) return null
    const diff = latest - first
    const pct = (diff / Math.abs(first)) * 100
    return { diff, pct, isPositive: diff >= 0 }
  })()

  // Timeline events, newest first — mirrors Loans timeline pattern
  const timelineEvents = [...sortedValuations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((v, idx, arr) => ({
      id: v._id.toString(),
      date: new Date(v.date),
      value: v.value,
      source: v.source,
      notes: v.notes,
      isBaseline: idx === arr.length - 1,
    }))

  const handleDeleteAsset = () => {
    startTransition(async () => {
      try {
        const result = await deleteAsset(asset._id.toString())
        if (result.success) {
          toast.success("Item deleted successfully")
          router.push("/net-worth")
          router.refresh()
        } else {
          toast.error(result.error || "Failed to delete item")
        }
      } catch (err) {
        console.error(err)
        toast.error("An unexpected error occurred")
      }
    })
  }

  const handleDeleteValuation = (valId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteAssetValuation(valId)
        if (result.success) {
          toast.success("Valuation deleted")
          router.refresh()
        } else {
          toast.error(result.error || "Failed to delete valuation")
        }
      } catch (err) {
        console.error(err)
        toast.error("An unexpected error occurred")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* ── Header (matches Loan detail page pattern) ────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Link
            href="/net-worth"
            className="flex items-center justify-center size-11 shrink-0 border border-border/40 hover:bg-muted/50 rounded-2xl transition-colors mt-0.5"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight">{asset.name}</h1>
              <Badge
                variant="outline"
                className="rounded-md font-semibold text-[10px] h-5"
                style={{ backgroundColor: `${accent}15`, color: accent, borderColor: `${accent}30` }}
              >
                {isAsset ? "Asset" : "Liability"}
              </Badge>
              {asset.status === "archived" && (
                <Badge variant="outline" className="rounded-md font-semibold text-muted-foreground text-[10px] h-5">
                  Archived
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {categoryLabel} · Manual tracking item
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ValuationDialog
            assetId={asset._id.toString()}
            assetCurrency={asset.currency}
            trigger={
              <Button className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
                <Plus className="size-4" />
                Add Valuation
              </Button>
            }
            onSuccess={() => router.refresh()}
          />
          <AssetDialog
            initialAsset={asset}
            trigger={
              <Button variant="outline" size="icon" className="size-10 rounded-xl">
                <Edit className="size-4" />
              </Button>
            }
            onSuccess={() => router.refresh()}
          />
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
            </Button>
            <AlertDialogContent className="rounded-2xl border border-border/40 p-6 shadow-xl">
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <Trash2 />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this manual item and all of its historical valuation records. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-semibold" disabled={isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  className="rounded-xl font-semibold"
                  disabled={isPending}
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteAsset()
                  }}
                >
                  {isPending ? "Deleting..." : "Delete Item"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="flex flex-wrap gap-4">
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Icon}
          color={accent}
          label="Current Value"
          value={formatCurrency(asset.currentValue / 100, asset.currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={HandCoins}
          color={isAsset ? "#10b981" : "#f43f5e"}
          label="Net Value Owned"
          value={formatCurrency(netOwnedValue / 100, asset.currency)}
          valueClassName={isAsset ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={TrendingUp}
          color="#3b82f6"
          label="Value Change"
          value={valueChange ? `${valueChange.isPositive ? "+" : ""}${valueChange.pct.toFixed(1)}%` : "—"}
          valueClassName={valueChange ? (valueChange.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400") : ""}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Calendar}
          color="#f59e0b"
          label="Acquisition Date"
          value={asset.acquiredAt ? formatDate(asset.acquiredAt) : "Unknown"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left column: Item Info + Notes + placeholders ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
              <Info className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Item Information</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-3.5 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                  <Layers className="size-3" /> Type
                </span>
                <span className="font-semibold">{isAsset ? "Asset" : "Liability"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                  <Coins className="size-3" /> Denomination
                </span>
                <span className="font-semibold">{asset.currency}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                  <Percent className="size-3" /> Ownership
                </span>
                <span className="font-semibold">{asset.ownershipPercentage}%</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                  <Calendar className="size-3" /> Acquired
                </span>
                <span className="font-semibold">{asset.acquiredAt ? formatDate(asset.acquiredAt) : "None"}</span>
              </div>

              {asset.notes && (
                <div className="col-span-2 pt-2.5 border-t border-border/30">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider block mb-1">Notes</span>
                  <p className="text-[11px] bg-muted/30 p-2 rounded-lg border border-border/20 italic leading-relaxed">
                    {asset.notes}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden opacity-75">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
              <Link2 className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Attachments</span>
            </div>
            <div className="p-4 text-[11px] text-muted-foreground leading-relaxed">
              Upload invoices, land registers, vehicle certificates, and tax records. (Coming soon)
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden opacity-75">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
              <Globe className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Market Sync</span>
            </div>
            <div className="p-4 text-[11px] text-muted-foreground leading-relaxed">
              Real-time synchronization with gold/silver indices, crypto accounts, and stock indices. (Coming soon)
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden opacity-75">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
              <Sparkles className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Valuation Insights</span>
            </div>
            <div className="p-4 text-[11px] text-muted-foreground leading-relaxed">
              Predictive evaluations, depreciation calculations, and health insights. (Coming soon)
            </div>
          </Card>
        </div>

        {/* ── Right column: Chart + Timeline ───────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:h-0 lg:min-h-full">
          {/* Chart */}
          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valuation Trend</span>
              </div>
              {chartData.length > 0 && (
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger
                    className="h-7 w-30 rounded-lg text-[10px] bg-transparent border-border/40"
                    size="sm"
                    aria-label="Select timeframe"
                  >
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="rounded-lg text-[11px]">
                      All time
                    </SelectItem>
                    <SelectItem value="90d" className="rounded-lg text-[11px]">
                      Last 90 days
                    </SelectItem>
                    <SelectItem value="30d" className="rounded-lg text-[11px]">
                      Last 30 days
                    </SelectItem>
                    <SelectItem value="7d" className="rounded-lg text-[11px]">
                      Last 7 days
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="p-4">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-50 text-muted-foreground text-xs">
                  No historical valuations logged.
                </div>
              ) : filteredData.length === 0 ? (
                <div className="flex items-center justify-center h-50 text-muted-foreground text-xs">
                  No valuations in selected timeframe.
                </div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="h-50 w-full"
                >
                  <AreaChart data={filteredData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--color-value)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-value)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="dateStrShort"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={16}
                      className="text-[10px] font-medium text-muted-foreground"
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-[10px] font-medium text-muted-foreground" tickFormatter={(val) => val.toFixed(0)} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          labelFormatter={(_, payload) => {
                            if (payload && payload.length > 0) {
                              return payload[0].payload.dateStr
                            }
                            return ""
                          }}
                          formatter={(value) => (
                            <>
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-xs"
                                style={{
                                  backgroundColor: isAsset ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)",
                                }}
                              />
                              <div className="flex flex-1 justify-between items-center leading-none gap-4">
                                <span className="text-muted-foreground">Value</span>
                                <span className="font-mono font-medium text-foreground tabular-nums">
                                  {formatCurrency(Number(value), asset.currency)}
                                </span>
                              </div>
                            </>
                          )}
                        />
                      }
                    />
                    <Area
                      dataKey="value"
                      type="monotone"
                      fill="url(#fillValue)"
                      stroke="var(--color-value)"
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </div>
          </Card>

          {/* Valuation Timeline — row-card pattern like Loan History & Timeline */}
          <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 flex-1 min-h-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valuation Timeline</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                  {timelineEvents.length} entr{timelineEvents.length !== 1 ? "ies" : "y"}
                </span>
                <ValuationDialog
                  assetId={asset._id.toString()}
                  assetCurrency={asset.currency}
                  trigger={
                    <Button variant="outline" size="sm" className="h-7 rounded-lg text-[11px] font-bold px-2.5">
                      <PlusCircle className="size-3 mr-1" />
                      Add Entry
                    </Button>
                  }
                  onSuccess={() => router.refresh()}
                />
              </div>
            </div>

            {timelineEvents.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No valuation entries registered yet.
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0">
                <div className="flex flex-col divide-y divide-border/30">
                  {timelineEvents.map((event) => (
                    <div key={event.id} className="group flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors">
                      <div
                        className={cn(
                          "size-8 rounded-xl flex items-center justify-center border shrink-0",
                          isAsset ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}
                      >
                        <TrendingUp className="size-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">
                            {formatCurrency(event.value / 100, asset.currency)}
                          </span>
                          <span className="text-[10px] font-normal text-muted-foreground">{formatDate(event.date)}</span>
                          <Badge variant="outline" className="rounded-md text-[9px] uppercase font-bold tracking-wider h-4 px-1.5">
                            {event.source}
                          </Badge>
                          {event.isBaseline && (
                            <Badge variant="outline" className="rounded-md text-[9px] uppercase font-bold tracking-wider h-4 px-1.5 text-muted-foreground">
                              Baseline
                            </Badge>
                          )}
                        </div>
                        {event.notes && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed truncate mt-0.5">
                            &ldquo;{event.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="size-6 flex items-center justify-center shrink-0">
                        {!event.isBaseline && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="size-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border border-border/40 p-6 shadow-xl">
                              <AlertDialogHeader>
                                <AlertDialogMedia>
                                  <Trash2 />
                                </AlertDialogMedia>
                                <AlertDialogTitle>Delete this valuation?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove this point-in-time value record. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-semibold">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  className="rounded-xl font-semibold"
                                  onClick={() => handleDeleteValuation(event.id)}
                                >
                                  Delete Entry
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}