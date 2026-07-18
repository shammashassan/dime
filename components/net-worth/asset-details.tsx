"use client"

import { useState, useTransition } from "react"
import { Asset, AssetValuation } from "@/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AssetDialog } from "./asset-dialog"
import { ValuationDialog } from "./valuation-dialog"
import { deleteAsset, deleteAssetValuation } from "@/lib/actions/assets"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
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
  Pencil,
  Loader2,
  Info,
  Layers,
  Sparkles,
  Link2,
  FileText,
  Plus
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
  const [editOpen, setEditOpen] = useState(false)

  const isAsset = asset.kind === "asset"
  const Icon = categoryIconMap[asset.category] || HelpCircle
  const categoryLabel = categoryLabels[asset.category] || asset.category

  const netOwnedValue = Math.round(asset.currentValue * (asset.ownershipPercentage / 100))

  const sortedValuations = [...valuations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const chartData = sortedValuations.map((v) => ({
    dateStr: formatDate(v.date),
    value: v.value / 100,
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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/20 pb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="icon" className="size-9 rounded-xl shrink-0" asChild>
            <Link href="/net-worth">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight truncate">{asset.name}</h1>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0",
                  isAsset
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                    : "border-rose-500/20 bg-rose-500/5 text-rose-500"
                )}
              >
                {asset.kind}
              </Badge>
              <Badge variant="outline" className="rounded-lg text-[10px] uppercase font-bold tracking-wider">
                {categoryLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manual tracking page for individual assets and liabilities.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Edit Dialog Button */}
          <AssetDialog
            initialAsset={asset}
            trigger={
              <Button variant="outline" className="rounded-xl font-semibold shrink-0">
                <Pencil className="size-4 mr-1.5" />
                Edit Item
              </Button>
            }
            onSuccess={() => router.refresh()}
          />
          {/* Delete Action Trigger */}
          <Button
            variant="outline"
            className="rounded-xl font-semibold text-rose-500 border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500 shrink-0"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Valuation history list and Chart (takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Historical Valuations Chart */}
          <Card className="rounded-2xl border border-border/40 bg-card">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold">Valuation Trend</CardTitle>
              <CardDescription>Value history over time (in {asset.currency}).</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {chartData.length > 0 ? (
                <ChartContainer
                  config={{
                    value: {
                      label: "Value",
                      color: isAsset ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)",
                    },
                  }}
                  className="h-[200px] w-full"
                >
                  <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="dateStr"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-[10px] font-medium text-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-[10px] font-medium text-muted-foreground"
                      tickFormatter={(val) => val.toFixed(0)}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          formatter={(value) => (
                            <div className="flex flex-1 justify-between items-center leading-none gap-4">
                              <span className="text-muted-foreground">Value</span>
                              <span className="font-mono font-medium text-foreground tabular-nums">
                                {formatCurrency(Number(value), asset.currency)}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Line
                      dataKey="value"
                      type="monotone"
                      stroke={isAsset ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"}
                      strokeWidth={2.5}
                      dot={{ strokeWidth: 1.5, r: 3 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-xs">
                  No historical valuations logged.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valuation timeline list */}
          <Card className="rounded-2xl border border-border/40 bg-card">
            <CardHeader className="p-5 pb-3 border-b border-border/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Valuation Timeline</CardTitle>
                <CardDescription>All point-in-time value adjustments recorded.</CardDescription>
              </div>
              <ValuationDialog
                assetId={asset._id.toString()}
                assetCurrency={asset.currency}
                trigger={
                  <Button variant="outline" size="sm" className="rounded-xl font-semibold">
                    <Plus className="size-4 mr-1.5" />
                    Add Entry
                  </Button>
                }
                onSuccess={() => router.refresh()}
              />
            </CardHeader>
            <CardContent className="p-0">
              {valuations.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No valuation entries registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/20 bg-muted/20 text-muted-foreground font-black uppercase tracking-wider">
                        <th className="p-4">Date</th>
                        <th className="p-4">Recorded Value</th>
                        <th className="p-4">Method / Source</th>
                        <th className="p-4">Notes</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valuations.map((v) => (
                        <tr key={v._id.toString()} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-semibold text-foreground">{formatDate(v.date)}</td>
                          <td className="p-4 font-black tabular-nums">
                            {formatCurrency(v.value / 100, asset.currency)}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="rounded-md text-[10px] uppercase font-bold tracking-wider">
                              {v.source}
                            </Badge>
                          </td>
                          <td className="p-4 text-muted-foreground max-w-[200px] truncate">{v.notes || "—"}</td>
                          <td className="p-4 text-right">
                            {valuations.length > 1 ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
                                disabled={isPending}
                                onClick={() => handleDeleteValuation(v._id.toString())}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-medium pr-2">Baseline</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details & Extensible sections */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <h3 className="font-bold text-sm">Item Details</h3>
            
            <div className="space-y-3.5">
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Coins className="size-3.5" /> Denomination
                </span>
                <span className="text-xs font-bold">{asset.currency}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5" /> Valuation Method
                </span>
                <span className="text-xs font-bold capitalize">{asset.valuationMethod}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Percent className="size-3.5" /> Ownership Weight
                </span>
                <span className="text-xs font-bold">{asset.ownershipPercentage}%</span>
              </div>
              {asset.acquiredAt && (
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> Acquisition Date
                  </span>
                  <span className="text-xs font-bold">{formatDate(asset.acquiredAt)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <HandCoins className="size-3.5" /> Net Value Owned
                </span>
                <span className={cn(
                  "text-sm font-black tabular-nums",
                  isAsset ? "text-emerald-500" : "text-rose-500"
                )}>
                  {formatCurrency(netOwnedValue / 100, asset.currency)}
                </span>
              </div>
            </div>
          </Card>

          {/* Notes Card */}
          <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <FileText className="size-4 text-primary" /> Notes
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {asset.notes || "No notes available for this manual item."}
            </p>
          </Card>

          {/* Attachments Card Placeholder */}
          <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 opacity-75">
            <h3 className="font-bold text-sm text-muted-foreground flex items-center gap-1.5">
              <Link2 className="size-4" /> Attachments
            </h3>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Upload invoices, land registers, vehicle certificates, and tax records. (Coming soon)
            </p>
          </Card>

          {/* Market Sync status placeholder */}
          <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 opacity-75">
            <h3 className="font-bold text-sm text-muted-foreground flex items-center gap-1.5">
              <Globe className="size-4" /> Market Synchronization
            </h3>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Real-time synchronization with gold/silver indices, crypto accounts, and stock indices. (Coming soon)
            </p>
          </Card>

          {/* AI insights status placeholder */}
          <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 opacity-75">
            <h3 className="font-bold text-sm text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-4" /> AI Valuation Insights
            </h3>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Predictive evaluations, depreciation calculations, and health insights for your net worth assets. (Coming soon)
            </p>
          </Card>
        </div>
      </div>

      {/* Delete asset alert dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border border-border/40 shadow-xl max-w-[400px] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this manual item and all of its historical valuation records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 pt-2">
            <AlertDialogCancel className="rounded-xl flex-1 mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteAsset()
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
