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
import { WatchlistView } from "./watchlist-view"
import { SyncPricesButton } from "./sync-prices-button"
import {
  BenchmarkComparisonCard,
  BenchmarkSummaryCards,
  type Timeframe,
} from "./overview/benchmark-comparison-card"
import { TaxScheduleView, TaxSummaryCards } from "./tax-schedule-view"
import { DividendForecastView, DividendSummaryCards } from "./dividend-forecast-view"
import type { BenchmarkSymbol, CostBasisMethod } from "@/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
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
  Bookmark,
  Scale,
  Compass,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Watchlist, WatchlistItem } from "@/types"

interface InvestmentsViewProps {
  accounts: Wallet[]
  holdings: InvestmentHolding[]
  transactions: InvestmentTransaction[]
  portfolioData: PortfolioViewModel
  accountData: AccountViewModel[]
  currency: string
  watchlists?: Array<Watchlist & { items: WatchlistItem[] }>
}

export function InvestmentsView({
  accounts,
  holdings,
  transactions,
  portfolioData,
  accountData,
  currency,
  watchlists = [],
}: InvestmentsViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "benchmarks" | "tax" | "dividends" | "accounts" | "holdings" | "watchlists"
  >("overview")
  const [search, setSearch] = useState("")
  const [addWalletOpen, setAddWalletOpen] = useState(false)
  const [addTxOpen, setAddTxOpen] = useState(false)
  const [taxMethod, setTaxMethod] = useState<CostBasisMethod>("fifo")
  const [benchmarkId, setBenchmarkId] = useState<BenchmarkSymbol>("^GSPC")
  const [benchmarkTimeframe, setBenchmarkTimeframe] = useState<Timeframe>("1Y")

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
          <SyncPricesButton />

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

      {/* ── Contextual Top MetricCards (Always above Tabs across all tabs) ── */}
      {(activeTab === "overview" ||
        activeTab === "accounts" ||
        activeTab === "holdings" ||
        activeTab === "watchlists") && (
        <PortfolioSummary data={portfolioData} currency={currency} />
      )}
      {activeTab === "benchmarks" && (
        <BenchmarkSummaryCards
          holdings={holdings}
          transactions={transactions}
          benchmarkId={benchmarkId}
          timeframe={benchmarkTimeframe}
        />
      )}
      {activeTab === "tax" && (
        <TaxSummaryCards
          transactions={transactions}
          currency={currency}
          method={taxMethod}
          setMethod={setTaxMethod}
        />
      )}
      {activeTab === "dividends" && (
        <DividendSummaryCards
          holdings={holdings}
          transactions={transactions}
          currency={currency}
        />
      )}

      {/* ── Tab Selector & Search (Matching Insights page layout) ── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap gap-3 items-start sm:items-center justify-between w-full min-w-0">
        {/* Scrollable Tab Bar */}
        <div className="w-full sm:w-auto min-w-0 rounded-2xl bg-muted/80 p-1 border border-border/40 shadow-2xs">
          <div className="overflow-x-auto scrollbar-hide flex items-center gap-1 min-w-0">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                activeTab === "overview"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("benchmarks")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                activeTab === "benchmarks"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Benchmarks
            </button>
            <button
              onClick={() => setActiveTab("tax")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                activeTab === "tax"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tax &amp; Capital Gains
            </button>
            <button
              onClick={() => setActiveTab("dividends")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                activeTab === "dividends"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Dividend Forecast
            </button>
            <button
              onClick={() => setActiveTab("accounts")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                activeTab === "accounts"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Accounts ({accounts.length})
            </button>
            <button
              onClick={() => setActiveTab("holdings")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                activeTab === "holdings"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Holdings ({holdings.length})
            </button>
            <button
              onClick={() => setActiveTab("watchlists")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                activeTab === "watchlists"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Watchlists ({watchlists.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {(activeTab === "accounts" || activeTab === "holdings") && (
          <div className="w-full sm:w-72 shrink-0">
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
      {!hasData && activeTab !== "watchlists" ? (
        <Card className="rounded-2xl border border-dashed border-border/50 p-8">
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
      ) : activeTab === "watchlists" ? (
        <WatchlistView watchlists={watchlists} />
      ) : activeTab === "overview" ? (
        /* Bento Grid */
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
          <div className="md:col-span-2 lg:col-span-1">
            <RecentTransactionsCard transactions={transactions} currency={currency} />
          </div>
        </div>
      ) : activeTab === "benchmarks" ? (
        <div className="space-y-4">
          <BenchmarkComparisonCard
            holdings={holdings}
            transactions={transactions}
            benchmarkId={benchmarkId}
            onBenchmarkChange={setBenchmarkId}
            timeframe={benchmarkTimeframe}
            onTimeframeChange={setBenchmarkTimeframe}
          />
        </div>
      ) : activeTab === "tax" ? (
        <div className="space-y-4">
          <TaxScheduleView
            transactions={transactions}
            holdings={holdings}
            currency={currency}
            method={taxMethod}
            onMethodChange={setTaxMethod}
          />
        </div>
      ) : activeTab === "dividends" ? (
        <div className="space-y-4">
          <DividendForecastView holdings={holdings} transactions={transactions} currency={currency} />
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
