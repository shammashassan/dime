# Design Spec: Net Worth Dashboard Layout & Information Density Refinement

## Goal & Objectives
Redesign the Net Worth Overview tab into a dense, premium Bento-style financial command center. The goal is to maximize information density, eliminate empty vertical spaces, remove redundant visuals, and present key indicators in a modern grid structure.

---

## 1. High-Level Architecture

We will implement a clean architecture separating the **Database Query Layer**, **Financial Calculations Layer**, **Overview View Model**, and **UI Components**. No business logic or persistence rules will live in the UI.

```
Database 
  → Query Layer (app/(dashboard)/net-worth/page.tsx)
  → Calculations Layer (lib/calculations/net-worth-viewmodel.ts)
  → Presentation View Model (NetWorthOverviewViewModel)
  → UI Components (components/net-worth/net-worth-overview.tsx)
```

---

## 2. Presentation View Model (NetWorthOverviewViewModel)

We will define the UI presentation structures in a clean TypeScript schema. This view model will contain all elements fully calculated, sorted, and ranked on the server or in a pure helper before render.

```typescript
export interface NetWorthHolding {
  id: string
  name: string
  source: "wallet" | "loan" | "asset"
  kind: "asset" | "liability"
  category: string
  currentValue: number     // Converted to base currency, stored in cents
  percentage: number       // Percentage of total assets (or total liabilities)
  currency: string         // Base currency
  originalValue: number    // Value in original currency
  originalCurrency: string // e.g. "USD", "INR"
  icon: string             // Icon name string
  href?: string            // Path to detail page (/wallets/[id], /loans/[id], etc.)
}

export interface NetWorthActivityEvent {
  id: string
  type: "valuation" | "repayment" | "new_loan" | "new_asset" | "transaction"
  date: Date
  title: string
  description: string
  amount?: number          // Optional value in original currency
  currency?: string
  href?: string
}

export interface NetWorthInsight {
  id: string
  type: "info" | "warning" | "success"
  text: string
  metric?: string
}

export interface NetWorthOverviewViewModel {
  currency: string
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  moMChangePct: number
  largestAsset?: { name: string; value: number }
  
  // Health Metrics
  liquidityRatio: number  // (Cash + Bank) / Total Assets
  debtRatio: number       // Total Liabilities / Total Assets
  largestLiability?: { name: string; value: number }
  netWorthTrend: "up" | "down" | "flat"

  // Holdings Lists
  topAssets: NetWorthHolding[]
  topLiabilities: NetWorthHolding[]

  // Activity & Insights
  recentActivity: NetWorthActivityEvent[]
  insights: NetWorthInsight[]
}
```

---

## 3. UI Component Structure (Bento Layout)

The dashboard will render the visual cards in a balanced Bento grid container with varying column and row spanning.

```
+-----------------------------------------------------------------------------------+
| Row 1: SUMMARY CARDS (Grid cols-1 md:cols-4)                                     |
| [ Net Worth ]      [ Total Assets ]      [ Total Liabilities ]  [ MoM / Growth ]  |
+-----------------------------------------------------------------------------------+
| Row 2: PRIMARY VISUALIZATION (Grid cols-1 lg:cols-3)                              |
| [ Net Worth Timeline (lg:col-span-2, height: 260px) ]  [ Financial Health (col-1) ] |
+-----------------------------------------------------------------------------------+
| Row 3: PORTFOLIO COMPOSITION (Grid cols-1 lg:cols-2)                              |
| [ Asset Allocation (Donut) ]               [ Currency Exposure (Radial) ]         |
+-----------------------------------------------------------------------------------+
| Row 4: HOLDINGS & DETAILS (Grid cols-1 lg:cols-2)                                 |
| [ Top Assets (List, clickable rows) ]      [ Top Liabilities (List, clickable) ]  |
+-----------------------------------------------------------------------------------+
| Row 5: RECENT FINANCIAL ACTIVITY (Grid cols-1 lg:cols-3)                          |
| [ Recent Activity (lg:col-span-2) ]        [ Quick Actions Panel (col-1) ]        |
+-----------------------------------------------------------------------------------+
| Row 6: INSIGHTS CONSOLE (Full width)                                              |
| [ Calculated Financial Insights Feed ]                                            |
+-----------------------------------------------------------------------------------+
```

### Row Details & Content:
- **Summary Cards**: Styled exactly like the premium metric cards in `/loans/[id]`. Features a main numeric value, top description, right-side icon inside a colored pill, and a bottom divided section containing secondary split metrics.
- **Financial Health**: Displays a KPI list including Liquidity Ratio (Progress bar), Debt Ratio (Progress bar), largest holding callout, and a quick text evaluation (e.g. "Excellent", "Healthy", "Warning").
- **Portfolio Composition**: Side-by-side card layouts for Asset Allocation and Currency Exposure.
- **Top Holdings**: Displays names, converted value, percentage bar, and handles clicks.
- **Recent Activity**: A list feed with colored timeline bullets for each activity event.
- **Insights Console**: Displays dynamically calculated insights (e.g. cash weight, category diversification, asset/liability ratio check) with a clean typographic layout.

---

## 4. Calculations Logic & Data Mapping

A new file `lib/calculations/net-worth-viewmodel.ts` will implement the generation of `NetWorthOverviewViewModel`:

1. **Top Assets mapping**:
   - Collect wallets with `type !== "credit_card"`. Converted value = `convert(wallet.balance, wallet.currency)`.
   - Collect loans with `type === "lent"` and `status !== "cancelled"`. Converted value = `convert(loan.remainingAmount, loan.currency)`.
   - Collect manual assets with `kind === "asset"` and `status === "active"`. Converted value = `convert(asset.currentValue * asset.ownershipPercentage / 100, asset.currency)`.
   - Combine, sort descending, calculate percentage of `totalAssets`, slice top 5.

2. **Top Liabilities mapping**:
   - Collect wallets with `type === "credit_card"`. Converted value = `convert(-wallet.balance, wallet.currency)`.
   - Collect loans with `type === "borrowed"` and `status !== "cancelled"`. Converted value = `convert(loan.remainingAmount, loan.currency)`.
   - Collect manual assets with `kind === "liability"` and `status === "active"`. Converted value = `convert(asset.currentValue * asset.ownershipPercentage / 100, asset.currency)`.
   - Combine, sort descending, calculate percentage of `totalLiabilities`, slice top 5.

3. **Recent Activity mapping**:
   - Collect `AssetValuation` logs (valuation changes).
   - Collect `LoanRepayment` logs (repayments).
   - Collect high-value `Transaction` items.
   - Sort all events chronologically descending, limit to 8.

4. **Insights generation**:
   - Check MoM change and build message.
   - Calculate percentage contribution of largest asset.
   - Diversification count across categories.
   - Debt-to-Asset ratio health feedback.
