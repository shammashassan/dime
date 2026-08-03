"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia,
} from "@/components/ui/empty"
import { CreateExpenseDialog } from "./create-expense-dialog"
import { SettleUpDialog } from "./settle-up-dialog"
import { ExpensesList } from "./expenses-list"
import { SettlementsList } from "./settlements-list"
import { BalancesOverviewCard } from "./balances-overview-card"
import { SharedExpensesOverviewViewModel, ParticipantType } from "@/types"
import {
  Users2,
  Plus,
  HandCoins,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface SharedExpensesClientProps {
  viewModel: SharedExpensesOverviewViewModel
  contacts: { id: string; name: string; email?: string }[]
  wallets?: { id: string; name: string }[]
  currentUserId: string
  currentUserName: string
}

export function SharedExpensesClient({
  viewModel,
  contacts,
  wallets = [],
  currentUserId,
  currentUserName,
}: SharedExpensesClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [settleOpen, setSettleOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"expenses" | "simplified" | "pairwise" | "settlements">("expenses")

  const { currency, userNetBalance, userTotalOwedToOthers, userTotalOwedFromOthers, totalSharedAmount, activeExpenseCount } = viewModel

  // Settle Up Dialog Pre-fills
  const [settleParams, setSettleParams] = useState<{
    payerId: string
    payerType: ParticipantType
    receiverId: string
    receiverType: ParticipantType
    amountCents: number
  }>({
    payerId: currentUserId,
    payerType: "user",
    receiverId: contacts[0]?.id || "",
    receiverType: "contact",
    amountCents: 0,
  })

  const handleTriggerSettleUp = (
    payerId: string,
    payerType: ParticipantType,
    receiverId: string,
    receiverType: ParticipantType,
    amountCents: number
  ) => {
    setSettleParams({
      payerId,
      payerType,
      receiverId,
      receiverType,
      amountCents,
    })
    setSettleOpen(true)
  }

  // Participants list for Settle Up dialog dropdown
  const settleParticipants = viewModel.participants.map((p) => ({
    id: p.id,
    type: p.type,
    name: p.id === currentUserId ? `You (${currentUserName || "User"})` : p.name,
  }))

  // Filtered expenses based on search query
  const filteredExpenses = viewModel.recentExpenses.filter((e) => {
    return (
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase())) ||
      e.participants.some((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    )
  })

  // Metric Cards
  const metricCards = [
    {
      label: "Your Net Position",
      value: `${userNetBalance >= 0 ? "+" : "-"}${formatCurrency(Math.abs(userNetBalance), currency)}`,
      subtext: userNetBalance > 0 ? "You are owed money" : userNetBalance < 0 ? "You owe money" : "All settled up",
      icon: Scale,
      color: userNetBalance >= 0 ? "#10b981" : "#ef4444",
    },
    {
      label: "Total Shared Volume",
      value: formatCurrency(totalSharedAmount, currency),
      subtext: "Combined shared volume",
      icon: Receipt,
      color: "#6366f1",
    },
    {
      label: "You Owe",
      value: formatCurrency(userTotalOwedToOthers, currency),
      subtext: "Owed to partners",
      icon: ArrowDownLeft,
      color: "#ef4444",
    },
    {
      label: "You Are Owed",
      value: formatCurrency(userTotalOwedFromOthers, currency),
      subtext: "Reimbursements expected",
      icon: ArrowUpRight,
      color: "#10b981",
    },
    {
      label: "Active Expenses",
      value: activeExpenseCount.toString(),
      subtext: "Unsettled transactions",
      icon: Sparkles,
      color: "#3b82f6",
    },
  ]

  return (
    <div className="flex flex-col gap-7 w-full">
      {/* ── Page Header matching reference pages ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <Users2 className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Shared Expenses</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Split bills, simplify debt settlements, and track balances across group spaces.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          <Button
            variant="outline"
            onClick={() => setSettleOpen(true)}
            className="w-full sm:w-auto rounded-xl font-bold gap-2 border-border/50 bg-card"
          >
            <HandCoins className="size-4 text-emerald-500" />
            Settle Up
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="w-full sm:w-auto rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="size-4" />
            Add Shared Expense
          </Button>
        </div>
      </div>

      {/* ── Dashboard Metric Cards Grid matching reference (3 on first row, 2 on second row) ── */}
      <div className="flex flex-wrap gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <Card
              key={idx}
              className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex-1 min-w-50"
              style={{ minWidth: "clamp(200px, calc((1064px - 100%) * 9999), calc(33.33% - 1rem))" }}
            >
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{ background: `radial-gradient(120% 100% at 0% 0%, ${card.color}, transparent 60%)` }}
              />
              <CardContent className="relative p-4 flex items-center gap-3">
                <div
                  className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: `${card.color}18`, color: card.color }}
                >
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 truncate">
                    {card.label}
                  </p>
                  <p className="text-xl font-black tabular-nums leading-tight truncate">
                    {card.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Control & Filter Bar matching reference ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "expenses"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Expenses ({viewModel.recentExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab("simplified")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === "simplified" || activeTab === "pairwise"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Group Balances ({viewModel.simplifiedTransfers.length})
          </button>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <InputGroup className="w-full sm:w-60">
            <InputGroupInput
              placeholder="Search by title or participant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </InputGroup>
        </div>
      </div>

      {/* ── Main View Area matching reference empty states & lists ── */}
      {viewModel.recentExpenses.length === 0 && activeTab === "expenses" ? (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <Users2 className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No shared expenses yet</EmptyTitle>
              <EmptyDescription>
                Split bills, travel expenses, or group dining with your contacts and space members.
              </EmptyDescription>
            </EmptyHeader>
            <div className="mt-4">
              <Button onClick={() => setCreateOpen(true)} className="rounded-xl font-bold gap-2">
                <Plus className="size-4" />
                Add your first shared expense
              </Button>
            </div>
          </Empty>
        </Card>
      ) : activeTab === "expenses" ? (
        <ExpensesList expenses={filteredExpenses} currentUserId={currentUserId} />
      ) : (
        <BalancesOverviewCard
          viewModel={viewModel}
          currentUserId={currentUserId}
          onSettleUp={handleTriggerSettleUp}
          mode={activeTab === "pairwise" ? "pairwise" : "simplified"}
        />
      )}

      {/* ── Dialog Modals matching reference sizes and styles ── */}
      <CreateExpenseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        contacts={contacts}
        wallets={wallets}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />

      <SettleUpDialog
        open={settleOpen}
        onOpenChange={setSettleOpen}
        participants={settleParticipants}
        defaultPayerId={settleParams.payerId}
        defaultPayerType={settleParams.payerType}
        defaultReceiverId={settleParams.receiverId}
        defaultReceiverType={settleParams.receiverType}
        defaultAmountCents={settleParams.amountCents}
        currency={viewModel.currency}
        wallets={wallets}
      />
    </div>
  )
}
