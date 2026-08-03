"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Cell, Pie, PieChart, Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from "@/components/ui/item"
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
import { SharedExpense, SharedSettlement, ParticipantType } from "@/types"
import { deleteSharedExpenseAction } from "@/lib/actions/shared-expenses"
import { SettleUpDialog } from "./settle-up-dialog"
import {
  ArrowLeft,
  Calendar,
  HandCoins,
  Receipt,
  User,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Scale,
  Users2,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  PieChart as PieChartIcon,
  Percent,
  Banknote,
  FileText,
  BarChart3,
} from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { toast } from "sonner"

interface SharedExpenseDetailsProps {
  expense: SharedExpense
  settlements: SharedSettlement[]
  currentUserId: string
  currentUserName: string
  contacts: { id: string; name: string }[]
  wallets?: { id: string; name: string; currency?: string; balanceCents?: number }[]
}

const SPLIT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function SharedExpenseDetails({
  expense,
  settlements,
  currentUserId,
  currentUserName,
  contacts,
  wallets = [],
}: SharedExpenseDetailsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [settleOpen, setSettleOpen] = useState(false)
  const [activeSliceIndex, setActiveSliceIndex] = useState<number | undefined>(undefined)

  const isOwner = expense.userId === currentUserId
  const dateStr = formatDate(expense.date)

  // User and Payer calculations
  const userParticipant = expense.participants.find((p) => p.participantId === currentUserId)
  const payerParticipant = expense.participants.find((p) => p.participantId === expense.paidByParticipantId)
  const payerName = expense.paidByParticipantId === currentUserId ? "You" : payerParticipant?.name || "Partner"

  // User Net Balance accounting for settlements received and paid
  const userOwedCents = userParticipant ? userParticipant.amountOwed : 0
  const userPaidCents = userParticipant ? userParticipant.amountPaid : 0
  const rawNetCents = userPaidCents - userOwedCents

  // Linked settlements for this expense (or between its participants)
  const participantIdsSet = new Set(expense.participants.map((p) => p.participantId))
  const linkedSettlements = settlements
    .filter(
      (s) =>
        s.expenseId === expense._id.toString() ||
        (participantIdsSet.has(s.fromParticipantId) && participantIdsSet.has(s.toParticipantId))
    )
    .sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime())
  const totalSettledCents = linkedSettlements.reduce((acc, s) => acc + s.amount, 0)

  const userSettlementsReceived = linkedSettlements
    .filter((s) => s.toParticipantId === currentUserId)
    .reduce((acc, s) => acc + s.amount, 0)
  const userSettlementsPaid = linkedSettlements
    .filter((s) => s.fromParticipantId === currentUserId)
    .reduce((acc, s) => acc + s.amount, 0)

  const userNetCents =
    rawNetCents > 0
      ? Math.max(0, rawNetCents - userSettlementsReceived + userSettlementsPaid)
      : Math.min(0, rawNetCents + userSettlementsPaid - userSettlementsReceived)

  // Total debt owed by non-payers
  const totalDebtCents = expense.participants
    .filter((p) => p.participantId !== expense.paidByParticipantId)
    .reduce((acc, p) => acc + p.amountOwed, 0)

  const progressPct = totalDebtCents > 0 ? Math.min(100, (totalSettledCents / totalDebtCents) * 100) : 100
  const accentColor = userNetCents >= 0 ? "#10b981" : "#ef4444"
  const avgSharePerParticipant = expense.participants.length > 0
    ? Math.round(expense.totalAmount / expense.participants.length)
    : 0

  // Participant split radial-gauge data
  const splitData = useMemo(() => {
    return expense.participants
      .map((p, idx) => ({
        participantId: p.participantId,
        name: p.participantId === currentUserId ? "You" : p.name,
        value: p.amountOwed / 100,
        rawAmount: p.amountOwed,
        percentage: expense.totalAmount > 0 ? (p.amountOwed / expense.totalAmount) * 100 : 0,
        color: SPLIT_COLORS[idx % SPLIT_COLORS.length],
      }))
      .filter((d) => d.value > 0)
  }, [expense.participants, expense.totalAmount, currentUserId])

  const splitChartConfig = useMemo(() => {
    return splitData.reduce((acc, item) => {
      acc[item.name] = { label: item.name, color: item.color }
      return acc
    }, {} as ChartConfig)
  }, [splitData])

  // Paid vs Owed comparison data — horizontal bar pairs per participant
  const paidVsOwedData = useMemo(() => {
    return expense.participants.map((p) => ({
      participantId: p.participantId,
      name: p.participantId === currentUserId ? "You" : p.name,
      paid: p.amountPaid / 100,
      owed: p.amountOwed / 100,
      rawPaid: p.amountPaid,
      rawOwed: p.amountOwed,
    }))
  }, [expense.participants, currentUserId])

  const paidVsOwedConfig = useMemo(
    () =>
      ({
        paid: { label: "Paid", color: "var(--chart-1)" },
        owed: { label: "Owed", color: "var(--chart-3)" },
      }) satisfies ChartConfig,
    []
  )

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteSharedExpenseAction(expense._id.toString())
      toast.success("Shared expense deleted")
      router.push("/shared-expenses")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete shared expense")
    } finally {
      setIsDeleting(false)
    }
  }

  // Participants list for Settle Up dialog dropdown
  const settleParticipants = expense.participants.map((p) => ({
    id: p.participantId,
    type: p.participantType,
    name: p.participantId === currentUserId ? `You (${currentUserName || "User"})` : p.name,
  }))

  // Resolve a participant row's redirect target — contacts link out, "you" has nowhere to go
  const getParticipantHref = (participantId: string, participantType: ParticipantType) => {
    if (participantType === "contact" && contacts.some((c) => c.id === participantId)) {
      return `/contacts/${participantId}`
    }
    return "#"
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      {/* ── Header Bar matching Loan/Goal/Budget Details ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Link
            href="/shared-expenses"
            className="flex items-center justify-center size-11 shrink-0 border border-border/40 hover:bg-muted/50 rounded-2xl transition-colors mt-0.5"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight">{expense.title}</h1>
              <Badge variant={expense.status === "settled" ? "secondary" : "outline"} className="rounded-md capitalize font-semibold text-[10px] h-5">
                {expense.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="rounded-md capitalize text-[10px] font-semibold h-5">
                {expense.splitMode} split
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Created {dateStr} · Paid Upfront by <span className="font-bold text-foreground">{payerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setSettleOpen(true)}
            className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform"
          >
            <HandCoins className="size-4" />
            Settle Up
          </Button>

          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="size-10 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-500">
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border border-border/40 p-6 shadow-xl">
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <Trash2 />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Delete this shared expense?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this shared expense record and update group balance calculations. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-semibold" disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    className="rounded-xl font-semibold"
                    disabled={isDeleting}
                    onClick={handleDelete}
                  >
                    {isDeleting ? "Deleting..." : "Delete Expense"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="flex flex-wrap gap-4">
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={Receipt}
          color="#6366f1"
          label="Total Expense"
          value={formatCurrency(expense.totalAmount, expense.currency)}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={User}
          color="#3b82f6"
          label="Paid Upfront By"
          value={payerName}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={userNetCents >= 0 ? ArrowUpRight : ArrowDownLeft}
          color={accentColor}
          label="Your Net Position"
          value={`${userNetCents >= 0 ? "+" : "-"}${formatCurrency(Math.abs(userNetCents), expense.currency)}`}
          valueClassName={userNetCents >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
        />
        <MetricCard
          style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
          icon={CheckCircle2}
          color="#10b981"
          label="Settlement Progress"
          value={`${progressPct.toFixed(0)}%`}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* ── Progress Card (matches Loan/Goal/Budget pattern) ── */}
      <Card className="rounded-2xl border border-border/40 shadow-sm p-5 gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-primary" />
            <span className="text-sm font-bold">Settlement Progress</span>
          </div>
          <span className={cn("text-xs font-bold tabular-nums", progressPct >= 100 ? "text-emerald-500" : "text-primary")}>
            {progressPct.toFixed(1)}% complete
          </span>
        </div>

        <Progress
          value={progressPct}
          indicatorStyle={{ backgroundColor: progressPct >= 100 ? "#10b981" : "var(--primary)" }}
          className="h-2.5 bg-muted/60"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Settled Debt</span>
            <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSettledCents, expense.currency)}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Target Debt</span>
            <span className="text-sm font-bold tabular-nums">{formatCurrency(totalDebtCents, expense.currency)}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Participants</span>
            <span className="text-sm font-bold tabular-nums">{expense.participants.length}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Avg. Share</span>
            <span className="text-sm font-bold tabular-nums">{formatCurrency(avgSharePerParticipant, expense.currency)}</span>
          </div>
        </div>
      </Card>

      {/* ── Row 1: Expense Information · Split Allocation · Participant Breakdown (equal thirds) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
            <Info className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expense Information</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-3.5 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                <Percent className="size-3" /> Split Mode
              </span>
              <span className="font-semibold capitalize">{expense.splitMode}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                <Banknote className="size-3" /> Currency
              </span>
              <span className="font-semibold">{expense.currency}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                <Calendar className="size-3" /> Date
              </span>
              <span className="font-semibold">{formatDate(expense.date)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                <User className="size-3" /> Paid By
              </span>
              <span className="font-semibold truncate">{payerName}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                <ShieldCheck className="size-3" /> Created By
              </span>
              <span className="font-semibold truncate">{isOwner ? "You (Owner)" : payerName}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                <CreditCard className="size-3" /> Wallet Sync
              </span>
              <span className="font-semibold truncate">
                {expense.transactionId ? "Linked to Wallet" : "Manual Record"}
              </span>
            </div>

            {expense.notes && (
              <div className="col-span-2 pt-2.5 border-t border-border/30">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider block mb-1">Notes</span>
                <p className="text-[11px] bg-muted/30 p-2 rounded-lg border border-border/20 italic leading-relaxed">
                  {expense.notes}
                </p>
              </div>
            )}

            <div className="col-span-2 pt-2.5 border-t border-border/30 grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Settlements</span>
                <span className="font-semibold text-foreground">{linkedSettlements.length}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Status</span>
                <span className={cn("font-semibold capitalize", expense.status === "settled" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                  {expense.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">Last Update</span>
                <span className="font-semibold text-foreground">
                  {linkedSettlements[0] ? formatDate(linkedSettlements[0].settledAt) : "—"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Split Allocation — radial gauge, mirrors currency-allocation-card's half-donut pattern */}
        <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChartIcon className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Split Allocation</span>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {splitData.length} {splitData.length === 1 ? "share" : "shares"}
            </span>
          </div>

          <div className="px-2 py-0 flex-1 flex flex-col items-center justify-center">
            {splitData.length > 0 ? (
              <ChartContainer
                config={splitChartConfig}
                className="w-full max-w-67.5 sm:max-w-72.5 h-44 sm:h-48 mx-auto"
              >
                <PieChart margin={{ top: 4, bottom: 0, left: 8, right: 8 }}>
                  <Pie
                    data={splitData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="72%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius="68%"
                    outerRadius="95%"
                    cornerRadius={4}
                    paddingAngle={3}
                    minAngle={10}
                    stroke="var(--card)"
                    strokeWidth={2}
                    onMouseEnter={(_, index) => setActiveSliceIndex(index)}
                    onMouseLeave={() => setActiveSliceIndex(undefined)}
                  >
                    {splitData.map((entry, index) => (
                      <Cell
                        key={entry.participantId}
                        fill={entry.color}
                        style={{
                          opacity: activeSliceIndex === undefined || activeSliceIndex === index ? 1 : 0.35,
                          transition: "opacity 0.2s ease-in-out",
                          outline: "none",
                        }}
                      />
                    ))}
                  </Pie>
                  <text x="50%" y="72%" textAnchor="middle" className="pointer-events-none">
                    <tspan x="50%" dy="-10" className="fill-foreground text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight">
                      {formatCurrency(expense.totalAmount, expense.currency)}
                    </tspan>
                    <tspan x="50%" dy="18" className="fill-muted-foreground text-[9px] font-bold uppercase tracking-wider">
                      Total Split
                    </tspan>
                  </text>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name, item) => {
                          const color = item.payload?.color
                          const rawAmount = item.payload?.rawAmount ?? Number(value) * 100
                          const pct = item.payload?.percentage ?? 0
                          return (
                            <>
                              <div className="h-2.5 w-2.5 shrink-0 rounded-xs" style={{ backgroundColor: color }} />
                              <div className="flex flex-1 justify-between items-center leading-none gap-2">
                                <span className="text-muted-foreground font-medium">{String(name)}:</span>
                                <span className="font-mono font-bold text-foreground">
                                  {formatCurrency(rawAmount, expense.currency)} ({pct.toFixed(0)}%)
                                </span>
                              </div>
                            </>
                          )
                        }}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="text-xs text-muted-foreground py-6 text-center">No allocated shares.</div>
            )}
          </div>

          {splitData.length > 0 && (
            <ScrollArea className="max-h-12 w-full border-t border-border/30 bg-muted/5 px-3 py-1.5">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
                {splitData.map((entry, index) => (
                  <div
                    key={entry.participantId}
                    className={cn(
                      "flex items-center gap-1.5 text-xs transition-opacity cursor-default",
                      activeSliceIndex !== undefined && activeSliceIndex !== index ? "opacity-30" : "opacity-100"
                    )}
                    onMouseEnter={() => setActiveSliceIndex(index)}
                    onMouseLeave={() => setActiveSliceIndex(undefined)}
                  >
                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="font-bold text-foreground">{entry.name}</span>
                    <span className="text-[10px] font-extrabold text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded-full border border-border/30">
                      {entry.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>

        {/* Participant Breakdown — compact, content-sized (no forced height, no 2/3 width) */}
        <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users2 className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Participant Breakdown</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
              {expense.participants.length}
            </span>
          </div>

          <ScrollArea className="max-h-80">
            <ItemGroup className="gap-0 divide-y divide-border/30 px-2 py-1">
              {expense.participants.map((p) => {
                const isPayer = p.participantId === expense.paidByParticipantId
                const netBalance = p.amountPaid - p.amountOwed
                const isMe = p.participantId === currentUserId
                const href = getParticipantHref(p.participantId, p.participantType)

                return (
                  <Item key={p.participantId} size="sm" asChild className="cursor-pointer">
                    <Link href={href}>
                      <ItemMedia className="size-8 rounded-xl border bg-primary/10 text-primary border-primary/20 font-black text-xs flex items-center justify-center">
                        {p.name[0]}
                      </ItemMedia>
                      <ItemContent className="gap-0.5">
                        <ItemTitle className="gap-1.5">
                          <span className="text-xs font-bold">{isMe ? "You" : p.name}</span>
                          {isPayer && (
                            <Badge variant="secondary" className="text-[9px] font-bold px-1.5 h-4 rounded-md shrink-0">
                              Paid
                            </Badge>
                          )}
                        </ItemTitle>
                        <ItemDescription className="text-[10px]">
                          Paid {formatCurrency(p.amountPaid, expense.currency)}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono font-bold text-xs tabular-nums whitespace-nowrap">
                          {formatCurrency(p.amountOwed, expense.currency)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0 rounded-md whitespace-nowrap",
                            netBalance > 0
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : netBalance < 0
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {netBalance > 0
                            ? `+${formatCurrency(netBalance, expense.currency)}`
                            : netBalance < 0
                              ? `-${formatCurrency(Math.abs(netBalance), expense.currency)}`
                              : "Settled"}
                        </Badge>
                      </ItemActions>
                    </Link>
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        </Card>
      </div>

      {/* ── Row 2: Wallet Integration · Paid vs Owed · Settlement Timeline (equal thirds) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wallet Integration */}
        <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
            <CreditCard className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Wallet Integration</span>
          </div>
          <div className="p-4 flex flex-col h-full">
            {expense.transactionId ? (
              <div className="flex flex-col gap-3 h-full">
                <div className="p-3.5 border border-emerald-500/20 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <ShieldCheck className="size-4 text-emerald-500" />
                      <span>Wallet Deducted & Logged</span>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase">
                      Synced
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground pt-1 border-t border-emerald-500/15">
                    <p className="flex justify-between">
                      <span>Source Wallet:</span>
                      <span className="font-bold text-foreground">
                        {wallets.length > 0 ? wallets[0].name : "Primary Wallet"}
                      </span>
                    </p>
                    {userPaidCents > 0 && (
                      <p className="flex justify-between">
                        <span>Amount Paid Out:</span>
                        <span className="font-mono font-bold text-foreground">
                          {formatCurrency(userPaidCents, expense.currency)}
                        </span>
                      </p>
                    )}
                    <p className="flex justify-between">
                      <span>Your Allocated Share:</span>
                      <span className="font-mono font-bold text-foreground">
                        {formatCurrency(userOwedCents, expense.currency)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Wallet Balance</span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      {formatCurrency(wallets?.[0]?.balanceCents ?? 0, wallets?.[0]?.currency ?? expense.currency)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Ref & Logged</span>
                    <span className="text-xs font-mono font-bold truncate">
                      #{expense.transactionId.toString().slice(-6)} · {formatDate(expense.date)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full gap-3">
                <div className="p-3.5 border border-border/50 rounded-xl bg-muted/20 text-muted-foreground space-y-1">
                  <p className="text-[11px] font-semibold">No direct wallet transaction attached at creation.</p>
                  <p className="text-[10px]">Settle-up payments recorded will optionally log to your chosen wallet.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Available Wallet</span>
                    <span className="text-xs font-mono font-bold text-foreground truncate">
                      {wallets?.[0]?.name ?? "Primary Wallet"} ({formatCurrency(wallets?.[0]?.balanceCents ?? 0, wallets?.[0]?.currency ?? expense.currency)})
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Settle Auto-Debit</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Ready</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Paid vs Owed — vertical bar comparison per participant */}
        <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
            <BarChart3 className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paid vs Owed</span>
          </div>
          <div className="p-4">
            {paidVsOwedData.length > 0 ? (
              <ChartContainer config={paidVsOwedConfig} className="w-full h-48">
                <BarChart accessibilityLayer data={paidVsOwedData}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={{ stroke: "var(--border)" }}
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(val: string) => (val.length > 10 ? `${val.slice(0, 8)}…` : val)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="paid" fill="var(--color-paid)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="owed" fill="var(--color-owed)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="text-xs text-muted-foreground py-6 text-center">No participant data.</div>
            )}
          </div>
        </Card>

        {/* Settlement Timeline — compact, matches column width of siblings */}
        <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Settlement Timeline</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
              {linkedSettlements.length}
            </span>
          </div>

          {linkedSettlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 px-4">
              <FileText className="size-6 text-muted-foreground/25 mb-2" />
              <p className="text-xs font-bold">No settlements yet</p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-50">
                Payments recorded here will appear as a timeline.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <ItemGroup className="gap-0 divide-y divide-border/30 px-2 py-1">
                {linkedSettlements.map((s) => (
                  <Item key={s._id.toString()} size="sm" asChild className="cursor-pointer">
                    <Link href="#" onClick={(e) => e.preventDefault()}>
                      <ItemMedia className="size-8 rounded-xl border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center justify-center">
                        <HandCoins className="size-3.5" />
                      </ItemMedia>
                      <ItemContent className="gap-0.5">
                        <ItemTitle className="flex-wrap gap-1">
                          <span className="text-xs font-bold text-foreground truncate">
                            {s.paymentMethod || "Cash"}
                          </span>
                          <span className="text-[10px] font-normal text-muted-foreground">{formatDate(s.settledAt)}</span>
                        </ItemTitle>
                        <ItemDescription className="text-[10px] truncate">
                          {s.notes || "Recorded settlement"}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          +{formatCurrency(s.amount, s.currency)}
                        </span>
                      </ItemActions>
                    </Link>
                  </Item>
                ))}
              </ItemGroup>
            </ScrollArea>
          )}
        </Card>
      </div>

      {/* Settle Up Modal */}
      <SettleUpDialog
        open={settleOpen}
        onOpenChange={setSettleOpen}
        participants={settleParticipants}
        defaultPayerId={currentUserId}
        defaultReceiverId={expense.paidByParticipantId !== currentUserId ? expense.paidByParticipantId : undefined}
        currency={expense.currency}
        expenseId={expense._id.toString()}
        wallets={wallets}
      />
    </div>
  )
}