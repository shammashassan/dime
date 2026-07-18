# Net Worth Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Net Worth Dashboard that aggregates wallets, active loans, and a new manual assets/liabilities domain into a clean, dynamically backtracked timeline and structured overview tabs, with a dedicated asset details page.

**Architecture:** Pure financial calculations layer `lib/net-worth/calculations.ts` (accepts pre-fetched models and backtracking logs to return structured net worth timelines) combined with a database query layer, mutation actions, and a multi-tab interface (`Overview` and `Assets & Liabilities`) co-located with a `/net-worth/assets/[id]` detail page.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Lucide Icons, Recharts, MongoDB, Zod, and shadcn/ui.

---

## File Structure Map

We will create and modify the following files:
1. `types/index.ts` (Modify): Add `Asset`, `AssetValuation`, and enum types.
2. `lib/db/collections.ts` (Modify): Export `assetsCollection` and `assetValuationsCollection`.
3. `lib/db/indexes.ts` (Modify): Create indexes for the new collections.
4. `lib/net-worth/types.ts` (Create): Define return types for the pure calculations layer.
5. `lib/net-worth/calculations.ts` (Create): Implement pure, timezone-safe balance-backtracking logic.
6. `lib/queries/assets.ts` (Create): Database query layer.
7. `lib/actions/assets.ts` (Create): Server actions for CRUD and cache revalidation.
8. `app/(dashboard)/net-worth/page.tsx` (Create): Tab manager page displaying the dashboard.
9. `components/net-worth/net-worth-overview.tsx` (Create): Overview tab with Recharts timeline and allocation charts.
10. `components/net-worth/asset-list.tsx` (Create): Assets & Liabilities tab with management controls.
11. `components/net-worth/asset-dialog.tsx` (Create): Modal/Dialog to add/edit assets and liabilities.
12. `components/net-worth/valuation-dialog.tsx` (Create): Modal/Dialog to log manual asset valuations.
13. `app/(dashboard)/net-worth/assets/[id]/page.tsx` (Create): Dedicated asset detail page.
14. `components/net-worth/asset-detail-client.tsx` (Create): Interactive components for the asset detail page.
15. `components/layout/dashboard-sidebar.tsx` (Modify): Add Net Worth to sidebar navigation.
16. `scratch/test-net-worth.ts` (Create): Script to run verification tests on calculations.

---

### Task 1: Setup Schemas, Types, Collections, and Indexes

**Files:**
* Modify: [types/index.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/types/index.ts)
* Modify: [lib/db/collections.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/db/collections.ts)
* Modify: [lib/db/indexes.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/db/indexes.ts)

- [ ] **Step 1: Add types to types/index.ts**
  Add the types for manual Assets and Valuations at the bottom of the file:
  ```typescript
  export type AssetKind = "asset" | "liability";

  export type AssetValuationMethod = "manual" | "market" | "calculated";

  export type AssetValuationSource = "manual" | "market" | "imported";

  export type AssetCategory =
    | "real_estate"
    | "vehicle"
    | "gold"
    | "crypto"
    | "investment"
    | "cash"
    | "other"
    | "mortgage"
    | "student_loan"
    | "auto_loan"
    | "personal_loan"
    | "credit_card";

  export type AssetStatus = "active" | "archived";

  export interface Asset {
    _id: any; // ObjectId
    userId: string;
    organizationId: string | null;
    name: string;
    kind: AssetKind;
    category: AssetCategory;
    currency: string;
    currentValue: number; // Stored in cents/paise
    valuationMethod: AssetValuationMethod;
    ownershipPercentage: number;
    acquiredAt?: Date;
    notes?: string;
    status: AssetStatus;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }

  export interface AssetValuation {
    _id: any; // ObjectId
    assetId: string;
    userId: string;
    organizationId: string | null;
    date: Date;
    value: number; // Stored in cents/paise
    source: AssetValuationSource;
    notes?: string;
    createdAt: Date;
  }
  ```

- [ ] **Step 2: Register collections in lib/db/collections.ts**
  Import the interfaces and export the collection references:
  ```typescript
  import { Asset, AssetValuation } from "@/types"
  // ... existing collections ...
  export const assetsCollection = db.collection<Asset>("assets")
  export const assetValuationsCollection = db.collection<AssetValuation>("asset_valuations")
  ```

- [ ] **Step 3: Define database indexes in lib/db/indexes.ts**
  Locate section 4 in `initDatabase()` and add index setup for assets and asset_valuations:
  ```typescript
      // 4. Create indexes for wallets, goals, and categories
      const wallets = db.collection("wallets")
      await wallets.createIndex({ userId: 1 })
      await wallets.createIndex({ organizationId: 1 })

      // ADD THIS:
      const assets = db.collection("assets")
      await assets.createIndex({ userId: 1, organizationId: 1, status: 1 })
      await assets.createIndex({ kind: 1, category: 1 })

      const assetValuations = db.collection("asset_valuations")
      await assetValuations.createIndex({ assetId: 1, date: -1 })
      await assetValuations.createIndex({ userId: 1, date: -1 })
  ```

- [ ] **Step 4: Commit changes**
  ```bash
  git add types/index.ts lib/db/collections.ts lib/db/indexes.ts
  git commit -m "feat: add schema, collection registration, and indexes for Net Worth assets"
  ```

---

### Task 2: Create Pure Calculations Layer

**Files:**
* Create: `lib/net-worth/types.ts`
* Create: `lib/net-worth/calculations.ts`

- [ ] **Step 1: Write lib/net-worth/types.ts**
  Create this file containing return types for calculation functions:
  ```typescript
  export interface NetWorthBreakdown {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    assetsBreakdown: {
      cash: number;
      bank: number;
      investments: number;
      loans: number;
      manualAssets: number;
    };
    liabilitiesBreakdown: {
      creditCards: number;
      loans: number;
      manualLiabilities: number;
    };
    currencyBreakdown: Record<string, { assets: number; liabilities: number; netWorth: number }>;
  }

  export interface HistoricalNetWorthPoint extends NetWorthBreakdown {
    date: Date;
    dateStr: string;
  }
  ```

- [ ] **Step 2: Write lib/net-worth/calculations.ts**
  Create this file containing the pure calculations engine:
  ```typescript
  import { Wallet, Transaction, Loan, LoanRepayment, Asset, AssetValuation } from "@/types";
  import { NetWorthBreakdown, HistoricalNetWorthPoint } from "./types";

  // Reusable backtracking helpers
  export function getWalletBalanceAt(
    transactions: Transaction[],
    wallet: Wallet,
    date: Date
  ): number {
    let balance = wallet.balance;
    const walletIdStr = wallet._id.toString();

    // Replay transactions that occurred after the target date in reverse
    for (const tx of transactions) {
      if (tx.walletId !== walletIdStr || new Date(tx.date) <= date) continue;

      if (tx.type === "expense") {
        balance += tx.amount; // Revert expense: add back
      } else if (tx.type === "income") {
        balance -= tx.amount; // Revert income: subtract
      } else if (tx.type === "transfer") {
        if (tx.transferType === "debit") {
          balance += tx.amount; // Revert transfer debit: add back
        } else if (tx.transferType === "credit") {
          balance -= tx.amount; // Revert transfer credit: subtract
        }
      }
    }
    return balance;
  }

  export function getLoanBalanceAt(
    loan: Loan,
    repayments: LoanRepayment[],
    date: Date
  ): number {
    const loanDate = new Date(loan.date);
    if (date < loanDate) return 0; // Loan wasn't active yet

    const loanIdStr = loan._id.toString();
    let balance = loan.remainingAmount;

    // Re-add repayments that occurred after the target date
    for (const rep of repayments) {
      if (rep.loanId !== loanIdStr || new Date(rep.date) <= date) continue;
      balance += rep.amount;
    }

    return balance;
  }

  export function getAssetValueAt(
    valuations: AssetValuation[],
    asset: Asset,
    date: Date
  ): number {
    const assetIdStr = asset._id.toString();
    let latestValuation: AssetValuation | null = null;

    // Find the latest valuation on or before the target date
    for (const v of valuations) {
      if (v.assetId !== assetIdStr) continue;
      const valDate = new Date(v.date);
      if (valDate <= date) {
        if (!latestValuation || valDate > new Date(latestValuation.date)) {
          latestValuation = v;
        }
      }
    }

    if (!latestValuation) return 0;
    return Math.round(latestValuation.value * (asset.ownershipPercentage / 100));
  }

  export function calculateCurrentNetWorth(params: {
    wallets: Wallet[];
    loans: Loan[];
    assets: Asset[];
    convert: (amount: number, from: string) => number;
  }): NetWorthBreakdown {
    const { wallets, loans, assets, convert } = params;

    let totalAssets = 0;
    let totalLiabilities = 0;

    const assetsBreakdown = { cash: 0, bank: 0, investments: 0, loans: 0, manualAssets: 0 };
    const liabilitiesBreakdown = { creditCards: 0, loans: 0, manualLiabilities: 0 };
    const currencyBreakdown: Record<string, { assets: number; liabilities: number; netWorth: number }> = {};

    const trackCurrency = (amount: number, currency: string, isAsset: boolean) => {
      const uCurr = currency.toUpperCase();
      if (!currencyBreakdown[uCurr]) {
        currencyBreakdown[uCurr] = { assets: 0, liabilities: 0, netWorth: 0 };
      }
      if (isAsset) {
        currencyBreakdown[uCurr].assets += amount;
        currencyBreakdown[uCurr].netWorth += amount;
      } else {
        currencyBreakdown[uCurr].liabilities += amount;
        currencyBreakdown[uCurr].netWorth -= amount;
      }
    };

    // 1. Process Wallets
    for (const w of wallets) {
      if (w.isArchived) continue;
      
      const balance = w.balance;
      const converted = convert(balance, w.currency);

      if (w.type === "credit_card") {
        const liabilityValue = -balance; // positive value representing the debt
        totalLiabilities += convert(liabilityValue, w.currency);
        liabilitiesBreakdown.creditCards += convert(liabilityValue, w.currency);
        trackCurrency(liabilityValue, w.currency, false);
      } else {
        totalAssets += converted;
        trackCurrency(balance, w.currency, true);

        if (w.type === "cash") assetsBreakdown.cash += converted;
        else if (w.type === "investment") assetsBreakdown.investments += converted;
        else if (w.type === "lent") assetsBreakdown.loans += converted; // custom lent wallet
        else assetsBreakdown.bank += converted; // bank / savings
      }
    }

    // 2. Process Loans
    for (const l of loans) {
      if (l.status === "cancelled") continue;

      const remaining = l.remainingAmount;
      const converted = convert(remaining, l.currency);

      if (l.type === "lent") {
        totalAssets += converted;
        assetsBreakdown.loans += converted;
        trackCurrency(remaining, l.currency, true);
      } else {
        totalLiabilities += converted;
        liabilitiesBreakdown.loans += converted;
        trackCurrency(remaining, l.currency, false);
      }
    }

    // 3. Process Manual Assets
    for (const a of assets) {
      if (a.status !== "active") continue;

      const ownedValue = Math.round(a.currentValue * (a.ownershipPercentage / 100));
      const converted = convert(ownedValue, a.currency);

      if (a.kind === "asset") {
        totalAssets += converted;
        trackCurrency(ownedValue, a.currency, true);
        if (a.category === "cash") assetsBreakdown.cash += converted;
        else if (a.category === "investment" || a.category === "gold" || a.category === "crypto") assetsBreakdown.investments += converted;
        else assetsBreakdown.manualAssets += converted;
      } else {
        totalLiabilities += converted;
        liabilitiesBreakdown.manualLiabilities += converted;
        trackCurrency(ownedValue, a.currency, false);
      }
    }

    return {
      netWorth: totalAssets - totalLiabilities,
      totalAssets,
      totalLiabilities,
      assetsBreakdown,
      liabilitiesBreakdown,
      currencyBreakdown
    };
  }

  export function calculateNetWorthHistory(params: {
    wallets: Wallet[];
    transactions: Transaction[];
    loans: Loan[];
    repayments: LoanRepayment[];
    assets: Asset[];
    valuations: AssetValuation[];
    convert: (amount: number, from: string) => number;
    dates: Date[];
  }): HistoricalNetWorthPoint[] {
    const { wallets, transactions, loans, repayments, assets, valuations, convert, dates } = params;

    // Sort transactions descending for faster backtracking
    const sortedTxs = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return dates.map((date) => {
      // 1. Wallets at point-in-time
      const dateWallets = wallets.map(w => ({
        ...w,
        balance: getWalletBalanceAt(sortedTxs, w, date)
      }));

      // 2. Loans at point-in-time
      const dateLoans = loans.map(l => ({
        ...l,
        remainingAmount: getLoanBalanceAt(l, repayments, date)
      }));

      // 3. Assets at point-in-time
      const dateAssets = assets.map(a => ({
        ...a,
        currentValue: getAssetValueAt(valuations, a, date)
      }));

      const breakdown = calculateCurrentNetWorth({
        wallets: dateWallets,
        loans: dateLoans,
        assets: dateAssets,
        convert
      });

      const dateStr = `${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear().toString().slice(-2)}`;

      return {
        ...breakdown,
        date,
        dateStr
      };
    });
  }
  ```

- [ ] **Step 3: Commit changes**
  ```bash
  git add lib/net-worth/types.ts lib/net-worth/calculations.ts
  git commit -m "feat: add pure Net Worth calculation layer"
  ```

---

### Task 3: Setup Calculations Verification Test

**Files:**
* Create: `scratch/test-net-worth.ts`

- [ ] **Step 1: Write scratch/test-net-worth.ts**
  Create a test script that validates the engine against mock data:
  ```typescript
  import { Wallet, Transaction, Loan, LoanRepayment, Asset, AssetValuation } from "../types";
  import { calculateCurrentNetWorth, calculateNetWorthHistory } from "../lib/net-worth/calculations";

  const mockWallets: Wallet[] = [
    {
      _id: "w1" as any,
      userId: "u1",
      name: "Bank",
      type: "bank",
      currency: "USD",
      balance: 100000, // $1000.00
      color: "#000",
      icon: "Wallet",
      isArchived: false,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date(),
    },
    {
      _id: "w2" as any,
      userId: "u1",
      name: "Credit Card",
      type: "credit_card",
      currency: "USD",
      balance: -20000, // -$200.00
      color: "#000",
      icon: "CreditCard",
      isArchived: false,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date(),
    }
  ];

  const mockLoans: Loan[] = [
    {
      _id: "l1" as any,
      userId: "u1",
      organizationId: null,
      type: "lent",
      contactId: "c1",
      personName: "Bob",
      amount: 50000, // $500.00
      currency: "USD",
      walletId: "w1",
      transactionId: "tx1",
      date: new Date("2026-02-15"),
      status: "active",
      remainingAmount: 30000, // $300.00 remaining
      reminderSchedule: [],
      sentReminders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }
  ];

  const mockRepayments: LoanRepayment[] = [
    {
      _id: "rep1" as any,
      loanId: "l1",
      transactionId: "tx2",
      amount: 20000, // $200.00 paid on March 5
      date: new Date("2026-03-05"),
      createdAt: new Date()
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      _id: "tx2" as any,
      userId: "u1",
      walletId: "w1",
      type: "income",
      amount: 20000,
      currency: "USD",
      description: "Loan repayment from Bob",
      date: new Date("2026-03-05"),
      tags: [],
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockAssets: Asset[] = [
    {
      _id: "a1" as any,
      userId: "u1",
      organizationId: null,
      name: "Tesla Stock",
      kind: "asset",
      category: "investment",
      currency: "USD",
      currentValue: 50000, // $500.00
      valuationMethod: "manual",
      ownershipPercentage: 100,
      notes: "",
      status: "active",
      isArchived: false,
      createdAt: new Date("2026-01-10"),
      updatedAt: new Date(),
      version: 1
    }
  ];

  const mockValuations: AssetValuation[] = [
    {
      _id: "v1" as any,
      assetId: "a1",
      userId: "u1",
      organizationId: null,
      date: new Date("2026-01-10"),
      value: 40000, // $400.00 initial
      source: "manual",
      createdAt: new Date()
    },
    {
      _id: "v2" as any,
      assetId: "a1",
      userId: "u1",
      organizationId: null,
      date: new Date("2026-03-10"),
      value: 50000, // $500.00 updated
      source: "manual",
      createdAt: new Date()
    }
  ];

  const convertUSD = (amount: number, from: string) => amount; // Simple 1:1

  // Run Current Net Worth Test
  console.log("Testing current net worth...");
  const current = calculateCurrentNetWorth({
    wallets: mockWallets,
    loans: mockLoans,
    assets: mockAssets,
    convert: convertUSD
  });
  console.log("Current Net Worth:", current.netWorth);
  console.assert(current.netWorth === 160000, `Expected 160000, got ${current.netWorth}`); // 1000 - 200 (credit card) + 300 (loan) + 500 (stock) = 1600

  // Run History Net Worth Test
  console.log("Testing historical net worth...");
  const dates = [
    new Date("2026-01-31"), // end of Jan
    new Date("2026-02-28"), // end of Feb
    new Date("2026-03-31")  // end of Mar
  ];

  const history = calculateNetWorthHistory({
    wallets: mockWallets,
    transactions: mockTransactions,
    loans: mockLoans,
    repayments: mockRepayments,
    assets: mockAssets,
    valuations: mockValuations,
    convert: convertUSD,
    dates
  });

  console.log("Timeline points:");
  history.forEach(pt => {
    console.log(`${pt.dateStr}: Net Worth = ${pt.netWorth}, Assets = ${pt.totalAssets}, Liabilities = ${pt.totalLiabilities}`);
  });

  console.log("All calculation tests pass!");
  ```

- [ ] **Step 2: Run the scratch test**
  Run: `npx tsx scratch/test-net-worth.ts`
  Expected output: "All calculation tests pass!"

- [ ] **Step 3: Commit and clean**
  Remove the test file or keep it in git. Let's keep it in scratch:
  ```bash
  git add scratch/test-net-worth.ts
  git commit -m "test: add verification script for Net Worth calculations"
  ```

---

### Task 4: Create Database Query Layer

**Files:**
* Create: `lib/queries/assets.ts`

- [ ] **Step 1: Write lib/queries/assets.ts**
  Implement the query module utilizing Scope Filters and React cache:
  ```typescript
  import { cache } from "react"
  import { ObjectId } from "mongodb"
  import { getCollection } from "@/lib/db/collections"
  import { Asset, AssetValuation } from "@/types"
  import { getFinancialScope, getScopeFilter } from "@/lib/scope"

  export const getAssets = cache(async (): Promise<Asset[]> => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const assetsColl = await getCollection<Asset>("assets")

    return assetsColl.find({
      ...filter,
      status: "active"
    }).sort({ name: 1 }).toArray()
  })

  export const getAssetById = cache(async (id: string): Promise<Asset | null> => {
    try {
      const scope = await getFinancialScope()
      const filter = getScopeFilter(scope)
      const assetsColl = await getCollection<Asset>("assets")

      return assetsColl.findOne({
        _id: new ObjectId(id),
        ...filter
      })
    } catch {
      return null
    }
  })

  export const getAssetValuations = cache(async (assetId: string): Promise<AssetValuation[]> => {
    try {
      const valuationsColl = await getCollection<AssetValuation>("asset_valuations")
      return valuationsColl.find({ assetId }).sort({ date: -1 }).toArray()
    } catch {
      return []
    }
  })

  export const getAssetsAndValuationsForScope = cache(async () => {
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)
    const assetsColl = await getCollection<Asset>("assets")
    const valuationsColl = await getCollection<AssetValuation>("asset_valuations")

    const assets = await assetsColl.find(filter).toArray()
    const assetIds = assets.map(a => a._id.toString())

    const valuations = assetIds.length > 0 
      ? await valuationsColl.find({ assetId: { $in: assetIds } }).sort({ date: -1 }).toArray()
      : []

    return { assets, valuations }
  })
  ```

- [ ] **Step 2: Commit changes**
  ```bash
  git add lib/queries/assets.ts
  git commit -m "feat: implement Net Worth query layer"
  ```

---

### Task 5: Create Server Actions Layer

**Files:**
* Create: `lib/actions/assets.ts`

- [ ] **Step 1: Write lib/actions/assets.ts**
  Create the action file using Zod schemas for input validation:
  ```typescript
  "use server"

  import { z } from "zod"
  import { ObjectId } from "mongodb"
  import { revalidatePath } from "next/cache"
  import { getCollection } from "@/lib/db/collections"
  import { requireApprovedUser } from "@/lib/auth-guard"
  import { getFinancialScope, getScopeFilter } from "@/lib/scope"
  import { Asset, AssetValuation, AssetCategory, AssetKind, AssetValuationMethod } from "@/types"

  const assetSchema = z.object({
    name: z.string().min(1, "Name is required"),
    kind: z.enum(["asset", "liability"]),
    category: z.enum([
      "real_estate", "vehicle", "gold", "crypto", "investment", "cash", "other",
      "mortgage", "student_loan", "auto_loan", "personal_loan", "credit_card"
    ]),
    currency: z.string().length(3, "Currency must be 3 characters"),
    currentValue: z.number().nonnegative("Value must be positive"),
    valuationMethod: z.enum(["manual", "market", "calculated"]),
    ownershipPercentage: z.number().min(0).max(100).default(100),
    acquiredAt: z.string().optional().transform(v => v ? new Date(v) : undefined),
    notes: z.string().optional()
  })

  export async function createAsset(input: z.infer<typeof assetSchema>) {
    const user = await requireApprovedUser()
    const validated = assetSchema.parse(input)
    const scope = await getFinancialScope()

    const assetsColl = await getCollection<Asset>("assets")
    const valuationsColl = await getCollection<AssetValuation>("asset_valuations")

    const assetOid = new ObjectId()
    const now = new Date()

    const newAsset: Asset = {
      _id: assetOid,
      userId: user.user.id,
      organizationId: scope.organizationId,
      name: validated.name,
      kind: validated.kind as AssetKind,
      category: validated.category as AssetCategory,
      currency: validated.currency,
      currentValue: validated.currentValue,
      valuationMethod: validated.valuationMethod as AssetValuationMethod,
      ownershipPercentage: validated.ownershipPercentage,
      acquiredAt: validated.acquiredAt,
      notes: validated.notes,
      status: "active",
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      version: 1
    }

    await assetsColl.insertOne(newAsset)

    // Automatically create initial valuation record
    const valuationOid = new ObjectId()
    const newValuation: AssetValuation = {
      _id: valuationOid,
      assetId: assetOid.toString(),
      userId: user.user.id,
      organizationId: scope.organizationId,
      date: validated.acquiredAt || now,
      value: validated.currentValue,
      source: "manual",
      notes: "Initial acquisition value",
      createdAt: now
    }

    await valuationsColl.insertOne(newValuation)

    revalidatePath("/net-worth")
    revalidatePath("/", "layout")

    return { success: true, id: assetOid.toString() }
  }

  export async function updateAsset(id: string, input: Partial<z.infer<typeof assetSchema>>) {
    await requireApprovedUser()
    const scope = await getFinancialScope()
    const assetsColl = await getCollection<Asset>("assets")

    const updateFields: any = {
      updatedAt: new Date(),
    }
    if (input.name !== undefined) updateFields.name = input.name
    if (input.category !== undefined) updateFields.category = input.category
    if (input.valuationMethod !== undefined) updateFields.valuationMethod = input.valuationMethod
    if (input.ownershipPercentage !== undefined) updateFields.ownershipPercentage = input.ownershipPercentage
    if (input.notes !== undefined) updateFields.notes = input.notes
    if (input.acquiredAt !== undefined) updateFields.acquiredAt = input.acquiredAt ? new Date(input.acquiredAt) : undefined

    await assetsColl.updateOne(
      { _id: new ObjectId(id), ...getScopeFilter(scope) },
      { 
        $set: updateFields,
        $inc: { version: 1 }
      }
    )

    revalidatePath("/net-worth")
    revalidatePath(`/net-worth/assets/${id}`)
    revalidatePath("/", "layout")

    return { success: true }
  }

  export async function addAssetValuation(assetId: string, input: { date: string; value: number; notes?: string }) {
    const user = await requireApprovedUser()
    const scope = await getFinancialScope()

    const assetsColl = await getCollection<Asset>("assets")
    const valuationsColl = await getCollection<AssetValuation>("asset_valuations")

    const asset = await assetsColl.findOne({ _id: new ObjectId(assetId), ...getScopeFilter(scope) })
    if (!asset) throw new Error("Asset not found")

    const valDate = new Date(input.date)
    const valuationOid = new ObjectId()

    const newValuation: AssetValuation = {
      _id: valuationOid,
      assetId,
      userId: user.user.id,
      organizationId: scope.organizationId,
      date: valDate,
      value: input.value,
      source: "manual",
      notes: input.notes,
      createdAt: new Date()
    }

    await valuationsColl.insertOne(newValuation)

    // Check if this valuation is chronologically the latest
    const allValuations = await valuationsColl.find({ assetId }).sort({ date: -1 }).toArray()
    const latestValuation = allValuations[0]

    if (latestValuation && latestValuation._id.toString() === valuationOid.toString()) {
      // Update denormalized cache on the Asset document
      await assetsColl.updateOne(
        { _id: new ObjectId(assetId) },
        { 
          $set: { currentValue: input.value, updatedAt: new Date() },
          $inc: { version: 1 }
        }
      )
    }

    revalidatePath("/net-worth")
    revalidatePath(`/net-worth/assets/${assetId}`)
    revalidatePath("/", "layout")

    return { success: true }
  }

  export async function deleteAssetValuation(valuationId: string, assetId: string) {
    await requireApprovedUser()
    const scope = await getFinancialScope()

    const assetsColl = await getCollection<Asset>("assets")
    const valuationsColl = await getCollection<AssetValuation>("asset_valuations")

    await valuationsColl.deleteOne({ _id: new ObjectId(valuationId) })

    // Recalculate latest valuation and update cache
    const allValuations = await valuationsColl.find({ assetId }).sort({ date: -1 }).toArray()
    const latestValuation = allValuations[0]

    if (latestValuation) {
      await assetsColl.updateOne(
        { _id: new ObjectId(assetId), ...getScopeFilter(scope) },
        { $set: { currentValue: latestValuation.value, updatedAt: new Date() } }
      )
    } else {
      await assetsColl.updateOne(
        { _id: new ObjectId(assetId), ...getScopeFilter(scope) },
        { $set: { currentValue: 0, updatedAt: new Date() } }
      )
    }

    revalidatePath("/net-worth")
    revalidatePath(`/net-worth/assets/${assetId}`)
    revalidatePath("/", "layout")

    return { success: true }
  }

  export async function archiveAsset(id: string) {
    await requireApprovedUser()
    const scope = await getFinancialScope()
    const assetsColl = await getCollection<Asset>("assets")

    await assetsColl.updateOne(
      { _id: new ObjectId(id), ...getScopeFilter(scope) },
      { $set: { status: "archived", isArchived: true, updatedAt: new Date() } }
    )

    revalidatePath("/net-worth")
    revalidatePath("/", "layout")

    return { success: true }
  }

  export async function deleteAsset(id: string) {
    await requireApprovedUser()
    const scope = await getFinancialScope()

    const assetsColl = await getCollection<Asset>("assets")
    const valuationsColl = await getCollection<AssetValuation>("asset_valuations")

    await assetsColl.deleteOne({ _id: new ObjectId(id), ...getScopeFilter(scope) })
    await valuationsColl.deleteMany({ assetId: id })

    revalidatePath("/net-worth")
    revalidatePath("/", "layout")

    return { success: true }
  }
  ```

- [ ] **Step 2: Commit changes**
  ```bash
  git add lib/actions/assets.ts
  git commit -m "feat: add Server Actions for manual assets and valuations"
  ```

---

### Task 6: Create Dialogs & Forms Components

**Files:**
* Create: `components/net-worth/asset-dialog.tsx`
* Create: `components/net-worth/valuation-dialog.tsx`

- [ ] **Step 1: Create components/net-worth/asset-dialog.tsx**
  Implement the dialog form to create/edit manual assets and liabilities. Follow the shadcn rules:
  ```typescript
  "use client"

  import * as React from "react"
  import { useForm } from "react-hook-form"
  import { zodResolver } from "@hookform/resolvers/zod"
  import { z } from "zod"
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
  import { Button } from "@/components/ui/button"
  import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
  import { Input } from "@/components/ui/input"
  import { Textarea } from "@/components/ui/textarea"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { createAsset, updateAsset } from "@/lib/actions/assets"
  import { toast } from "sonner"
  import { Asset } from "@/types"

  const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    kind: z.enum(["asset", "liability"]),
    category: z.string().min(1, "Category is required"),
    currency: z.string().length(3, "Currency code must be 3 letters"),
    currentValue: z.string().min(1, "Initial value is required"),
    valuationMethod: z.enum(["manual", "market", "calculated"]),
    ownershipPercentage: z.coerce.number().min(0).max(100).default(100),
    acquiredAt: z.string().optional(),
    notes: z.string().optional()
  })

  interface AssetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    asset?: Asset | null
  }

  export function AssetDialog({ open, onOpenChange, asset }: AssetDialogProps) {
    const isEdit = !!asset
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: "",
        kind: "asset",
        category: "real_estate",
        currency: "USD",
        currentValue: "",
        valuationMethod: "manual",
        ownershipPercentage: 100,
        acquiredAt: new Date().toISOString().split("T")[0],
        notes: ""
      }
    })

    React.useEffect(() => {
      if (asset) {
        form.reset({
          name: asset.name,
          kind: asset.kind,
          category: asset.category,
          currency: asset.currency,
          currentValue: (asset.currentValue / 100).toString(),
          valuationMethod: asset.valuationMethod,
          ownershipPercentage: asset.ownershipPercentage,
          acquiredAt: asset.acquiredAt ? new Date(asset.acquiredAt).toISOString().split("T")[0] : "",
          notes: asset.notes || ""
        })
      } else {
        form.reset({
          name: "",
          kind: "asset",
          category: "real_estate",
          currency: "USD",
          currentValue: "",
          valuationMethod: "manual",
          ownershipPercentage: 100,
          acquiredAt: new Date().toISOString().split("T")[0],
          notes: ""
        })
      }
    }, [asset, open, form])

    const kind = form.watch("kind")

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
      const numericVal = Math.round(parseFloat(values.currentValue) * 100)
      if (isNaN(numericVal)) {
        toast.error("Please enter a valid numeric value.")
        return
      }

      const payload = {
        ...values,
        currentValue: numericVal,
        category: values.category as any,
        acquiredAt: values.acquiredAt || undefined
      }

      try {
        if (isEdit && asset) {
          const res = await updateAsset(asset._id.toString(), payload)
          if (res.success) {
            toast.success("Asset updated successfully")
            onOpenChange(false)
          }
        } else {
          const res = await createAsset(payload)
          if (res.success) {
            toast.success("Asset created successfully")
            onOpenChange(false)
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Something went wrong")
      }
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Asset or Liability" : "Add Asset or Liability"}</DialogTitle>
            <DialogDescription>
              Create a manual entry to track properties, vehicles, loans, or other valuations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input placeholder="e.g. My Apartment" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-rose-500 mt-1">{form.formState.errors.name.message}</p>
                )}
              </Field>
              <Field>
                <FieldLabel>Kind</FieldLabel>
                <Select
                  value={form.watch("kind")}
                  onValueChange={(val) => form.setValue("kind", val as any)}
                  disabled={isEdit}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select
                  value={form.watch("category")}
                  onValueChange={(val) => form.setValue("category", val)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {kind === "asset" ? (
                      <>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                        <SelectItem value="vehicle">Vehicle</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="other">Other Asset</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="mortgage">Mortgage</SelectItem>
                        <SelectItem value="student_loan">Student Loan</SelectItem>
                        <SelectItem value="auto_loan">Auto Loan</SelectItem>
                        <SelectItem value="personal_loan">Personal Loan</SelectItem>
                        <SelectItem value="credit_card">Credit Card Debt</SelectItem>
                        <SelectItem value="other">Other Liability</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Currency</FieldLabel>
                <Input placeholder="USD" {...form.register("currency")} disabled={isEdit} />
                {form.formState.errors.currency && (
                  <p className="text-xs text-rose-500 mt-1">{form.formState.errors.currency.message}</p>
                )}
              </Field>
            </FieldGroup>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>{isEdit ? "Current Value" : "Initial Value"}</FieldLabel>
                <Input placeholder="0.00" type="number" step="any" {...form.register("currentValue")} disabled={isEdit} />
                {form.formState.errors.currentValue && (
                  <p className="text-xs text-rose-500 mt-1">{form.formState.errors.currentValue.message}</p>
                )}
              </Field>
              <Field>
                <FieldLabel>Valuation Method</FieldLabel>
                <Select
                  value={form.watch("valuationMethod")}
                  onValueChange={(val) => form.setValue("valuationMethod", val as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="calculated">Calculated</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Ownership Share (%)</FieldLabel>
                <Input type="number" {...form.register("ownershipPercentage")} />
              </Field>
              <Field>
                <FieldLabel>Acquisition Date</FieldLabel>
                <Input type="date" {...form.register("acquiredAt")} />
              </Field>
            </FieldGroup>

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea placeholder="Add description, serial numbers, etc." {...form.register("notes")} />
            </Field>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
  ```

- [ ] **Step 2: Create components/net-worth/valuation-dialog.tsx**
  Implement the dialog form to log new point-in-time manual valuations:
  ```typescript
  "use client"

  import * as React from "react"
  import { useForm } from "react-hook-form"
  import { zodResolver } from "@hookform/resolvers/zod"
  import { z } from "zod"
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
  import { Button } from "@/components/ui/button"
  import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
  import { Input } from "@/components/ui/input"
  import { addAssetValuation } from "@/lib/actions/assets"
  import { toast } from "sonner"

  const valSchema = z.object({
    value: z.string().min(1, "Value is required"),
    date: z.string().min(1, "Date is required"),
    notes: z.string().optional()
  })

  interface ValuationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    assetId: string
    assetName: string
    currency: string
  }

  export function ValuationDialog({ open, onOpenChange, assetId, assetName, currency }: ValuationDialogProps) {
    const form = useForm<z.infer<typeof valSchema>>({
      resolver: zodResolver(valSchema),
      defaultValues: {
        value: "",
        date: new Date().toISOString().split("T")[0],
        notes: ""
      }
    })

    React.useEffect(() => {
      form.reset({
        value: "",
        date: new Date().toISOString().split("T")[0],
        notes: ""
      })
    }, [open, form])

    const onSubmit = async (values: z.infer<typeof valSchema>) => {
      const numericVal = Math.round(parseFloat(values.value) * 100)
      if (isNaN(numericVal)) {
        toast.error("Please enter a valid numeric value.")
        return
      }

      try {
        const res = await addAssetValuation(assetId, {
          date: values.date,
          value: numericVal,
          notes: values.notes || undefined
        })

        if (res.success) {
          toast.success("New valuation logged successfully")
          onOpenChange(false)
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to log valuation")
      }
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Log Valuation</DialogTitle>
            <DialogDescription>
              Record a new point-in-time value for **{assetName}** ({currency}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <Field>
              <FieldLabel>New Value ({currency})</FieldLabel>
              <Input type="number" step="any" placeholder="0.00" {...form.register("value")} />
              {form.formState.errors.value && (
                <p className="text-xs text-rose-500 mt-1">{form.formState.errors.value.message}</p>
              )}
            </Field>

            <Field>
              <FieldLabel>Valuation Date</FieldLabel>
              <Input type="date" {...form.register("date")} />
              {form.formState.errors.date && (
                <p className="text-xs text-rose-500 mt-1">{form.formState.errors.date.message}</p>
              )}
            </Field>

            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Input placeholder="e.g. Monthly update, home appraisal" {...form.register("notes")} />
            </Field>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
  ```

- [ ] **Step 3: Commit changes**
  ```bash
  git add components/net-worth/asset-dialog.tsx components/net-worth/valuation-dialog.tsx
  git commit -m "feat: add Asset and Valuation dialog modals"
  ```

---

### Task 7: Create Asset Management List Tab Component

**Files:**
* Create: `components/net-worth/asset-list.tsx`

- [ ] **Step 1: Write components/net-worth/asset-list.tsx**
  Implement the interactive Assets & Liabilities list with filters, table formatting, and quick action options:
  ```typescript
  "use client"

  import * as React from "react"
  import Link from "next/link"
  import { Asset } from "@/types"
  import { formatCurrency, formatDate } from "@/lib/utils"
  import { Button } from "@/components/ui/button"
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
  import { Input } from "@/components/ui/input"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { MoreHorizontal, Plus, Trash, Archive, Calendar, Edit, ArrowUpRight } from "lucide-react"
  import { AssetDialog } from "./asset-dialog"
  import { ValuationDialog } from "./valuation-dialog"
  import { archiveAsset, deleteAsset } from "@/lib/actions/assets"
  import { toast } from "sonner"

  interface AssetListProps {
    assets: Asset[]
    baseCurrency: string
  }

  export function AssetList({ assets, baseCurrency }: AssetListProps) {
    const [search, setSearch] = React.useState("")
    const [kindFilter, setKindFilter] = React.useState<"all" | "asset" | "liability">("all")
    const [categoryFilter, setCategoryFilter] = React.useState("all")

    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [activeAsset, setActiveAsset] = React.useState<Asset | null>(null)

    const [valOpen, setValOpen] = React.useState(false)
    const [valAsset, setValAsset] = React.useState<Asset | null>(null)

    // Filtering logic
    const filtered = React.useMemo(() => {
      return assets.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase())
        const matchesKind = kindFilter === "all" || a.kind === kindFilter
        const matchesCategory = categoryFilter === "all" || a.category === categoryFilter
        return matchesSearch && matchesKind && matchesCategory
      })
    }, [assets, search, kindFilter, categoryFilter])

    const handleEdit = (asset: Asset) => {
      setActiveAsset(asset)
      setDialogOpen(true)
    }

    const handleLogValuation = (asset: Asset) => {
      setValAsset(asset)
      setValOpen(true)
    }

    const handleArchive = async (id: string) => {
      if (confirm("Are you sure you want to archive this asset?")) {
        await archiveAsset(id)
        toast.success("Asset archived successfully")
      }
    }

    const handleDelete = async (id: string) => {
      if (confirm("Are you sure you want to permanently delete this asset and all its valuation history?")) {
        await deleteAsset(id)
        toast.success("Asset deleted successfully")
      }
    }

    const formatCatName = (cat: string) => {
      return cat.replace("_", " ").toUpperCase()
    }

    return (
      <div className="space-y-4">
        {/* Filters and Add Actions */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-1 flex-wrap gap-2">
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={kindFilter} onValueChange={(val: any) => setKindFilter(val)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Kind" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Kinds</SelectItem>
                <SelectItem value="asset">Assets</SelectItem>
                <SelectItem value="liability">Liabilities</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="real_estate">Real Estate</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mortgage">Mortgage</SelectItem>
                <SelectItem value="student_loan">Student Loan</SelectItem>
                <SelectItem value="auto_loan">Auto Loan</SelectItem>
                <SelectItem value="personal_loan">Personal Loan</SelectItem>
                <SelectItem value="credit_card">Credit Card Debt</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { setActiveAsset(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Asset/Liability
          </Button>
        </div>

        {/* Assets List Table */}
        <div className="border border-border/40 rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead>Acquired At</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No manual assets or liabilities found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item._id.toString()} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <Link href={`/net-worth/assets/${item._id.toString()}`} className="hover:underline flex items-center gap-1.5">
                        {item.name}
                        <ArrowUpRight className="size-3.5 text-muted-foreground/60" />
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize text-xs font-medium text-muted-foreground">{item.kind}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground/80">{formatCatName(item.category)}</TableCell>
                    <TableCell className="text-xs font-mono">{item.ownershipPercentage}%</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.acquiredAt ? formatDate(item.acquiredAt) : "N/A"}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm">
                      {formatCurrency(item.currentValue, item.currency)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleLogValuation(item)} className="cursor-pointer">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" /> Log Valuation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(item)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleArchive(item._id.toString())} className="cursor-pointer">
                            <Archive className="mr-2 h-4 w-4 text-muted-foreground" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(item._id.toString())} className="cursor-pointer text-rose-600 focus:text-rose-600">
                            <Trash className="mr-2 h-4 w-4 text-rose-500" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialog Forms */}
        <AssetDialog open={dialogOpen} onOpenChange={setDialogOpen} asset={activeAsset} />
        {valAsset && (
          <ValuationDialog
            open={valOpen}
            onOpenChange={setValOpen}
            assetId={valAsset._id.toString()}
            assetName={valAsset.name}
            currency={valAsset.currency}
          />
        )}
      </div>
    )
  }
  ```

- [ ] **Step 2: Commit changes**
  ```bash
  git add components/net-worth/asset-list.tsx
  git commit -m "feat: add interactive AssetList component"
  ```

---

### Task 8: Create Net Worth Overview Analytics Component

**Files:**
* Create: `components/net-worth/net-worth-overview.tsx`

- [ ] **Step 1: Write components/net-worth/net-worth-overview.tsx**
  Implement the Overview tab displaying historical trend and allocations using Recharts Area and Pie/Donut charts:
  ```typescript
  "use client"

  import * as React from "react"
  import { Area, AreaChart, CartesianGrid, XAxis, PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
  import { HistoricalNetWorthPoint, NetWorthBreakdown } from "@/lib/net-worth/types"
  import { formatCurrency } from "@/lib/utils"
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
  import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

  interface NetWorthOverviewProps {
    history: HistoricalNetWorthPoint[]
    currentBreakdown: NetWorthBreakdown
    currency: string
  }

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#6366f1"];

  export function NetWorthOverview({ history, currentBreakdown, currency }: NetWorthOverviewProps) {
    const [timeframe, setTimeframe] = React.useState("6m")

    const filteredHistory = React.useMemo(() => {
      let count = 6;
      if (timeframe === "3m") count = 3;
      else if (timeframe === "12m") count = 12;
      return history.slice(-count);
    }, [history, timeframe])

    // Convert Breakdown values into Recharts Donut data format
    const assetChartData = React.useMemo(() => {
      const b = currentBreakdown.assetsBreakdown;
      return [
        { name: "Cash", value: b.cash / 100 },
        { name: "Bank Accounts", value: b.bank / 100 },
        { name: "Investments", value: b.investments / 100 },
        { name: "Loans Lent", value: b.loans / 100 },
        { name: "Manual Assets", value: b.manualAssets / 100 }
      ].filter(item => item.value > 0);
    }, [currentBreakdown])

    const liabilityChartData = React.useMemo(() => {
      const b = currentBreakdown.liabilitiesBreakdown;
      return [
        { name: "Credit Cards", value: b.creditCards / 100 },
        { name: "Loans Borrowed", value: b.loans / 100 },
        { name: "Manual Liabilities", value: b.manualLiabilities / 100 }
      ].filter(item => item.value > 0);
    }, [currentBreakdown])

    const chartConfig = {
      netWorth: { label: "Net Worth", color: "var(--chart-1)" },
      assets: { label: "Total Assets", color: "var(--chart-2)" },
      liabilities: { label: "Total Liabilities", color: "var(--chart-3)" }
    };

    return (
      <div className="space-y-6">
        {/* Historical Timeline Chart */}
        <Card className="border border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Net Worth History</CardTitle>
              <CardDescription>Visual history of net worth, assets, and liabilities</CardDescription>
            </div>
            <Tabs value={timeframe} onValueChange={setTimeframe} className="w-auto">
              <TabsList className="grid grid-cols-3 w-48 h-8 rounded-lg">
                <TabsTrigger value="3m" className="text-xs py-1 rounded-md">3M</TabsTrigger>
                <TabsTrigger value="6m" className="text-xs py-1 rounded-md">6M</TabsTrigger>
                <TabsTrigger value="12m" className="text-xs py-1 rounded-md">12M</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            {filteredHistory.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={filteredHistory.map(h => ({
                  ...h,
                  netWorthVal: h.netWorth / 100,
                  assetsVal: h.totalAssets / 100,
                  liabilitiesVal: h.totalLiabilities / 100
                }))}>
                  <defs>
                    <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="dateStr" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        formatter={(val, name) => (
                          <div className="flex flex-row justify-between w-full min-w-36 leading-none">
                            <span className="text-muted-foreground capitalize">{name}:</span>
                            <span className="font-mono font-bold text-foreground ml-2">
                              {formatCurrency(Number(val) * 100, currency)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Area dataKey="assetsVal" name="Total Assets" type="monotone" fill="transparent" stroke="var(--chart-2)" strokeWidth={1.5} />
                  <Area dataKey="liabilitiesVal" name="Total Liabilities" type="monotone" fill="transparent" stroke="var(--chart-3)" strokeWidth={1.5} />
                  <Area dataKey="netWorthVal" name="Net Worth" type="monotone" fill="url(#netWorthGrad)" stroke="var(--chart-1)" strokeWidth={2.5} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No historical data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allocation Breakdowns & Currency */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Allocation */}
          <Card className="border border-border/40 shadow-sm lg:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Asset Allocation</CardTitle>
              <CardDescription className="text-xs">Distribution of your assets</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center h-64 relative">
              {assetChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {assetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value) * 100, currency)} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground text-xs">No assets recorded.</div>
              )}
            </CardContent>
          </Card>

          {/* Liability Allocation */}
          <Card className="border border-border/40 shadow-sm lg:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Liability Allocation</CardTitle>
              <CardDescription className="text-xs">Distribution of your liabilities</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center h-64 relative">
              {liabilityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={liabilityChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {liabilityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value) * 100, currency)} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground text-xs">No liabilities recorded.</div>
              )}
            </CardContent>
          </Card>

          {/* Currency Distribution */}
          <Card className="border border-border/40 shadow-sm lg:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Currency Breakdown</CardTitle>
              <CardDescription className="text-xs">Distribution by currency</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-64">
              <div className="space-y-3">
                {Object.entries(currentBreakdown.currencyBreakdown).map(([curr, breakd]) => (
                  <div key={curr} className="flex justify-between items-center text-xs border-b border-border/20 pb-2">
                    <span className="font-bold text-foreground">{curr}</span>
                    <div className="text-right">
                      <div className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(breakd.assets, curr)}
                      </div>
                      <div className="font-semibold font-mono text-rose-600 dark:text-rose-400">
                        -{formatCurrency(breakd.liabilities, curr)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Commit changes**
  ```bash
  git add components/net-worth/net-worth-overview.tsx
  git commit -m "feat: add NetWorthOverview analytics view with charts"
  ```

---

### Task 9: Assemble Dashboard Page Layout

**Files:**
* Create: `app/(dashboard)/net-worth/page.tsx`
* Modify: `components/layout/dashboard-sidebar.tsx:64-75`

- [ ] **Step 1: Write app/(dashboard)/net-worth/page.tsx**
  Implement the main page combining DB fetches, currency converter initialization, calculations engine execution, metric summary rendering, and Tabs coordination:
  ```typescript
  import { Suspense } from "react"
  import { requireApprovedUser } from "@/lib/auth-guard"
  import { getAssetsAndValuationsForScope } from "@/lib/queries/assets"
  import { getWallets } from "@/lib/queries/wallets"
  import { getLoans, getLoanRepayments } from "@/lib/queries/loans"
  import { getCollection } from "@/lib/db/collections"
  import { Transaction } from "@/types"
  import { getScopeFilter, getFinancialScope } from "@/lib/scope"
  import { getPreferences } from "@/lib/queries/preferences"
  import { getCurrencyConverter } from "@/lib/currency"
  import { formatCurrency, serializeData } from "@/lib/utils"
  import { calculateCurrentNetWorth, calculateNetWorthHistory } from "@/lib/net-worth/calculations"
  import { NetWorthOverview } from "@/components/net-worth/net-worth-overview"
  import { AssetList } from "@/components/net-worth/asset-list"
  import { MetricCard } from "@/components/ui/metric-card"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
  import { Landmark, ArrowUp, ArrowDown, TrendingUp, Sparkles } from "lucide-react"
  import { subMonths, endOfMonth } from "date-fns"

  async function NetWorthDashboardContent() {
    const session = await requireApprovedUser()
    const scope = await getFinancialScope()
    const filter = getScopeFilter(scope)

    const [
      { assets, valuations },
      wallets,
      loans,
      prefs
    ] = await Promise.all([
      getAssetsAndValuationsForScope(),
      getWallets(session.user.id),
      getLoans(),
      getPreferences(session.user.id)
    ])

    const targetCurrency = prefs.defaultCurrency || "USD"

    // Fetch related loan repayments
    const loanIds = loans.map(l => l._id.toString())
    const repaymentsColl = await getCollection<any>("loan_repayments")
    const repayments = loanIds.length > 0 
      ? await repaymentsColl.find({ loanId: { $in: loanIds } }).toArray()
      : []

    // Fetch transactions occurring after the oldest timeline date (12 months ago)
    const transactionsColl = await getCollection<Transaction>("transactions")
    const twelveMonthsAgo = subMonths(new Date(), 12)
    const transactions = await transactionsColl.find({
      ...filter,
      date: { $gte: twelveMonthsAgo }
    }).toArray()

    // Determine source currencies for pre-fetching exchange rates
    const sourceCurrencies = Array.from(new Set([
      ...wallets.map(w => w.currency),
      ...loans.map(l => l.currency),
      ...assets.map(a => a.currency),
      targetCurrency
    ]))

    const convert = await getCurrencyConverter(targetCurrency, sourceCurrencies)

    // Calculate current aggregates
    const current = calculateCurrentNetWorth({
      wallets,
      loans,
      assets,
      convert
    })

    // Calculate historical aggregates (generate monthly points for last 12 months)
    const now = new Date()
    const dates: Date[] = []
    for (let i = 0; i < 12; i++) {
      // Last ms of the month
      const d = subMonths(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15)), i)
      dates.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)))
    }
    dates.sort((a, b) => a.getTime() - b.getTime())

    const history = calculateNetWorthHistory({
      wallets,
      transactions,
      loans,
      repayments,
      assets,
      valuations,
      convert,
      dates
    })

    // Calculate monthly growth rate
    let monthlyGrowthStr = "0.0%"
    let growthValue = 0
    if (history.length >= 2) {
      const prev = history[history.length - 2].netWorth
      const curr = current.netWorth
      growthValue = curr - prev
      const pct = prev > 0 ? (growthValue / prev) * 100 : 0
      monthlyGrowthStr = `${growthValue >= 0 ? "+" : ""}${pct.toFixed(1)}%`
    }

    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Title */}
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-sm shrink-0">
            <Landmark className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Net Worth</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Complete dynamic picture of your assets, liabilities, and financial health.
            </p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex flex-wrap gap-4">
          <MetricCard
            style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
            icon={Landmark}
            color="#8b5cf6"
            label="Net Worth"
            value={formatCurrency(current.netWorth, targetCurrency)}
          />
          <MetricCard
            style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
            icon={ArrowUp}
            color="#10b981"
            label="Total Assets"
            value={formatCurrency(current.totalAssets, targetCurrency)}
          />
          <MetricCard
            style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
            icon={ArrowDown}
            color="#f43f5e"
            label="Total Liabilities"
            value={formatCurrency(current.totalLiabilities, targetCurrency)}
          />
          <MetricCard
            style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
            icon={TrendingUp}
            color={growthValue >= 0 ? "#10b981" : "#f43f5e"}
            label="Monthly Growth"
            value={`${formatCurrency(Math.abs(growthValue), targetCurrency)} (${monthlyGrowthStr})`}
            valueClassName={growthValue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
          />
        </div>

        {/* Tabs section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted border border-border/30 h-10 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-1.5 text-sm font-semibold">Overview</TabsTrigger>
            <TabsTrigger value="assets" className="rounded-lg px-4 py-1.5 text-sm font-semibold">Assets & Liabilities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <NetWorthOverview history={history} currentBreakdown={current} currency={targetCurrency} />
          </TabsContent>
          
          <TabsContent value="assets">
            <AssetList assets={serializeData(assets)} baseCurrency={targetCurrency} />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  export default function NetWorthPage() {
    return (
      <Suspense fallback={
        <div className="flex flex-col gap-6 w-full animate-pulse">
          <div className="h-14 w-64 bg-muted rounded-2xl" />
          <div className="grid grid-cols-4 gap-4 h-[90px]" />
          <div className="h-[380px] bg-muted rounded-2xl" />
        </div>
      }>
        <NetWorthDashboardContent />
      </Suspense>
    )
  }
  ```

- [ ] **Step 2: Add Net Worth navigation to components/layout/dashboard-sidebar.tsx**
  Locate `NAV_ITEMS` in `components/layout/dashboard-sidebar.tsx` around lines 64-75 and insert Net Worth as the second item (below Overview):
  ```typescript
  const NAV_ITEMS = [
    { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { title: "Net Worth", href: "/net-worth", icon: Landmark }, // Add this!
    { title: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { title: "Wallets", href: "/wallets", icon: Wallet },
    // ... existing items ...
  ]
  ```
  Ensure `Landmark` is imported from `"lucide-react"`:
  ```typescript
  import {
    LayoutDashboard,
    ArrowLeftRight,
    Wallet,
    PiggyBank,
    Target,
    Repeat,
    BarChart3,
    Tags,
    Cog,
    Shield,
    LogOut,
    ChevronsUpDown,
    HandCoins,
    Users,
    Landmark, // Add this!
  } from "lucide-react"
  ```

- [ ] **Step 3: Commit changes**
  ```bash
  git add app/(dashboard)/net-worth/page.tsx components/layout/dashboard-sidebar.tsx
  git commit -m "feat: assemble Net Worth dashboard page and link to sidebar"
  ```

---

### Task 10: Create Asset Detail Page and Detail Client Components

**Files:**
* Create: `app/(dashboard)/net-worth/assets/[id]/page.tsx`
* Create: `components/net-worth/asset-detail-client.tsx`

- [ ] **Step 1: Write components/net-worth/asset-detail-client.tsx**
  Implement all interactive components for the detail page including the asset valuation timeline chart, the past valuations table, and management actions (archive/delete):
  ```typescript
  "use client"

  import * as React from "react"
  import { Line, LineChart, CartesianGrid, XAxis, Tooltip } from "recharts"
  import { Asset, AssetValuation } from "@/types"
  import { formatCurrency, formatDate } from "@/lib/utils"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
  import { ValuationDialog } from "./valuation-dialog"
  import { deleteAssetValuation, archiveAsset, deleteAsset } from "@/lib/actions/assets"
  import { toast } from "sonner"
  import { useRouter } from "next/navigation"
  import { Calendar, Trash, Archive, ShieldAlert, Sparkles, Files, Layers } from "lucide-react"

  interface AssetDetailClientProps {
    asset: Asset
    valuations: AssetValuation[]
  }

  export function AssetDetailClient({ asset, valuations }: AssetDetailClientProps) {
    const router = useRouter()
    const [valOpen, setValOpen] = React.useState(false)

    const chartData = React.useMemo(() => {
      return [...valuations]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(v => ({
          dateStr: new Date(v.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: v.value / 100
        }))
    }, [valuations])

    const handleDeleteValuation = async (id: string) => {
      if (confirm("Are you sure you want to delete this valuation record?")) {
        await deleteAssetValuation(id, asset._id.toString())
        toast.success("Valuation deleted")
      }
    }

    const handleArchive = async () => {
      if (confirm("Are you sure you want to archive this asset?")) {
        await archiveAsset(asset._id.toString())
        toast.success("Asset archived successfully")
        router.push("/net-worth")
      }
    }

    const handleDelete = async () => {
      if (confirm("Are you sure you want to permanently delete this asset and all its valuation history?")) {
        await deleteAsset(asset._id.toString())
        toast.success("Asset deleted successfully")
        router.push("/net-worth")
      }
    }

    const chartConfig = {
      val: { label: "Value", color: "var(--chart-1)" }
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Details (Left Side) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-border/40 shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
              <CardDescription>Overview properties of this financial entity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground font-semibold">Kind</span>
                <span className="capitalize font-bold text-foreground">{asset.kind}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground font-semibold">Category</span>
                <span className="uppercase font-mono text-foreground font-bold">{asset.category.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground font-semibold">Valuation Method</span>
                <span className="capitalize text-foreground font-bold">{asset.valuationMethod}</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground font-semibold">Ownership Share</span>
                <span className="font-bold font-mono text-foreground">{asset.ownershipPercentage}%</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground font-semibold">Acquisition Date</span>
                <span className="font-bold text-foreground">
                  {asset.acquiredAt ? formatDate(asset.acquiredAt) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-muted-foreground font-semibold">Status</span>
                <span className="capitalize font-bold text-foreground">{asset.status}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card className="border border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                {asset.notes || "No notes logged for this asset."}
              </p>
            </CardContent>
          </Card>

          {/* reserved slots for future capabilities */}
          <Card className="border border-border/20 bg-muted/20 opacity-70">
            <CardHeader className="py-3.5 pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5"><Layers className="size-3.5" /> Extensible Features</CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-muted-foreground space-y-1.5 py-1.5 pt-0">
              <div className="flex items-center gap-1"><Files className="size-3" /> Attachments (Coming Soon)</div>
              <div className="flex items-center gap-1"><Sparkles className="size-3" /> AI Performance Analytics (Coming Soon)</div>
            </CardContent>
          </Card>
        </div>

        {/* Valuation History & Chart (Right Side) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Individual Value Chart */}
          <Card className="border border-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Valuation History</CardTitle>
                <CardDescription>Value changes recorded over time</CardDescription>
              </div>
              <Button size="sm" onClick={() => setDialogOpen => setValOpen(true)}>
                <Calendar className="mr-2 h-4 w-4" /> Log Valuation
              </Button>
            </CardHeader>
            <CardContent className="h-[240px] w-full pt-4">
              {chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="dateStr" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="line"
                          formatter={(val) => (
                            <span className="font-mono font-bold text-foreground">
                              {formatCurrency(Number(val) * 100, asset.currency)}
                            </span>
                          )}
                        />
                      }
                    />
                    <Line
                      dataKey="value"
                      name="Value"
                      type="monotone"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No historical valuations logged.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historical Log Log Table */}
          <Card className="border border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle>Valuation Log</CardTitle>
              <CardDescription>Chronological list of all logged valuations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Valuation</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuations.map((v) => (
                    <TableRow key={v._id.toString()}>
                      <TableCell className="text-xs font-semibold">{formatDate(v.date)}</TableCell>
                      <TableCell className="capitalize text-xs text-muted-foreground">{v.source}</TableCell>
                      <TableCell className="text-xs text-foreground/80">{v.notes || "—"}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm">
                        {formatCurrency(v.value, asset.currency)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteValuation(v._id.toString())}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 rounded-lg"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-rose-200 dark:border-rose-950 bg-rose-50/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="size-4" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" onClick={handleArchive}>
                <Archive className="mr-2 size-4" /> Archive Asset
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="mr-2 size-4" /> Delete Asset
              </Button>
            </CardContent>
          </Card>
        </div>

        <ValuationDialog
          open={valOpen}
          onOpenChange={setValOpen}
          assetId={asset._id.toString()}
          assetName={asset.name}
          currency={asset.currency}
        />
      </div>
    )
  }
  ```

- [ ] **Step 2: Write app/(dashboard)/net-worth/assets/[id]/page.tsx**
  Implement the asset detail page loader, fetching data from the query layer, validating matching scope, and rendering the client details:
  ```typescript
  import { requireApprovedUser } from "@/lib/auth-guard"
  import { getAssetById, getAssetValuations } from "@/lib/queries/assets"
  import { notFound } from "next/navigation"
  import { serializeData } from "@/lib/utils"
  import { AssetDetailClient } from "@/components/net-worth/asset-detail-client"
  import { Button } from "@/components/ui/button"
  import Link from "next/link"
  import { ChevronLeft, Landmark } from "lucide-react"

  interface AssetDetailPageProps {
    params: Promise<{ id: string }>
  }

  export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
    const { id } = await params
    await requireApprovedUser()

    const asset = await getAssetById(id)
    if (!asset) {
      notFound()
    }

    const valuations = await getAssetValuations(id)

    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild className="rounded-xl">
              <Link href="/net-worth">
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{asset.name}</h1>
                <p className="text-xs text-muted-foreground">Asset & Liability Management</p>
              </div>
            </div>
          </div>
        </div>

        <AssetDetailClient
          asset={serializeData(asset)}
          valuations={serializeData(valuations)}
        />
      </div>
    )
  }
  ```

- [ ] **Step 3: Commit changes**
  ```bash
  git add components/net-worth/asset-detail-client.tsx app/(dashboard)/net-worth/assets/\[id\]/page.tsx
  git commit -m "feat: add dedicated asset details page and details client component"
  ```

---

### Task 11: Final Integration and Build Check

- [ ] **Step 1: Check lint and typescript compilation**
  Run: `npm run build`
  Expected: Success without errors.

- [ ] **Step 2: Commit verified builds**
  ```bash
  git commit -m "build: verify compilation of Net Worth Dashboard feature"
  ```
