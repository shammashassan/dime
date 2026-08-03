"use client"

import { useState } from "react"
import { Wallet, InvestmentHolding, InvestmentTransaction } from "@/types"
import { PortfolioViewModel, AccountViewModel } from "@/lib/calculations/investments"
import { PortfolioSummary } from "./portfolio-summary"
import { AccountList } from "./account-list"
import { AllocationChart } from "./allocation-chart"
import { HoldingsList } from "./holdings-list"
import { TransactionDialog } from "./transaction-dialog"
import { WalletForm } from "@/components/wallets/wallet-form"
import { QuickActionsCard } from "./overview/quick-actions-card"
import { TopHoldingsCard } from "./overview/top-holdings-card"
import { TopAccountsCard } from "./overview/top-accounts-card"
import { RecentTransactionsCard } from "./overview/recent-transactions-card"
import { InvestmentPerformanceCard } from "./overview/investment-performance-card"
import { TopPerformersCard } from "./overview/top-performers-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Plus,
  Search,
  PieChart,
  Briefcase,
  TrendingUp,
  Coins,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface InvestmentsViewProps {
  accounts: Wallet[]
  holdings: InvestmentHolding[]
  transactions: InvestmentTransaction[]
  portfolioData: PortfolioViewModel
  accountData: AccountViewModel[]
  currency: string
}

export function InvestmentsView({
  accounts,
  holdings,
  transactions,
  portfolioData,
  accountData,
  currency,
}: InvestmentsViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "accounts" | "holdings">("overview")
  const [search, setSearch] = useState("")
  const [addWalletOpen, setAddWalletOpen] = useState(false)
  const [addTxOpen, setAddTxOpen] = useState(false)

  const filteredHoldings = holdings.filter(
    (h) =>
      h.symbol.toLowerCase().includes(search.toLowerCase()) ||
      h.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredAccounts = accountData.filter((a) =>
    a.accountName.toLowerCase().includes(search.toLowerCase())
  )

  const hasData = accounts.length > 0 || holdings.length > 0

  return (
    <div className="space-y-6">
      {/* ── Header Row ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <TrendingUp className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Investments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Portfolio growth, asset class allocations, brokerage accounts, and investment transactions.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-start md:justify-end gap-2.5 flex-wrap w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setAddWalletOpen(true)}
            className="rounded-xl font-bold gap-2 shadow-xs border-border/60 flex-1 sm:flex-initial"
          >
            <Plus className="size-4" />
            Add Account
          </Button>

          <Button
            onClick={() => setAddTxOpen(true)}
            className="rounded-xl font-bold gap-2 shadow-sm flex-1 sm:flex-initial"
          >
            <Plus className="size-4" />
            Record Transaction
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Row ── */}
      <PortfolioSummary data={portfolioData} currency={currency} />

      {/* ── Tab Selector & Search ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
        {/* Desktop Tabs */}
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "overview"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "accounts"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Brokerage Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab("holdings")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "holdings"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Holdings &amp; Assets ({holdings.length})
          </button>
        </div>

        {/* Mobile Select */}
        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <SelectTrigger className="w-full border-border/40 bg-card h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="accounts">Brokerage Accounts ({accounts.length})</SelectItem>
              <SelectItem value="holdings">Holdings &amp; Assets ({holdings.length})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        {activeTab !== "overview" && (
          <div className="w-full sm:w-72">
            <InputGroup className="rounded-xl border-border/40 bg-card">
              <Search className="size-4 text-muted-foreground ml-3" />
              <InputGroupInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symbol or account..."
                className="text-xs"
              />
            </InputGroup>
          </div>
        )}
      </div>

      {/* ── Tab Contents ── */}
      {!hasData ? (
        <Card className="rounded-2xl border border-dashed border-border/50 bg-card p-8">
          <Empty className="py-12">
            <div className="size-16 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-4 border border-border/40">
              <Briefcase className="size-8 text-muted-foreground/70" />
            </div>
            <EmptyHeader>
              <EmptyTitle>No investments or accounts yet</EmptyTitle>
              <EmptyDescription>
                Track stocks, ETFs, mutual funds, crypto, and cash positions by creating an account or logging your first transaction.
              </EmptyDescription>
            </EmptyHeader>
            <div className="flex justify-center gap-3 mt-6">
              <Button onClick={() => setAddWalletOpen(true)} className="rounded-xl font-bold gap-2">
                <Plus className="size-4" />
                Add Brokerage Account
              </Button>
            </div>
          </Empty>
        </Card>
      ) : activeTab === "overview" ? (
        /* Bento Grid (with new Asymmetric 2-Card Middle Row) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {/* Top Row */}
          <div className="lg:col-span-2">
            <AllocationChart holdings={holdings} currency={currency} />
          </div>
          <div className="lg:col-span-1">
            <QuickActionsCard accounts={accounts} holdings={holdings} />
          </div>

          {/* Middle Row (Asymmetric 2/3 + 1/3) */}
          <div className="lg:col-span-2">
            <InvestmentPerformanceCard holdings={holdings} transactions={transactions} currency={currency} />
          </div>
          <div className="lg:col-span-1">
            <TopPerformersCard holdings={holdings} currency={currency} />
          </div>

          {/* Bottom Row */}
          <div className="lg:col-span-1">
            <TopHoldingsCard holdings={holdings} currency={currency} />
          </div>
          <div className="lg:col-span-1">
            <TopAccountsCard accounts={accountData} currency={currency} />
          </div>
          <div className="lg:col-span-1">
            <RecentTransactionsCard transactions={transactions} currency={currency} />
          </div>
        </div>
      ) : activeTab === "accounts" ? (
        <div className="space-y-4">
          <AccountList accounts={filteredAccounts} currency={currency} />
        </div>
      ) : (
        <div className="space-y-4">
          <HoldingsList holdings={filteredHoldings} currency={currency} />
        </div>
      )}

      {/* ── Dialogs ── */}
      <Dialog open={addWalletOpen} onOpenChange={setAddWalletOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Add Brokerage Account</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <WalletForm
              initialWallet={{ type: "investment" } as any}
              onSuccess={() => setAddWalletOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <TransactionDialog
        accounts={accounts}
        open={addTxOpen}
        onOpenChange={setAddTxOpen}
      />
    </div>
  )
}
