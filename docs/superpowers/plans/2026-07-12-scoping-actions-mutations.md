# Scoping Actions & Mutations with Version Increments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Dime's server actions under `lib/actions/` to enforce unified Financial Scope, validate capability permissions in organization spaces, populate creation/update audit fields, increment document versions, and invalidate cache tags.

**Architecture:** Use `getFinancialScope` and `getScopeFilter` to restrict mutations to the active space. In organization spaces, query the `member` collection to fetch the user's role and validate the corresponding permission helpers (`canManageWallets`, `canCreateTransactions`, `canEditTransactions`, `canDeleteTransactions`, `canManageBudgets`).

**Tech Stack:** Next.js 16, React Server Actions, MongoDB, Zod, Tailwind CSS

---

### Task 1: Refactor Wallets Server Actions
**Files:**
- Modify: `lib/actions/wallets.ts`

- [ ] **Step 1: Update imports and helpers in wallets.ts**
  Import `db` from `@/lib/db/client`, `getFinancialScope` and `getScopeFilter` from `@/lib/scope`, permission helpers `canManageWallets` and type `Role` from `@/lib/permissions`, and `updateTag` from `next/cache`.

- [ ] **Step 2: Refactor `createWallet` action**
  Fetch scope and check permissions. If in org scope, query member collection for the user's role and assert `canManageWallets(role)`. On insert, set `organizationId`, `userId` (legacy), `ownerUserId`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, and `version: 1`. Also propagate these scope/audit fields to the system-generated initial balance transaction if created.
  Invalidate using `updateTag("wallets")`.

- [ ] **Step 3: Refactor `updateWallet` action**
  Fetch scope and check permissions. Query existing wallet using `_id: walletOid` and `getScopeFilter(scope)`. When updating, set `updatedBy`, `updatedAt`, and `$inc: { version: 1 }`. Ensure the update query also uses the scope filter. On balance adjustment, populate the generated transaction with creation audit fields and org scope.
  Invalidate using `updateTag("wallets")`.

- [ ] **Step 4: Refactor `toggleArchiveWallet` action**
  Fetch scope and check permissions. Query existing and update using `_id: walletOid` and `getScopeFilter(scope)`. Set `updatedBy`, `updatedAt`, and `$inc: { version: 1 }`.
  Invalidate using `updateTag("wallets")`.

- [ ] **Step 5: Refactor `deleteWallet` action**
  Fetch scope and check permissions. Ensure delete and transactions cleanup use `getScopeFilter(scope)` to isolate deletes.
  Invalidate using `updateTag("wallets")`.

- [ ] **Step 6: Refactor `shareWalletAction` and `unshareWalletAction`**
  Fetch scope and check permissions. Ensure query and updates use `getScopeFilter(scope)` and update `updatedBy`, `updatedAt`, and `$inc: { version: 1 }`.
  Invalidate using `updateTag("wallets")`.

---

### Task 2: Refactor Transactions Server Actions
**Files:**
- Modify: `lib/actions/transactions.ts`

- [ ] **Step 1: Update imports and helpers in transactions.ts**
  Import `db` from `@/lib/db/client`, `getFinancialScope` and `getScopeFilter` from `@/lib/scope`, permission helpers `canCreateTransactions`, `canEditTransactions`, `canDeleteTransactions` and type `Role` from `@/lib/permissions`, and `updateTag` from `next/cache`.
  Modify `updateWalletBalance` to receive `scope` and update the wallet within the scope filter, setting `updatedBy`, `updatedAt` and `$inc: { version: 1 }`.

- [ ] **Step 2: Refactor `createTransaction` action**
  Fetch scope and check permissions (`canCreateTransactions(role)`). Ensure wallets (source/target) are fetched using scope filter. On insert (normal and transfer debit/credit), set `organizationId`, `userId` (legacy), `ownerUserId`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, and `version: 1`. Call modified `updateWalletBalance` with scope.
  Invalidate using `updateTag("transactions")` and `updateTag("wallets")`.

- [ ] **Step 3: Refactor `deleteTransaction` action**
  Fetch scope and check permissions (`canDeleteTransactions(role)`). Query transaction using scope filter. Delete transaction and revert wallet balances within the scope filter.
  Invalidate using `updateTag("transactions")` and `updateTag("wallets")`.

- [ ] **Step 4: Refactor `updateTransaction` action**
  Fetch scope and check permissions (`canEditTransactions(role)`). Verify transaction existence with scope filter before calling delete and create.

- [ ] **Step 5: Refactor `getTransactionWalletId` action**
  Fetch scope. Query transaction using scope filter.

- [ ] **Step 6: Refactor `importTransactionsAction`**
  Fetch scope and check permissions (`canCreateTransactions(role)`). Verify wallet exists with scope filter. Match categories within scope filter or default categories. Build imported transactions list populating creation audit/scope fields. Call updateWalletBalance with scope.
  Invalidate using `updateTag("transactions")` and `updateTag("wallets")`.

---

### Task 3: Refactor Budgets Server Actions
**Files:**
- Modify: `lib/actions/budgets.ts`

- [ ] **Step 1: Update imports in budgets.ts**
  Import `db`, `getFinancialScope`, `getScopeFilter`, `canManageBudgets`, `Role`, and `updateTag`.

- [ ] **Step 2: Refactor `createBudget` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). On insert, set `organizationId`, `userId`, `ownerUserId`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, and `version: 1`.
  Invalidate using `updateTag("budgets")`.

- [ ] **Step 3: Refactor `updateBudget` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Query and update existing using scope filter. Set `updatedBy`, `updatedAt`, and `$inc: { version: 1 }`.
  Invalidate using `updateTag("budgets")`.

- [ ] **Step 4: Refactor `deleteBudget` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Delete using scope filter.
  Invalidate using `updateTag("budgets")`.

---

### Task 4: Refactor Recurring Rules Server Actions
**Files:**
- Modify: `lib/actions/recurring.ts`

- [ ] **Step 1: Update imports in recurring.ts**
  Import `db`, `getFinancialScope`, `getScopeFilter`, `canManageBudgets`, `Role`, and `updateTag`.

- [ ] **Step 2: Refactor `createRecurringRule` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). On insert, set `organizationId`, `userId`, `ownerUserId`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, and `version: 1`.
  Invalidate using `updateTag("recurring_rules")`.

- [ ] **Step 3: Refactor `updateRecurringRule` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Query and update existing using scope filter. Set `updatedBy`, `updatedAt`, and `$inc: { version: 1 }`.
  Invalidate using `updateTag("recurring_rules")`.

- [ ] **Step 4: Refactor `deleteRecurringRule` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Delete using scope filter.
  Invalidate using `updateTag("recurring_rules")`.

- [ ] **Step 5: Refactor `processRecurringRuleNow` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Query rule using scope filter. Update rule using scope filter and set `updatedBy`, `updatedAt`, and `$inc: { version: 1 }`.
  Invalidate using `updateTag("recurring_rules")`.

- [ ] **Step 6: Refactor `toggleRecurringRuleActive` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Query and update existing using scope filter. Set `updatedBy`, `updatedAt`, and `$inc: { version: 1 }`.
  Invalidate using `updateTag("recurring_rules")`.

---

### Task 5: Refactor Goals Server Actions
**Files:**
- Modify: `lib/actions/goals.ts`

- [ ] **Step 1: Update imports and helpers in goals.ts**
  Import `db`, `getFinancialScope`, `getScopeFilter`, `canManageBudgets`, `Role`, and `updateTag`.
  Modify `updateWalletBalance` to receive `scope` and update the wallet within the scope filter, setting `updatedBy`, `updatedAt` and `$inc: { version: 1 }`.

- [ ] **Step 2: Refactor `createGoal` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). On insert, set `organizationId`, `userId`, `ownerUserId`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, and `version: 1`.
  Invalidate using `updateTag("goals")`.

- [ ] **Step 3: Refactor `updateGoal` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Query and update existing using scope filter. Set `updatedBy`, `updatedAt`, and `$inc: { version: 1 }`.
  Invalidate using `updateTag("goals")`.

- [ ] **Step 4: Refactor `deleteGoal` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Delete using scope filter.
  Invalidate using `updateTag("goals")`.

- [ ] **Step 5: Refactor `contributeToGoal` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Query goal and wallet using scope filter. Match category using scope filter or system defaults. Set `organizationId`, `userId`, `ownerUserId`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, and `version: 1` on the transaction. Update wallet using `updateWalletBalance(scope, ...)`. Update goal currentAmount and version using scope filter and `$inc: { currentAmount: amount, version: 1 }`.
  Invalidate using `updateTag("goals")`, `updateTag("transactions")`, and `updateTag("wallets")`.

---

### Task 6: Refactor Categories Server Actions
**Files:**
- Modify: `lib/actions/categories.ts`

- [ ] **Step 1: Update imports in categories.ts**
  Import `db`, `getFinancialScope`, `getScopeFilter`, `canManageBudgets`, `Role`, and `updateTag`.

- [ ] **Step 2: Refactor `createCategory` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). On insert, set `organizationId`, `userId`, `ownerUserId`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`, and `version: 1`.
  Invalidate using `updateTag("categories")`.

- [ ] **Step 3: Refactor `updateCategory` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Query and update existing using scope filter. Set `updatedBy`, `updatedAt`, and `$inc: { version: 1 }`.
  Invalidate using `updateTag("categories")`.

- [ ] **Step 4: Refactor `deleteCategory` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Delete using scope filter.
  Invalidate using `updateTag("categories")`.

- [ ] **Step 5: Refactor `mergeCategory` action**
  Fetch scope and check permissions (`canManageBudgets(role)`). Verify source category exists and belongs to the current scope. Verify target category exists and is in the current scope or is system-default. Update all affected transactions in the transaction collection using scope filter, set `categoryId: targetId`, `updatedBy`, `updatedAt`, and `$inc: { version: 1 }`. Delete source category within scope filter.
  Invalidate using `updateTag("categories")` and `updateTag("transactions")`.

- [ ] **Step 6: Refactor `getAffectedTransactionCount` action**
  Fetch scope. Query transaction collection count using categoryId and scope filter.

---

### Task 7: Verification & Testing
**Files:**
- None (Command Execution)

- [ ] **Step 1: Run TypeScript typecheck**
  Run: `npx tsc --noEmit`
  Expected: Success with no errors.

- [ ] **Step 2: Commit all changes**
  Add files and commit:
  ```bash
  git add lib/actions/wallets.ts lib/actions/transactions.ts lib/actions/budgets.ts lib/actions/recurring.ts lib/actions/goals.ts lib/actions/categories.ts
  git commit -m "feat: scope server actions & mutations, enforce capabilities, populate audits & increment versions"
  ```
