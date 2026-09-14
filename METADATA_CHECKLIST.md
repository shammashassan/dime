# Dime Metadata Checklist & Audit

This checklist tracks the implementation and consistency of SEO and browser tab metadata across all pages in Dime.

## 1. Global Configuration (`app/layout.tsx`)

- **Root Title**: `Dime — The AI-Powered Expense Manager`
- **Title Template**: `%s | Dime`
- **Metadata Base**: `process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"`
- **Default Description**: `The AI-Powered Expense Manager for Everyone`
- **Dynamic Suffix Resolution**: Child pages provide a clean `title: "Page Name"`, and Next.js automatically outputs `"Page Name | Dime"`. No redundant manual suffixes exist.

---

## 2. Route Audit Matrix

| Route Path | File Path | Browser Title | Description | Status |
| :--- | :--- | :--- | :--- | :---: |
| `/` | `app/page.tsx` | Dime — The AI-Powered Expense Manager | The AI-Powered Expense Manager for Everyone | ✅ Inherited |
| `/sign-in` | `app/(auth)/sign-in/page.tsx` | Sign In \| Dime | Sign in to your Dime account to manage your personal finances. | ✅ Verified |
| `/sign-up` | `app/(auth)/sign-up/page.tsx` | Sign Up \| Dime | Create a new Dime account and take control of your financial journey. | ✅ Verified |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Forgot Password \| Dime | Reset your password to regain access to your Dime account. | ✅ Verified |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | Reset Password \| Dime | Enter and confirm your new password to secure your Dime account. | ✅ Verified |
| `/verify-email` | `app/(auth)/verify-email/page.tsx` | Verify Email \| Dime | Verify your email address to activate your Dime account. | ✅ Verified |
| `/2fa` | `app/(auth)/2fa/page.tsx` | Two-Factor Verification \| Dime | Enter your two-factor authentication code to access your Dime workspace. | ✅ Verified |
| `/accept-invitation/:id` | `app/(auth)/accept-invitation/[id]/page.tsx` | Accept Invitation \| Dime | Accept an invitation to join an organization on Dime. | ✅ Verified |
| `/pending-approval` | `app/(pending)/pending-approval/page.tsx` | Pending Approval \| Dime | Your Dime account registration is awaiting administrator approval. | ✅ Verified |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Dashboard \| Dime | Overview of your finances, spending trends, and budget progress. | ✅ Verified |
| `/calendar` | `app/(dashboard)/calendar/page.tsx` | Calendar \| Dime | Financial calendar view of recurring bills, transactions, and scheduled payments. | ✅ Verified |
| `/reports` | `app/(dashboard)/reports/page.tsx` | Reports & Analytics \| Dime | Analyze your income, expenses, cash flow trends, and category breakdowns. | ✅ Verified |
| `/health` | `app/(dashboard)/health/page.tsx` | Financial Health \| Dime | Assess your financial health score, emergency savings, and debt-to-income ratio. | ✅ Verified |
| `/planner` | `app/(dashboard)/planner/page.tsx` | Financial Planner \| Dime | Simulate future scenarios, stress-test your finances, and plan major life decisions. | ✅ Verified |
| `/insights` | `app/(dashboard)/insights/page.tsx` | AI Spending Insights \| Dime | Personalized spending insights and anomalies detected by AI. | ✅ Verified |
| `/notifications` | `app/(dashboard)/notifications/page.tsx` | Notifications \| Dime | View system notifications, budget alerts, and transaction updates. | ✅ Verified |
| `/settings` | `app/(dashboard)/settings/page.tsx` | Settings \| Dime | Manage your account, preferences, categories, budgets, and organization settings. | ✅ Verified |
| `/transactions` | `app/(dashboard)/transactions/page.tsx` | Transactions \| Dime | View, filter, and manage your income, expenses, and transfer transactions. | ✅ Verified |
| `/transactions/:id` | `app/(dashboard)/transactions/[id]/page.tsx` | Transaction Details \| Dime | Detailed view of transaction info, category, and receipts. | ✅ Verified |
| `/wallets` | `app/(dashboard)/wallets/page.tsx` | Wallets & Accounts \| Dime | Manage bank accounts, digital wallets, credit cards, and cash balances. | ✅ Verified |
| `/wallets/:id` | `app/(dashboard)/wallets/[id]/page.tsx` | Wallet Details \| Dime | View account balance history, analytics, and associated transactions. | ✅ Verified |
| `/budgets` | `app/(dashboard)/budgets/page.tsx` | Budgets \| Dime | Set and track category budgets, monitor spending thresholds, and prevent overspending. | ✅ Verified |
| `/budgets/:id` | `app/(dashboard)/budgets/[id]/page.tsx` | Budget Details \| Dime | Track detailed budget performance, historical spending, and related transactions. | ✅ Verified |
| `/goals` | `app/(dashboard)/goals/page.tsx` | Savings Goals \| Dime | Create financial targets, monitor savings milestones, and track progress. | ✅ Verified |
| `/goals/:id` | `app/(dashboard)/goals/[id]/page.tsx` | Goal Details \| Dime | View savings goal progress, contribution history, and projected completion. | ✅ Verified |
| `/loans` | `app/(dashboard)/loans/page.tsx` | Loans & Debts \| Dime | Track money lent to others and borrowed funds, with repayment schedules and interest. | ✅ Verified |
| `/loans/:id` | `app/(dashboard)/loans/[id]/page.tsx` | Loan Details \| Dime | Detailed view of loan terms, repayment history, and outstanding balance. | ✅ Verified |
| `/contacts` | `app/(dashboard)/contacts/page.tsx` | Contacts \| Dime | Manage people you lend to, borrow from, or split expenses with. | ✅ Verified |
| `/contacts/:id` | `app/(dashboard)/contacts/[id]/page.tsx` | Contact Profile \| Dime | View outstanding balances, loan history, and shared expenses with this contact. | ✅ Verified |
| `/shared-expenses` | `app/(dashboard)/shared-expenses/page.tsx` | Shared Expenses \| Dime | Split bills and group expenses fairly, track who paid what, and settle balances easily. | ✅ Verified |
| `/shared-expenses/:id` | `app/(dashboard)/shared-expenses/[id]/page.tsx` | Shared Expense Details \| Dime | Detailed breakdown of participant shares, payments, and settlements. | ✅ Verified |
| `/net-worth` | `app/(dashboard)/net-worth/page.tsx` | Net Worth \| Dime | Track your total assets, liabilities, and net worth growth over time. | ✅ Verified |
| `/net-worth/assets/:id` | `app/(dashboard)/net-worth/assets/[id]/page.tsx` | Asset Details \| Dime | View valuation history and asset information. | ✅ Verified |
| `/recurring` | `app/(dashboard)/recurring/page.tsx` | Recurring & Subscriptions \| Dime | Manage recurring bills, subscriptions, and scheduled income transactions. | ✅ Verified |
| `/recurring/:id` | `app/(dashboard)/recurring/[id]/page.tsx` | Recurring Rule Details \| Dime | View recurring transaction schedule, past occurrences, and billing status. | ✅ Verified |
| `/investments` | `app/(dashboard)/investments/page.tsx` | Investments \| Dime | Monitor investment portfolios, asset allocations, capital gains, and performance. | ✅ Verified |
| `/investments/:accountId` | `app/(dashboard)/investments/[accountId]/page.tsx` | Brokerage Account \| Dime | View holdings, portfolio distribution, and trading activity for this account. | ✅ Verified |
| `/investments/:accountId/:symbol` | `app/(dashboard)/investments/[accountId]/[symbol]/page.tsx` | Holding Details \| Dime | Detailed performance, transaction history, and metrics for this security. | ✅ Verified |
| `/categories` | `app/(dashboard)/categories/page.tsx` | Categories \| Dime | Customize income and expense categories, subcategories, and color codes. | ✅ Verified |
| `/admin` | `app/(dashboard)/admin/page.tsx` | Admin \| Dime | Dime administrative management. | ✅ Verified |
| `/admin/users` | `app/(dashboard)/admin/users/page.tsx` | User Management \| Dime | Manage system users, approve registrations, update roles, and review account permissions. | ✅ Verified |
| `/privacy` | `app/privacy/page.tsx` | Privacy Policy \| Dime | Learn how Dime safeguards your financial data with private, dedicated storage. | ✅ Verified |
| `/terms` | `app/terms/page.tsx` | Terms of Service \| Dime | Read the terms and conditions for using Dime's personal finance workspace. | ✅ Verified |
| `404` | `app/not-found.tsx` | 404 - Page Not Found \| Dime | The page you are looking for does not exist. | ✅ Verified |

---

## 3. Audit Script

The audit script `scripts/check-metadata.mjs` scans all Next.js page route definitions across the `app/` tree and verifies:
1. Static or dynamic metadata definition exists.
2. Identifies `"use client"` leaf pages that rely on parent layout inheritance.
3. Guards against double branding patterns (e.g. `title: "... | Dime"` inside child routes).
