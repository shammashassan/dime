# Investment Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a transactional investment system supporting Brokerage Accounts (Wallets of type `"investment"`), Holdings, Trade Ledgers, Dividends, Watchlists, and Net Worth integration.

**Architecture:** We use the existing `Wallet` collection (for Brokerage accounts) and introduce separate collections for `investment_holdings`, `investment_transactions`, `investment_prices`, `watchlists`, and `watchlist_items`. Calculations are kept strictly in a service layer, presenting data through a custom ViewModel. All writes are transactional.

**Tech Stack:** Next.js (App Router), TypeScript, MongoDB, shadcn/ui, Tailwind CSS v4, Zod, date-fns.

---

## File Structure

We will create and modify the following files:

### Types and Database Core
* **Modify:** `types/index.ts` - Adds type definitions for holdings, investment transactions, watchlists, etc.
* **Modify:** `lib/db/collections.ts` - Registers new MongoDB collections.
* **Modify:** `lib/db/indexes.ts` - Verifies and creates indexes for investments and watchlists.

### Services Layer (`lib/investments/`)
* **New:** `lib/validations/investment.schema.ts` - Zod schema for trade validations.
* **New:** `lib/validations/watchlist.schema.ts` - Zod schema for watchlists.
* **New:** `lib/investments/prices.ts` - Price service abstraction.
* **New:** `lib/investments/holdings.ts` - Recalculates holding aggregation state.
* **New:** `lib/investments/transactions.ts` - Action handlers (Buy, Sell, Dividends).
* **New:** `lib/investments/calculations.ts` - Backtracking cash/quantities and portfolio valuation.
* **New:** `lib/investments/portfolio-viewmodel.ts` - Converts raw numbers to UI-ready ViewModel.

### Calculations Integration
* **Modify:** `lib/calculations/net-worth.ts` - Incorporates investments into Net Worth breakdown.
* **Modify:** `lib/calculations/net-worth-viewmodel.ts` - Adds investments to Net Worth timeline and insights.

### Server Actions
* **New:** `lib/actions/investments.ts` - Thin server actions for transaction logging and price updates.
* **New:** `lib/actions/watchlists.ts` - Server actions for watchlist CRUD.

### UI Routes & Components
* **Modify:** `components/layout/dashboard-sidebar.tsx` - Adds Investments to navigation menu.
* **New Layout & Subpages:**
  * `app/(dashboard)/investments/layout.tsx` - Shares layout and brokerage switching context.
  * `app/(dashboard)/investments/page.tsx` - Main Portfolio Dashboard (Summary cards, Accounts, Holdings, Allocation, Performance).
  * `app/(dashboard)/investments/accounts/[walletId]/page.tsx` - Individual Account details.
  * `app/(dashboard)/investments/holdings/[id]/page.tsx` - Holding details with timeline, performance, transactions.
  * `app/(dashboard)/investments/transactions/page.tsx` - Investment ledger table.
  * `app/(dashboard)/investments/watchlists/page.tsx` - Watchlist management page.
* **New Components:**
  * `components/investments/trade-dialog.tsx` - Dialog form to Buy, Sell, or record Dividends.
  * `components/investments/price-dialog.tsx` - Dialog to update holding market prices.

---

### Task 1: Type Definitions and DB Seeding

**Files:**
- Modify: `types/index.ts`
- Modify: `lib/db/collections.ts`
- Modify: `lib/db/indexes.ts`

- [ ] **Step 1: Add types in `types/index.ts`**
  Add the following exports to the end of `types/index.ts`:
  ```typescript
  export interface InvestmentHolding {
    _id: ObjectId
    userId: string
    organizationId: string | null
    walletId: string
    symbol: string
    name: string
    assetType: "stock" | "etf" | "crypto" | "mutual_fund" | "bond" | "commodity" | "other"
    quantity: number
    averageCostBasis: number
    totalCostBasis: number
    currentPrice: number
    status: "active" | "closed"
    realizedGain: number
    currency: string
    exchange?: string
    isin?: string
    cusip?: string
    metadata?: Record<string, unknown>
    createdAt: Date
    updatedAt: Date
  }

  export type InvestmentTransactionType =
    | "buy"
    | "sell"
    | "cash_dividend"
    | "reinvested_dividend"
    | "stock_split"
    | "reverse_split"
    | "interest"
    | "fee"
    | "transfer_in"
    | "transfer_out"
    | "adjustment"

  export interface InvestmentTransaction {
    _id: ObjectId
    userId: string
    organizationId: string | null
    walletId: string
    holdingId: string
    symbol: string
    assetType: "stock" | "etf" | "crypto" | "mutual_fund" | "bond" | "commodity" | "other"
    type: InvestmentTransactionType
    quantity: number
    price: number
    grossAmount: number
    fees: number
    cashImpact: number
    realizedGain?: number
    dividendAmount?: number
    date: Date
    notes?: string
    metadata?: Record<string, unknown>
    createdAt: Date
  }

  export interface InvestmentPrice {
    _id: ObjectId
    holdingId: string
    price: number
    date: Date
    source: "manual" | "market"
    createdAt: Date
  }

  export interface Watchlist {
    _id: ObjectId
    userId: string
    organizationId: string | null
    name: string
    description?: string
    color?: string
    icon?: string
    sortOrder: number
    status: "active" | "archived"
    archivedAt?: Date
    metadata?: Record<string, unknown>
    createdAt: Date
    updatedAt: Date
  }

  export interface WatchlistItem {
    _id: ObjectId
    watchlistId: string
    symbol: string
    name: string
    assetType: "stock" | "etf" | "crypto" | "mutual_fund" | "bond" | "commodity" | "other"
    sortOrder: number
    exchange?: string
    isin?: string
    cusip?: string
    notes?: string
    targetPrice?: number
    targetDirection?: "above" | "below"
    alertEnabled?: boolean
    lastAlertTriggeredAt?: Date
    metadata?: Record<string, unknown>
    createdAt: Date
    updatedAt: Date
  }
  ```

- [ ] **Step 2: Add collection exports in `lib/db/collections.ts`**
  Add these lines to `lib/db/collections.ts`:
  ```typescript
  import { InvestmentHolding, InvestmentTransaction, InvestmentPrice, Watchlist, WatchlistItem } from "@/types"
  // ...
  export const investmentHoldingsCollection = db.collection<InvestmentHolding>("investment_holdings")
  export const investmentTransactionsCollection = db.collection<InvestmentTransaction>("investment_transactions")
  export const investmentPricesCollection = db.collection<InvestmentPrice>("investment_prices")
  export const watchlistsCollection = db.collection<Watchlist>("watchlists")
  export const watchlistItemsCollection = db.collection<WatchlistItem>("watchlist_items")
  ```

- [ ] **Step 3: Add index creation in `lib/db/indexes.ts`**
  Inside `initDatabase` in `lib/db/indexes.ts`, add index creation:
  ```typescript
  // Investment Indexes
  const investmentHoldings = db.collection("investment_holdings")
  await investmentHoldings.createIndex({ walletId: 1, symbol: 1 }, { unique: true })
  await investmentHoldings.createIndex({ userId: 1, walletId: 1 })
  await investmentHoldings.createIndex({ organizationId: 1 })

  const investmentTransactions = db.collection("investment_transactions")
  await investmentTransactions.createIndex({ holdingId: 1, date: -1 })
  await investmentTransactions.createIndex({ userId: 1, walletId: 1, date: -1 })
  await investmentTransactions.createIndex({ organizationId: 1, date: -1 })

  const investmentPrices = db.collection("investment_prices")
  await investmentPrices.createIndex({ holdingId: 1, date: -1 })

  // Watchlist Indexes
  const watchlists = db.collection("watchlists")
  await watchlists.createIndex({ userId: 1, sortOrder: 1 })
  await watchlists.createIndex({ organizationId: 1, name: 1 })

  const watchlistItems = db.collection("watchlist_items")
  await watchlistItems.createIndex({ watchlistId: 1, symbol: 1 }, { unique: true })
  await watchlistItems.createIndex({ symbol: 1 })
  await watchlistItems.createIndex({ assetType: 1 })
  ```

- [ ] **Step 4: Run database script to verify indexes**
  Run `npx tsx check_db.ts` or equivalent initialization script to check index application.
  Expected: Successful initialization log.

- [ ] **Step 5: Commit**
  ```bash
  git add types/index.ts lib/db/collections.ts lib/db/indexes.ts
  git commit -m "db: add schemas and indexes for investments and watchlists"
  ```

---

### Task 2: Service Layer & Business Logic

**Files:**
- Create: `lib/validations/investment.schema.ts`
- Create: `lib/investments/prices.ts`
- Create: `lib/investments/holdings.ts`
- Create: `lib/investments/transactions.ts`

- [ ] **Step 1: Create validation schemas in `lib/validations/investment.schema.ts`**
  Write Zod validator for trades:
  ```typescript
  import { z } from "zod"

  export const investmentTransactionSchema = z.object({
    walletId: z.string().min(1, "Brokerage account is required"),
    symbol: z.string().min(1, "Ticker is required").toUpperCase(),
    name: z.string().min(1, "Name is required"),
    assetType: z.enum(["stock", "etf", "crypto", "mutual_fund", "bond", "commodity", "other"]),
    type: z.enum([
      "buy", "sell", "cash_dividend", "reinvested_dividend",
      "stock_split", "reverse_split", "interest", "fee", "transfer_in", "transfer_out", "adjustment"
    ]),
    quantity: z.number().nonnegative().default(0),
    price: z.number().nonnegative().default(0),
    fees: z.number().nonnegative().default(0),
    dividendAmount: z.number().nonnegative().optional(),
    date: z.coerce.date(),
    notes: z.string().optional(),
    exchange: z.string().optional(),
    isin: z.string().optional(),
    cusip: z.string().optional(),
    metadata: z.record(z.unknown()).optional()
  })

  export type InvestmentTransactionInput = z.infer<typeof investmentTransactionSchema>
  ```

- [ ] **Step 2: Create Market Data Service Abstraction in `lib/investments/prices.ts`**
  ```typescript
  import { ObjectId } from "mongodb"
  import { getCollection } from "@/lib/db/collections"
  import { InvestmentPrice } from "@/types"

  export async function getLatestPrice(holdingId: string): Promise<number> {
    const coll = await getCollection<InvestmentPrice>("investment_prices")
    const priceRecord = await coll.findOne({ holdingId }, { sort: { date: -1 } })
    return priceRecord ? priceRecord.price : 0
  }

  export async function getHistoricalPrice(holdingId: string, date: Date): Promise<number> {
    const coll = await getCollection<InvestmentPrice>("investment_prices")
    const priceRecord = await coll.findOne(
      { holdingId, date: { $lte: date } },
      { sort: { date: -1 } }
    )
    return priceRecord ? priceRecord.price : 0
  }

  export async function getHistoricalPrices(
    holdingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ price: number; date: Date }[]> {
    const coll = await getCollection<InvestmentPrice>("investment_prices")
    return coll
      .find({ holdingId, date: { $gte: startDate, $lte: endDate } })
      .sort({ date: 1 })
      .toArray()
  }

  export async function recordPrice(holdingId: string, price: number, date: Date = new Date(), source: "manual" | "market" = "manual") {
    const coll = await getCollection<InvestmentPrice>("investment_prices")
    await coll.insertOne({
      _id: new ObjectId(),
      holdingId,
      price,
      date,
      source,
      createdAt: new Date()
    })
  }
  ```

- [ ] **Step 3: Create Holdings Aggregation Logic in `lib/investments/holdings.ts`**
  Centralize how holding details are recalculated from the transactions:
  ```typescript
  import { InvestmentHolding, InvestmentTransaction } from "@/types"
  import { getCollection } from "@/lib/db/collections"

  export function recalculateHoldingFromTransactions(
    holding: InvestmentHolding,
    txs: InvestmentTransaction[]
  ): InvestmentHolding {
    let quantity = 0
    let totalCostBasis = 0
    let realizedGain = 0

    // Sort transactions chronologically
    const sorted = [...txs].sort((a, b) => a.date.getTime() - b.date.getTime())

    for (const tx of sorted) {
      if (tx.type === "buy") {
        quantity += tx.quantity
        totalCostBasis += tx.grossAmount + tx.fees
      } else if (tx.type === "sell") {
        if (quantity <= 0) continue
        const avgCostBasis = totalCostBasis / quantity
        const soldCost = tx.quantity * avgCostBasis
        quantity -= tx.quantity
        totalCostBasis -= soldCost
        realizedGain += tx.cashImpact - soldCost
      } else if (tx.type === "reinvested_dividend" && tx.dividendAmount) {
        quantity += tx.quantity
        totalCostBasis += tx.dividendAmount
      } else if (tx.type === "cash_dividend" && tx.dividendAmount) {
        realizedGain += tx.dividendAmount
      }
    }

    return {
      ...holding,
      quantity,
      totalCostBasis,
      averageCostBasis: quantity > 0 ? Math.round(totalCostBasis / quantity) : 0,
      realizedGain,
      status: quantity > 0 ? "active" : "closed",
      updatedAt: new Date()
    }
  }
  ```

- [ ] **Step 4: Create Trade Execution Handlers in `lib/investments/transactions.ts`**
  Implement execution strategies inside a database transaction:
  ```typescript
  import { ObjectId } from "mongodb"
  import { db } from "@/lib/db/client"
  import { getCollection } from "@/lib/db/collections"
  import { Wallet, InvestmentHolding, InvestmentTransaction } from "@/types"
  import { FinancialScope } from "@/types/scope"
  import { getScopeFilter } from "@/lib/scope"
  import { recalculateHoldingFromTransactions } from "./holdings"
  import { recordPrice } from "./prices"

  export async function executeTradeTransaction(
    scope: FinancialScope,
    input: any
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const session = db.client.startSession()
    session.startTransaction()

    try {
      const walletsColl = await getCollection<Wallet>("wallets")
      const holdingsColl = await getCollection<InvestmentHolding>("investment_holdings")
      const transactionsColl = await getCollection<InvestmentTransaction>("investment_transactions")

      // 1. Verify Wallet
      const wallet = await walletsColl.findOne(
        { _id: new ObjectId(input.walletId), ...getScopeFilter(scope) },
        { session }
      )
      if (!wallet || wallet.type !== "investment") {
        throw new Error("Invalid or unauthorized brokerage account (wallet).")
      }

      // 2. Load or Create Holding
      let holding = await holdingsColl.findOne(
        { walletId: input.walletId, symbol: input.symbol },
        { session }
      )

      if (!holding) {
        holding = {
          _id: new ObjectId(),
          userId: scope.userId,
          organizationId: scope.organizationId,
          walletId: input.walletId,
          symbol: input.symbol,
          name: input.name,
          assetType: input.assetType,
          quantity: 0,
          averageCostBasis: 0,
          totalCostBasis: 0,
          currentPrice: input.price || 0,
          status: "active",
          realizedGain: 0,
          currency: wallet.currency,
          exchange: input.exchange,
          isin: input.isin,
          cusip: input.cusip,
          metadata: input.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        await holdingsColl.insertOne(holding, { session })
      }

      // 3. Compute Gross Amount and Cash Impact
      let grossAmount = 0
      let cashImpact = 0
      let realizedGain = 0

      if (input.type === "buy") {
        if (input.quantity <= 0 || input.price <= 0) throw new Error("Invalid quantity or price for buy.")
        grossAmount = input.quantity * input.price
        cashImpact = -(grossAmount + input.fees)
      } else if (input.type === "sell") {
        if (input.quantity <= 0 || input.price <= 0) throw new Error("Invalid quantity or price for sell.")
        if (holding.quantity < input.quantity) throw new Error("Insufficient shares to execute sell.")
        grossAmount = input.quantity * input.price
        cashImpact = grossAmount - input.fees
        const avgCost = holding.quantity > 0 ? holding.totalCostBasis / holding.quantity : 0
        realizedGain = cashImpact - (input.quantity * avgCost)
      } else if (input.type === "cash_dividend") {
        if (!input.dividendAmount || input.dividendAmount <= 0) throw new Error("Invalid dividend amount.")
        cashImpact = input.dividendAmount
      } else if (input.type === "reinvested_dividend") {
        if (!input.dividendAmount || input.dividendAmount <= 0) throw new Error("Invalid dividend amount.")
        if (input.quantity <= 0 || input.price <= 0) throw new Error("DRIP requires quantity and price.")
        grossAmount = input.quantity * input.price
        cashImpact = 0
      }

      // 4. Record the Transaction
      const transactionId = new ObjectId()
      const txDoc: InvestmentTransaction = {
        _id: transactionId,
        userId: scope.userId,
        organizationId: scope.organizationId,
        walletId: input.walletId,
        holdingId: holding._id.toString(),
        symbol: input.symbol,
        assetType: input.assetType,
        type: input.type,
        quantity: input.quantity,
        price: input.price,
        grossAmount,
        fees: input.fees,
        cashImpact,
        realizedGain: input.type === "sell" ? realizedGain : undefined,
        dividendAmount: input.dividendAmount,
        date: input.date,
        notes: input.notes,
        metadata: input.metadata,
        createdAt: new Date()
      }
      await transactionsColl.insertOne(txDoc, { session })

      // 5. Query all transactions to recalculate holding state
      const allTx = await transactionsColl
        .find({ holdingId: holding._id.toString() }, { session })
        .toArray()

      const recalculatedHolding = recalculateHoldingFromTransactions(holding, allTx)
      
      // Update holding current price if buy/sell/drip price was execution price
      if (input.price > 0 && (input.type === "buy" || input.type === "sell" || input.type === "reinvested_dividend")) {
        // Record price separately in historical price log
        await recordPrice(holding._id.toString(), input.price, input.date, "manual")
      }

      await holdingsColl.updateOne(
        { _id: holding._id },
        {
          $set: {
            quantity: recalculatedHolding.quantity,
            totalCostBasis: recalculatedHolding.totalCostBasis,
            averageCostBasis: recalculatedHolding.averageCostBasis,
            realizedGain: recalculatedHolding.realizedGain,
            status: recalculatedHolding.status,
            updatedAt: new Date()
          }
        },
        { session }
      )

      // 6. Update Wallet Balance
      await walletsColl.updateOne(
        { _id: wallet._id },
        {
          $inc: { balance: cashImpact, version: 1 },
          $set: { updatedAt: new Date(), updatedBy: scope.userId }
        },
        { session }
      )

      await session.commitTransaction()
      return { success: true, id: transactionId.toString() }
    } catch (e: any) {
      await session.abortTransaction()
      return { success: false, error: e.message || "Failed to execute transaction." }
    } finally {
      session.endSession()
    }
  }
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add lib/validations/investment.schema.ts lib/investments/prices.ts lib/investments/holdings.ts lib/investments/transactions.ts
  git commit -m "feat: add validation schema and core investment service layer with execution strategies"
  ```

---

### Task 3: Calculations Service & Historical Backtracking

**Files:**
- Create: `lib/investments/calculations.ts`
- Modify: `lib/calculations/net-worth.ts`

- [ ] **Step 1: Create portfolio math inside `lib/investments/calculations.ts`**
  ```typescript
  import { Wallet, InvestmentHolding, InvestmentTransaction } from "@/types"
  import { getHistoricalPrice } from "./prices"

  export function calculateHoldingValue(holding: InvestmentHolding): number {
    return holding.quantity * holding.currentPrice
  }

  export function calculateHoldingUnrealizedGain(holding: InvestmentHolding): number {
    return calculateHoldingValue(holding) - holding.totalCostBasis
  }

  export async function getPortfolioValue(
    wallet: Wallet,
    holdings: InvestmentHolding[]
  ): Promise<number> {
    const holdingsVal = holdings
      .filter((h) => h.walletId === wallet._id.toString() && h.status === "active")
      .reduce((sum, h) => sum + calculateHoldingValue(h), 0)
    return wallet.balance + holdingsVal
  }

  export function calculateWalletBalanceAt(
    wallet: Wallet,
    transactions: InvestmentTransaction[],
    date: Date
  ): number {
    let balance = wallet.balance
    const walletId = wallet._id.toString()

    for (const tx of transactions) {
      if (tx.walletId !== walletId || new Date(tx.date) <= date) continue
      balance -= tx.cashImpact
    }
    return balance
  }

  export function calculateHoldingQuantityAt(
    holding: InvestmentHolding,
    transactions: InvestmentTransaction[],
    date: Date
  ): number {
    let qty = holding.quantity
    const holdingId = holding._id.toString()

    for (const tx of transactions) {
      if (tx.holdingId !== holdingId || new Date(tx.date) <= date) continue
      if (tx.type === "buy" || tx.type === "reinvested_dividend") {
        qty -= tx.quantity
      } else if (tx.type === "sell") {
        qty += tx.quantity
      }
    }
    return Math.max(0, qty)
  }

  export async function getPortfolioValueAt(
    wallet: Wallet,
    holdings: InvestmentHolding[],
    transactions: InvestmentTransaction[],
    date: Date
  ): Promise<number> {
    const cash = calculateWalletBalanceAt(wallet, transactions, date)
    let holdingsValue = 0

    for (const h of holdings) {
      if (h.walletId !== wallet._id.toString()) continue
      const qty = calculateHoldingQuantityAt(h, transactions, date)
      if (qty <= 0) continue
      const price = await getHistoricalPrice(h._id.toString(), date)
      holdingsValue += qty * price
    }

    return cash + holdingsValue
  }
  ```

- [ ] **Step 2: Update Net Worth Calculations in `lib/calculations/net-worth.ts`**
  Modify `calculateCurrentNetWorth` to add holdings and investments:
  * Fetch `investment_holdings` for active investment wallets.
  * Integrate into assets under the `investments` category:
  ```typescript
  // In lib/calculations/net-worth.ts:
  // Add holdings parameter to calculateCurrentNetWorth signature
  // Under the loop: for (const w of wallets)
  // ...
  if (w.type === "investment") {
    const walletHoldings = holdings.filter(h => h.walletId === w._id.toString() && h.status === "active")
    const holdingsVal = walletHoldings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0)
    
    // Total value of brokerage = cash balance + holdings market value
    const walletTotal = w.balance + holdingsVal
    const converted = convert(walletTotal, w.currency)
    
    totalAssets += converted
    assetsBreakdown.investments += converted
    trackCurrency(walletTotal, w.currency, true)
  }
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add lib/investments/calculations.ts lib/calculations/net-worth.ts
  git commit -m "feat: add portfolio value calculations and update Net Worth calculation core"
  ```

---

### Task 4: ViewModels and Server Actions

**Files:**
- Create: `lib/investments/portfolio-viewmodel.ts`
- Create: `lib/actions/investments.ts`
- Create: `lib/actions/watchlists.ts`

- [ ] **Step 1: Create unified mapping layer in `lib/investments/portfolio-viewmodel.ts`**
  ```typescript
  import { Wallet, InvestmentHolding, InvestmentTransaction } from "@/types"
  import { calculateHoldingValue, calculateHoldingUnrealizedGain } from "./calculations"

  export interface PortfolioSummaryViewModel {
    totalValue: number          // cash + holdings
    unrealizedGain: number
    unrealizedReturnPct: number
    realizedGain: number
    availableCash: number
    holdingsCount: number
  }

  export function generatePortfolioViewModel(
    wallets: Wallet[],
    holdings: InvestmentHolding[],
    convert: (amount: number, from: string) => number
  ): PortfolioSummaryViewModel {
    let totalValue = 0
    let totalCostBasis = 0
    let realizedGain = 0
    let availableCash = 0
    let holdingsCount = 0

    for (const w of wallets) {
      if (w.type !== "investment" || w.isArchived) continue
      availableCash += convert(w.balance, w.currency)
      totalValue += convert(w.balance, w.currency)
    }

    for (const h of holdings) {
      if (h.status !== "active") continue
      const val = calculateHoldingValue(h)
      totalValue += convert(val, h.currency)
      totalCostBasis += convert(h.totalCostBasis, h.currency)
      realizedGain += convert(h.realizedGain, h.currency)
      holdingsCount++
    }

    const unrealizedGain = totalValue - availableCash - totalCostBasis
    const unrealizedReturnPct = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0

    return {
      totalValue,
      unrealizedGain,
      unrealizedReturnPct,
      realizedGain,
      availableCash,
      holdingsCount
    }
  }
  ```

- [ ] **Step 2: Create Thin Server Actions in `lib/actions/investments.ts`**
  ```typescript
  "use server"

  import { requireApprovedUser } from "@/lib/auth-guard"
  import { getFinancialScope } from "@/lib/scope"
  import { executeTradeTransaction } from "@/lib/investments/transactions"
  import { investmentTransactionSchema } from "@/lib/validations/investment.schema"
  import { recordPrice } from "@/lib/investments/prices"
  import { revalidatePath, updateTag } from "next/cache"

  export async function createInvestmentTransaction(input: any) {
    try {
      await requireApprovedUser()
      const scope = await getFinancialScope()
      const validated = investmentTransactionSchema.parse(input)

      const result = await executeTradeTransaction(scope, validated)
      if (result.success) {
        updateTag("wallets")
        updateTag("investment_holdings")
        updateTag("investment_transactions")
        revalidatePath("/investments")
        revalidatePath("/net-worth")
        revalidatePath("/", "layout")
      }
      return result
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to log trade." }
    }
  }

  export async function updateHoldingPrice(holdingId: string, price: number) {
    try {
      await requireApprovedUser()
      await recordPrice(holdingId, price, new Date(), "manual")
      
      updateTag("investment_holdings")
      updateTag("investment_prices")
      revalidatePath("/investments")
      revalidatePath(`/investments/holdings/${holdingId}`)
      revalidatePath("/net-worth")
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to update price." }
    }
  }
  ```

- [ ] **Step 3: Create Server Actions in `lib/actions/watchlists.ts`**
  Implement watchlist CRUD (with soft-delete support):
  ```typescript
  "use server"

  import { requireApprovedUser } from "@/lib/auth-guard"
  import { getFinancialScope, getScopeFilter } from "@/lib/scope"
  import { getCollection } from "@/lib/db/collections"
  import { Watchlist, WatchlistItem } from "@/types"
  import { ObjectId } from "mongodb"
  import { revalidatePath, updateTag } from "next/cache"

  export async function createWatchlist(name: string, description?: string) {
    try {
      await requireApprovedUser()
      const scope = await getFinancialScope()
      const coll = await getCollection<Watchlist>("watchlists")

      const count = await coll.countDocuments(getScopeFilter(scope))
      const watchlist: Watchlist = {
        _id: new ObjectId(),
        userId: scope.userId,
        organizationId: scope.organizationId,
        name,
        description,
        sortOrder: count,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await coll.insertOne(watchlist)
      updateTag("watchlists")
      revalidatePath("/investments/watchlists")
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to create watchlist." }
    }
  }

  export async function archiveWatchlist(id: string) {
    try {
      await requireApprovedUser()
      const scope = await getFinancialScope()
      const coll = await getCollection<Watchlist>("watchlists")

      await coll.updateOne(
        { _id: new ObjectId(id), ...getScopeFilter(scope) },
        { $set: { status: "archived", archivedAt: new Date(), updatedAt: new Date() } }
      )
      updateTag("watchlists")
      revalidatePath("/investments/watchlists")
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to archive." }
    }
  }
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add lib/investments/portfolio-viewmodel.ts lib/actions/investments.ts lib/actions/watchlists.ts
  git commit -m "feat: add presentation viewmodels and thin server actions for trades and watchlists"
  ```

---

### Task 5: UI Integration and Pages Routing

**Files:**
- Modify: `components/layout/dashboard-sidebar.tsx`
- Create: `app/(dashboard)/investments/page.tsx`
- Create: `app/(dashboard)/investments/watchlists/page.tsx`
- Create: `app/(dashboard)/investments/transactions/page.tsx`
- Create: `components/investments/trade-dialog.tsx`

- [ ] **Step 1: Add investments navigation item to `components/layout/dashboard-sidebar.tsx`**
  Insert the `LineChart` or `TrendingUp` icon link pointing to `/investments` in `NAV_ITEMS`:
  ```typescript
  // In components/layout/dashboard-sidebar.tsx
  const NAV_ITEMS = [
    { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { title: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { title: "Wallets", href: "/wallets", icon: Wallet },
    { title: "Investments", href: "/investments", icon: BarChart3 }, // ADD THIS LINE
    { title: "Net Worth", href: "/net-worth", icon: TrendingUp },
    // ...
  ]
  ```

- [ ] **Step 2: Create Main Dashboard View in `app/(dashboard)/investments/page.tsx`**
  Present the portfolio metrics using the `generatePortfolioViewModel` and shadcn cards. Includes:
  * Quick Actions (Buy, Sell, Dividends, Prices)
  * Tabs: Accounts, Holdings, Allocation (Pie Chart), Performance (Area Chart)
  * Embed standard components like `<DataTable>` for listing active holdings.

- [ ] **Step 3: Create Transactions Log Page in `app/(dashboard)/investments/transactions/page.tsx`**
  Renders a table of all `InvestmentTransaction` logs with clean filters by symbol and type.

- [ ] **Step 4: Create Watchlists Manager Page in `app/(dashboard)/investments/watchlists/page.tsx`**
  Renders custom watchlists, offering tools to create lists, add tickers, or soft-delete.

- [ ] **Step 5: Create dialog builder in `components/investments/trade-dialog.tsx`**
  Write a clean React form using `<Dialog>` and `Field` from shadcn to record trades.

- [ ] **Step 6: Commit**
  ```bash
  git add components/layout/dashboard-sidebar.tsx app/(dashboard)/investments/page.tsx app/(dashboard)/investments/transactions/page.tsx app/(dashboard)/investments/watchlists/page.tsx components/investments/trade-dialog.tsx
  git commit -m "ui: implement portfolio dashboard tabs, transaction ledger, and watchlists page"
  ```

---

## Verification Plan

### Automated Tests
* We will verify the database operations by executing the check_db initialization script:
  * `npx tsx check_db.ts`
* We can run the Next.js production build compiler to ensure TypeScript strict typechecking passes:
  * `npm run build`

### Manual Verification
* Deploy a test brokerage wallet and execute mock trade transactions (Buy, Sell, Reinvested Dividend) using the UI Dialog sheets.
* Verify cash balance of the wallet is adjusted accordingly.
* Verify holdings list quantity and cost basis update atomically.
* Validate that Net Worth dashboard aggregates holdings value correctly.
