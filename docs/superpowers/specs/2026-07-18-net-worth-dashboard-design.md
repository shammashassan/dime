# Design Specification: Net Worth Dashboard

This document details the architectural design and implementation plan for the **Net Worth Dashboard** in Dime. It brings together existing financial data (wallets, loans) and introduces a new manual assets/liabilities domain to provide users with a complete overview of their financial standing.

---

## 1. Domain Models & Database Schemas

We will introduce two new MongoDB collections: `assets` and `asset_valuations`.

### 1.1 `Asset` Document (`assets` Collection)

Represents a manual asset or liability not managed by a standard transaction-centric wallet.

```typescript
export type AssetKind = "asset" | "liability";

export type AssetValuationMethod = "manual" | "market" | "calculated";

export type AssetCategory =
  // Assets
  | "real_estate"
  | "vehicle"
  | "gold"
  | "crypto"
  | "investment"
  | "cash"
  | "other"
  // Liabilities
  | "mortgage"
  | "student_loan"
  | "auto_loan"
  | "personal_loan"
  | "credit_card";

export interface Asset {
  _id: ObjectId;
  userId: string;
  organizationId: string | null;
  name: string;
  kind: AssetKind;                      // "asset" | "liability"
  category: AssetCategory;
  currency: string;                     // ISO 4217 (e.g. "USD", "INR")
  currentValue: number;                 // Smallest unit (cents/paise) - denormalized cache of latest valuation
  valuationMethod: AssetValuationMethod;// "manual" | "market" | "calculated"
  ownershipPercentage: number;          // Default: 100
  acquiredAt?: Date;                    // Date of acquisition
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

### 1.2 `AssetValuation` Document (`asset_valuations` Collection)

Stores point-in-time snapshots of an asset's valuation.

```typescript
export type AssetValuationSource = "manual" | "market" | "imported";

export interface AssetValuation {
  _id: ObjectId;
  assetId: string;                      // References Asset._id
  userId: string;
  organizationId: string | null;
  date: Date;                           // The valuation date
  value: number;                        // Value in smallest unit (cents/paise)
  source: AssetValuationSource;         // "manual" | "market" | "imported"
  notes?: string;
  createdAt: Date;
}
```

### 1.3 Database Indexes

* **`assets` collection**:
  * `{ userId: 1, organizationId: 1, isArchived: 1 }`
  * `{ kind: 1, category: 1 }`
* **`asset_valuations` collection**:
  * `{ assetId: 1, date: -1 }`
  * `{ userId: 1, date: -1 }`

---

## 2. Pure Calculation Layer (`lib/net-worth/`)

To separate business logic from data access and UI presentation, we introduce a pure financial engine. This engine does not perform database queries itself; it accepts pre-fetched records and processes them in-memory.

### 2.1 Pure Historical Value Helpers

* `getWalletBalanceAt(transactions: Transaction[], wallet: Wallet, date: Date): number`
  * Backtracks the wallet balance to the specified `date` by analyzing transactions occurring *after* `date` and reversing their effects on the current `wallet.balance`.
* `getLoanBalanceAt(loan: Loan, repayments: LoanRepayment[], date: Date): number`
  * Reconstructs the loan remaining balance at `date`.
  * If `date < loan.date`, returns `0`.
  * If `date >= loan.date`, returns `loan.remainingAmount` plus all repayments on this loan that occurred *after* `date`.
* `getAssetValueAt(valuations: AssetValuation[], asset: Asset, date: Date): number`
  * Finds the latest valuation record for this asset where `valuation.date <= date`.
  * Returns `valuation.value * (asset.ownershipPercentage / 100)`. If no valuation is found before `date`, returns `0`.

### 2.2 Historical Net Worth Generator

* `calculateNetWorthHistory(params: { wallets: Wallet[], transactions: Transaction[], loans: Loan[], repayments: LoanRepayment[], assets: Asset[], valuations: AssetValuation[], convert: (amount: number, from: string) => number, dates: Date[] })`
  * Evaluates net worth across the requested list of `dates` (which can represent daily, weekly, monthly, or yearly intervals).
  * For each date `D`, it sums:
    * **Assets**: Converted backtracked balances of Asset wallets, Active loans (lent), and Manual assets.
    * **Liabilities**: Converted backtracked credit card wallets (negated), Active loans (borrowed), and Manual liabilities.
  * Returns a structured timeline of historical breakdowns:
    ```typescript
    interface NetWorthHistoryPoint {
      dateStr: string; // Formatted date
      netWorth: number;
      assets: number;
      liabilities: number;
      breakdown: {
        walletsAsset: number;
        walletsLiability: number;
        loansAsset: number;
        loansLiability: number;
        manualAsset: number;
        manualLiability: number;
      }
    }
    ```

---

## 3. Query & Action Layers

### 3.1 Queries (`lib/queries/assets.ts`)

* `getAssets()`: Retrieves active assets within the current financial scope.
* `getAssetById(id)`: Retrieves a single asset.
* `getAssetValuations(assetId)`: Retrieves all valuations for a specific asset sorted by date descending.
* `getAssetsAndValuationsForScope()`: Retrieves all active assets and their valuations for the current scope in one database operation (used to feed the calculation layer).

### 3.2 Actions (`lib/actions/assets.ts`)

* `createAsset(input)`: Inserts a new `Asset` document, and automatically writes the initial `AssetValuation` entry matching `currentValue` at `acquiredAt` or `createdAt`. Revalidates `net-worth` and `wallets`.
* `updateAsset(id, input)`: Updates canonical fields of the `Asset` document.
* `addAssetValuation(assetId, date, value, notes)`: Inserts an `AssetValuation`. Checks if this valuation is the newest chronologically; if so, updates `Asset.currentValue`.
* `deleteAssetValuation(valuationId)`: Removes a valuation. Updates `Asset.currentValue` if the removed valuation was the latest.
* `deleteAsset(id)`: Deletes the asset and all its valuation logs.

---

## 4. User Interface Architecture

We will structure the Net Worth module into two main dashboard tabs and an asset details page.

### 4.1 Route `/net-worth`

* **Metrics Header**:
  * Current Net Worth, Total Assets, Total Liabilities, and Monthly Growth Rate.
* **Overview Tab (Analytics Only)**:
  * **Net Worth History Chart**: An interactive Area/Line chart demonstrating assets vs liabilities and net worth progression. Supports date range filter toggles.
  * **Allocation Section**: Two separate Donut/Pie charts mapping assets breakdown (Cash, Bank, Investments, Loans, Manual Assets) and liabilities breakdown (Credit Cards, Loans, Manual Liabilities).
  * **Currency Breakdown**: Displays the balance held per currency and its base-currency equivalent.
* **Assets & Liabilities Tab (Management)**:
  * Grouped display of assets and liabilities.
  * Comprehensive filters (kind, category, currency, method, value range).
  * "Add Asset" and "Add Liability" trigger dialogs.
  * Quick-action menus for list items: Edit, Log Valuation, Archive, and Delete.

### 4.2 Route `/net-worth/assets/[id]`

A dedicated details page for a single manual asset/liability.
* **Left Column / Core details**:
  * Name, kind, category, valuation method, acquisition date, and ownership percentage.
  * Persistent notes section.
  * Placeholders for future attachments, market sync status, and transaction relationships.
* **Right Column / History & Metrics**:
  * Line chart showing the asset's individual valuation progression.
  * "Log Valuation" action to insert new point-in-time values.
  * Chronological log table of past valuations with delete functionality.
  * Delete/Archive buttons.

---

## 5. Revalidation Strategy

After any Asset or Valuation write action, only the relevant path and tags are invalidated to optimize cache hit rates:
* `revalidatePath("/net-worth")`
* `revalidatePath("/net-worth/assets/[id]")`
* `revalidatePath("/", "layout")` (for dashboard metrics sync)
* Cache tag: `"assets"`, `"asset_valuations"`
