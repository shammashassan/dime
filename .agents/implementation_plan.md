# Implementation Plan — Refactor Details Items to asChild & Add History Deletion

This plan details the changes to be made to six detail pages (`budget-details.tsx`, `goal-details.tsx`, `contact-details.tsx`, `loan-details.tsx`, `recurring-details.tsx`, and `wallet-details.tsx`) to migrate list items to the `asChild` pattern using `@/components/ui/item`'s structure wrapping `<Link>`, and to add or refine delete buttons for history and timeline items.

## Proposed Changes

---

### 1. Budgets Component

#### [MODIFY] [budget-details.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/budgets/budget-details.tsx)
- Implement `localTransactions` state initialized with `transactions` prop and synchronized via `useEffect`.
- Import `deleteTransaction` from `@/lib/actions/transactions` and implement `handleDeleteTransaction(txId: string)`.
- Refactor the "Transaction History" list items:
  - Add `asChild` to `<Item>`.
  - Wrap the contents (`ItemMedia`, `ItemContent`, `ItemActions`) in `<Link href={`/transactions?highlight=${t._id.toString()}`}>`.
  - Add a delete button (using `AlertDialog` + `Trash2` button) inside `ItemActions`.
  - Attach `onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}` on the delete button / trigger to prevent navigating when clicked.

---

### 2. Goals Component

#### [MODIFY] [goal-details.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/goals/goal-details.tsx)
- Implement `localContributions` state initialized with `contributions` prop and synchronized via `useEffect`.
- Import `deleteTransaction` from `@/lib/actions/transactions` and implement `handleDeleteContribution(txId: string)`.
- Refactor the "Contribution History" list items:
  - Add `asChild` to `<Item>`.
  - Wrap the contents in `<Link href={`/transactions?highlight=${c._id.toString()}`}>`.
  - Add a delete button (using `AlertDialog` + `Trash2` button) inside `ItemActions`.
  - Intercept clicks with `onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}` on the delete button / trigger.

#### [MODIFY] [transactions.ts](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/lib/actions/transactions.ts)
- Modify `deleteTransaction` to check if `tx.goalId` is present.
- If present, fetch the goal and decrement its `currentAmount` by the deleted transaction's `amount`.
- Call `updateTag("goals")` and `revalidatePath("/goals")`.

---

### 3. Contacts Component

#### [MODIFY] [contact-details.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/contacts/contact-details.tsx)
- Refactor the "History & Timeline" list items:
  - Add `asChild` to `<Item>` for events that have `event.loanId`.
  - Wrap in `<Link href={`/loans/${event.loanId}`}>`.
  - Ensure the existing delete buttons/dialog triggers in `ItemActions` intercept click events by wrapping them in a container with `onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}` or adding it directly to the button/trigger elements.

---

### 4. Loans Component

#### [MODIFY] [loan-details.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/loans/loan-details.tsx)
- Expose `transactionId` on timeline events representing loan creation and repayments.
- Refactor the "History & Timeline" list items:
  - Add `asChild` to `<Item>` for events of type `"created"` or `"repayment"` that have `event.transactionId`.
  - Wrap in `<Link href={`/transactions?highlight=${event.transactionId}`}>`.
  - Intercept delete button / dialog trigger clicks using `onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}`.

---

### 5. Recurring Component

#### [MODIFY] [recurring-details.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/recurring/recurring-details.tsx)
- Refactor the "History" list items:
  - For bills (where `isBill` is true): if the bill is paid and has `bill.transactionId`, set `asChild` on `<Item>` and wrap in `<Link href={`/transactions?highlight=${bill.transactionId}`}>`. If not paid/skipped, render normally without `asChild`.
  - For standard recurring transactions: set `asChild` on `<Item>` and wrap in `<Link href={`/transactions?highlight=${tx._id.toString()}`}>`.
  - Ensure delete buttons/dialog triggers/action buttons (like "Pay Now", "Skip") intercept click events to prevent routing.

---

### 6. Wallets Component

#### [MODIFY] [wallet-details.tsx](file:///c:/Users/ADMIN/Desktop/shammas/website/dime/components/wallets/wallet-details.tsx)
- Refactor the "Recent Transactions" list items:
  - Add `asChild` to `<Item>`.
  - Wrap the contents in `<Link href={`/transactions?highlight=${tx._id.toString()}`}>`.
  - Ensure delete buttons/dialog triggers in `ItemActions` intercept click events via `onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}`.

## Verification Plan

### Automated Verification
- Verify compilation and TypeScript type checking.
```bash
npm run typecheck
```

### Manual Verification
- Navigate through each Details view (Budget, Goal, Contact, Loan, Recurring, Wallet) in the UI.
- Verify that clicking anywhere on the list items (except action buttons) correctly triggers navigation to the linked resource.
- Verify that clicking the delete/action buttons does NOT trigger navigation, but instead executes the action (opens delete confirmation dialog or performs inline updates).
