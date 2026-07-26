# Investment Portfolio Design Specification

**Date:** 2026-07-20  
**Status:** Approved  
**Domain:** Investments & Wealth Management  

---

## 1. Executive Summary

This document specifies the technical design and architecture for Phase 1 of the **Investment Portfolio** subsystem in Dime. 

The goal is to transition Dime from tracking investments as static manual assets into a true transactional investment system. It supports multiple brokerage accounts, detailed holdings tracking, a rich trade/dividend ledger, cost basis calculation, and multiple custom watchlists. It integrates directly into the existing Net Worth, Reports, and Space-sharing architectures without introducing a parallel account system.

---

## 2. Core Architecture & Guiding Principles

1. **Extend, Don't Duplicate:** We reuse the existing `Wallet` model to represent **Brokerage Accounts** by using `type: "investment"`. This inherits cash balance, currency, transfers, opening balances, Shared Spaces, and access control.
2. **Ledger as Source of Truth:** `InvestmentTransaction` is the immutable ledger containing all trades, dividends, and corporate actions.
3. **Holdings as Computed Positions:** `InvestmentHolding` represents the current aggregated state of a security in a wallet (quantity, average cost, market price). Quantity and cost basis are never mutated directly; they are calculated and derived from transaction history.
4. **No Persisted Computed Fields:** Derived values like `currentValue` and `unrealizedGain` are calculated dynamically at the query layer.
5. **Decoupled Calculations:** The Net Worth system is decoupled from investment internals; it queries the portfolio valuation service for specific dates rather than implementing investment-specific calculations.
6. **Transactional Operations:** All updates to the ledger, holdings, and wallet cash balances are performed atomically in MongoDB transactions.

---

## 3. Database Schema & Collections

We introduce three new collections in the investments domain and two collections in the watchlists domain.

### 3.1 `investment_holdings` (Collection: `investment_holdings`)
Represents the current aggregated security position.

```typescript
export interface InvestmentHolding {
  _id: ObjectId
  userId: string
  organizationId: string | null // For Shared Spaces
  walletId: string              // Link to Wallet (type: "investment")
  symbol: string                // e.g. "AAPL", "BTC", "VTI"
  name: string                  // e.g. "Apple Inc."
  assetType: "stock" | "etf" | "crypto" | "mutual_fund" | "bond" | "commodity" | "other"
  quantity: number              // Derived unit quantity
  averageCostBasis: number      // Average purchase price per unit (in cents/paise)
  totalCostBasis: number        // Derived total amount spent (quantity * averageCostBasis)
  currentPrice: number          // Latest market price (in cents/paise)
  status: "active" | "closed"   // Closed preserves historical trade links and realized gains
  realizedGain: number          // Sum of realized gains/losses from sales (in cents/paise)
  currency: string              // Holding currency
  exchange?: string             // Exchange identifier (NYSE, NASDAQ, etc.)
  isin?: string                 // International Securities Identification Number
  cusip?: string                // CUSIP identifier
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}
```

* **Indexes:**
  * `{ walletId: 1, symbol: 1 }` (Unique compound index: one holding per ticker per wallet)
  * `{ userId: 1, walletId: 1 }`
  * `{ organizationId: 1 }`

### 3.2 `investment_transactions` (Collection: `investment_transactions`)
The immutable transactional ledger.

```typescript
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
  walletId: string              // Link to Wallet
  holdingId: string             // Link to InvestmentHolding (Required)
  symbol: string
  assetType: "stock" | "etf" | "crypto" | "mutual_fund" | "bond" | "commodity" | "other"
  type: InvestmentTransactionType
  quantity: number              // Trade size (units)
  price: number                 // Unit execution price (in cents/paise)
  grossAmount: number           // quantity * price
  fees: number                  // Trade fees
  cashImpact: number            // Signed cash impact (Buy: -(gross+fees), Sell: gross-fees, Dividend: divAmount, DRIP: 0)
  realizedGain?: number         // Calculated realized gain/loss for sells (in cents/paise)
  dividendAmount?: number       // Dividend distribution amount (in cents/paise)
  date: Date                    // Trade execution date
  notes?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}
```

* **Indexes:**
  * `{ holdingId: 1, date: -1 }` (Critical for trade histories per holding)
  * `{ userId: 1, walletId: 1, date: -1 }`
  * `{ organizationId: 1, date: -1 }`

### 3.3 `investment_prices` (Collection: `investment_prices`)
Tracks historical prices for portfolio valuation and charting.

```typescript
export interface InvestmentPrice {
  _id: ObjectId
  holdingId: string
  price: number                 // Unit price (in cents/paise)
  date: Date                    // Date of price point
  source: "manual" | "market"   // Price input source
  createdAt: Date
}
```

* **Indexes:**
  * `{ holdingId: 1, date: -1 }`

### 3.4 `watchlists` & `watchlist_items` (Collections: `watchlists`, `watchlist_items`)
Relational collections supporting multiple custom watchlists.

```typescript
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
  targetPrice?: number          // Target price alert (in cents/paise)
  targetDirection?: "above" | "below"
  alertEnabled?: boolean
  lastAlertTriggeredAt?: Date
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}
```

* **Indexes:**
  * `{ watchlistId: 1, symbol: 1 }` (Unique)
  * `{ organizationId: 1, name: 1 }`
  * `{ symbol: 1 }`
  * `{ assetType: 1 }`

---

## 4. Business Logic Layer (`lib/investments/`)

To keep Server Actions thin and maintain reusable calculations, the business logic is split into dedicated service files:

```
lib/investments/
  ├── transactions.ts  # Handles transaction execution & validation
  ├── holdings.ts      # Recalculates aggregation states
  ├── prices.ts        # Manual and market price entry
  └── calculations.ts  # Portfolio totals, performance metrics & backtracking
```

### 4.1 Transaction Handlers (Strategy Pattern)
Each trade type is processed by its own strategy/handler to handle validations and state mutations:

* **`buyHandler` Validation & Logic:**
  * Validate: `quantity > 0` and `price > 0`.
  * Cash impact: `-(grossAmount + fees)`.
  * Recalculate holding:
    * `newQuantity = oldQuantity + quantity`
    * `newTotalCostBasis = oldTotalCostBasis + grossAmount + fees`
    * `newAverageCostBasis = newTotalCostBasis / newQuantity`
* **`sellHandler` Validation & Logic:**
  * Validate: `quantity > 0`, `price > 0`, and `holding.quantity >= quantity`.
  * Cash impact: `grossAmount - fees`.
  * Recalculate holding:
    * `newQuantity = oldQuantity - quantity`
    * `soldCostBasis = quantity * oldAverageCostBasis`
    * `newTotalCostBasis = oldTotalCostBasis - soldCostBasis`
    * `averageCostBasis` remains unchanged.
    * `realizedGain = grossAmount - fees - soldCostBasis`
    * If `newQuantity === 0`, holding `status = "closed"`.
* **`cashDividendHandler` Logic:**
  * Validate: `dividendAmount > 0`.
  * Cash impact: `dividendAmount`.
  * Holding quantity and cost basis do not change.
* **`dripHandler` Logic:**
  * Validate: `dividendAmount > 0`, `quantity > 0`, `price > 0`.
  * Cash impact: `0` (reinvested).
  * Recalculate holding:
    * `newQuantity = oldQuantity + quantity`
    * `newTotalCostBasis = oldTotalCostBasis + dividendAmount`
    * `newAverageCostBasis = newTotalCostBasis / newQuantity`

### 4.2 Atomicity
All transactions execute inside a MongoDB Session. If any write fail (Wallet, Holding, Transaction), the entire transaction is rolled back.

---

## 5. Calculations Engine & Historical Backtracking

### 5.1 Dynamic Holdings Calculation (`calculateHoldingValue`)
Unrealized gain and current valuation are derived dynamically at runtime:
* $\text{currentValue} = \text{quantity} \times \text{currentPrice}$
* $\text{unrealizedGain} = \text{currentValue} - \text{totalCostBasis}$

### 5.2 Historical Backtracking
To compute historical value for Net Worth or Performance charts at date $D$:

1. **Historical Cash Balance (`calculateWalletBalanceAt`):**
   $$\text{balanceAt}(D) = \text{wallet.currentBalance} - \sum_{\text{tx.date} > D} \text{tx.cashImpact}$$
2. **Historical Holding Quantity (`calculateHoldingQuantityAt`):**
   $$\text{quantityAt}(D) = \text{holding.currentQuantity} - \sum_{\text{tx.date} > D} \text{changeInQuantity}$$
3. **Historical Security Price (`calculateHoldingPriceAt`):**
   * Lookup the latest price in the `investment_prices` collection where $\text{date} \le D$.
   * If none exists, fallback to the oldest available price or execution price on/before $D$.
4. **Historical Portfolio Value (`calculatePortfolioValueAt`):**
   $$\text{portfolioValueAt}(D) = \text{balanceAt}(D) + \sum_{h} (\text{quantityAt}(D, h) \times \text{priceAt}(D, h))$$

Portfolio calculations return values in the holding currency. The Net Worth calculation engine is responsible for converting values to the base currency.

---

## 6. UI Structure & Routes

```
/investments                           # Dashboard Summary (Combines all Brokerage accounts)
/investments/accounts                  # Brokerage Accounts Tab
/investments/accounts/[walletId]       # Single Account Details (Cash, Holdings, Performance)
/investments/holdings/[id]             # Holding Detail Page (Overview, Trades, Performance, History)
/investments/transactions              # Investment Ledger
/investments/watchlists                # Multiple Watchlists Manager
```

### 6.1 Expanded Portfolio Summary
* **Metric Cards:**
  1. Total Portfolio Value (Cash + Market value of holdings)
  2. Total Unrealized Gain/Loss (Value vs Cost)
  3. Total Realized Gain/Loss
  4. Available Cash
  5. Active Holdings Count
* **Main Dashboard Quick Actions:**
  * Buy / Sell / Record Dividend / Update Price / Transfer Cash / Add Brokerage Account

---

## 7. Next Steps & Implementation Checkpoints

1. Create types in `types/index.ts` and collections in `lib/db/collections.ts`.
2. Register and configure MongoDB indexes in `lib/db/indexes.ts`.
3. Create business logic layer files in `lib/investments/`.
4. Update Net Worth history engine to include portfolio valuations.
5. Build thin Server Actions and connect to UI sheets.
6. Assemble route pages using shadcn/ui components.
