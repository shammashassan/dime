# Dime — App Specification (PRD)

> **Before reading this file:** The global workspace rules in `.agents/rules/` apply to everything built here. They are not repeated in this document. If a rule exists there, it is enforced silently.
>
> **How to use this file:** Tag it with `@app-spec.md` when starting a session, then reference the step number from the Implementation Order. Example: *"Read @app-spec.md. Execute Step 3 — set up the MongoDB schemas and indexes."*

---

## Project Overview

**Dime** is a production-ready, full-stack personal finance tracker. Each user has a fully isolated account — their own wallets, transactions, categories, budgets, and recurring rules. The app is invite-only: new signups enter a pending queue and can only access the dashboard after an admin approves them.

**Stack (already bootstrapped):**

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router, React 19) |
| Database | MongoDB — native driver |
| Auth | Better Auth |
| UI | shadcn/ui — all UI elements, zero external libraries |
| Charts | shadcn `Chart` component only — no direct Recharts usage |
| Forms | React Hook Form + Zod |
| Email | Resend — fall back to `console.log` if `RESEND_API_KEY` absent |
| Styling | Tailwind CSS v4 — semantic tokens only |

---

## Authentication Configuration

### Auth Methods

1. **Email & Password** — email verification required, password reset, min 8 chars
2. **Username & Password** — via `username` plugin
3. **Google OAuth** — via `socialProviders.google`
4. **Magic Link** — passwordless; user receives email → clicks link → authenticated (single-use, expires)
5. **Passkey (WebAuthn/FIDO2)** — biometric/PIN; installed via `@better-auth/passkey`
6. **2FA** — TOTP (authenticator app) + email OTP + backup codes; via `twoFactor` plugin

### Access Control (`lib/access.ts`)

No server-only imports — this file is imported by both server and client.

```ts
import { createAccessControl } from "better-auth/plugins/access"

export const ac = createAccessControl({
  user: [
    "create", "list", "get", "update",
    "set-role", "ban", "impersonate", "delete",
    "set-password", "approve", "reject",
  ],
  session: ["list", "revoke"],
})

export const roles = {
  admin: ac.newRole({
    user: [
      "create", "list", "get", "update",
      "set-role", "ban", "impersonate", "delete",
      "set-password", "approve", "reject",
    ],
    session: ["list", "revoke"],
  }),
  user: ac.newRole({
    user: [],
    session: [],
  }),
}
```

### `lib/auth.ts` — Server Config

```ts
import { betterAuth }     from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { nextCookies }    from "better-auth/next-js"
import { username }       from "better-auth/plugins/username"
import { magicLink }      from "better-auth/plugins/magic-link"
import { twoFactor }      from "better-auth/plugins/two-factor"
import { admin }          from "better-auth/plugins/admin"
import { passkey }        from "@better-auth/passkey"
import { ac, roles }      from "@/lib/access"
import { db }             from "@/lib/db/client"
import { sendEmail }      from "@/lib/email"

export const auth = betterAuth({
  appName: "Dime",
  database: mongodbAdapter(db),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 256,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 30,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({ to: user.email, subject: "Reset your Dime password", html: `<a href="${url}">Reset Password</a>` })
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({ to: user.email, subject: "Verify your Dime email", html: `<a href="${url}">Verify Email</a>` })
    },
    sendOnSignUp: true,
  },

  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  user: {
    additionalFields: {
      approved: { type: "boolean", defaultValue: false, required: false },
    },
    deleteUser:  { enabled: true },
    changeEmail: { enabled: true },
  },

  plugins: [
    username(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({ to: email, subject: "Your Dime sign-in link", html: `<a href="${url}">Sign in to Dime</a>` })
      },
    }),
    twoFactor({
      issuer: "Dime",
      totpOptions: { digits: 6, period: 30 },
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          await sendEmail({ to: user.email, subject: "Your Dime verification code", html: `<p>Your code: <strong>${otp}</strong></p>` })
        },
        period: 5,
        allowedAttempts: 5,
        storeOTP: "encrypted",
      },
      backupCodeOptions: { amount: 10, length: 10, storeBackupCodes: "encrypted" },
      twoFactorCookieMaxAge: 600,
      trustDeviceMaxAge: 30 * 24 * 60 * 60,
    }),
    passkey({
      rpID:   process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost",
      rpName: "Dime",
      origin: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
    }),
    admin({ defaultRole: "user", adminRoles: ["admin"], impersonationSessionDuration: 60 * 60, ac, roles }),
    nextCookies(),
  ],

  databaseHooks: {
    user: {
      create: {
        before: async ({ data }) => ({ data: { ...data, approved: false } }),
      },
    },
    session: {
      create: {
        before: async ({ data }) => {
          const user = await db.collection("user").findOne({ id: data.userId })
          if (user && !user.approved) throw new Error("PENDING_APPROVAL")
        },
      },
    },
  },

  session: {
    expiresIn:  60 * 60 * 24 * 7,
    updateAge:  60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5, strategy: "jwe" },
  },

  account: { accountLinking: { enabled: true }, encryptOAuthTokens: true },

  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/api/auth/sign-in/email":    { window: 60, max: 5 },
      "/api/auth/sign-up/email":    { window: 60, max: 3 },
      "/api/auth/magic-link/send":  { window: 60, max: 3 },
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"], disableIpTracking: false },
  },

  trustedOrigins: [process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000"],
})

export type Session = typeof auth.$Infer.Session
```

### `lib/auth-client.ts`

```ts
import { createAuthClient }  from "better-auth/react"
import { usernameClient }    from "better-auth/client/plugins"
import { magicLinkClient }   from "better-auth/client/plugins"
import { twoFactorClient }   from "better-auth/client/plugins"
import { adminClient }       from "better-auth/client/plugins"
import { passkeyClient }     from "better-auth/client/plugins"
import { ac, roles }         from "@/lib/access"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [
    usernameClient(),
    magicLinkClient(),
    twoFactorClient({ onTwoFactorRedirect() { window.location.href = "/2fa" } }),
    passkeyClient(),
    adminClient({ ac, roles }),
  ],
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
```

### `lib/auth-guard.ts`

```ts
import { auth }      from "@/lib/auth"
import { headers }   from "next/headers"
import { redirect }  from "next/navigation"

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/sign-in")
  return session
}

export async function requireApprovedUser() {
  const session = await requireAuth()
  if (!(session.user as any).approved) redirect("/pending-approval")
  return session
}

export async function requireAdmin() {
  const session = await requireApprovedUser()
  if (session.user.role !== "admin") redirect("/")
  return session
}
```

### Route Handler

```ts
// app/api/auth/[...all]/route.ts
import { auth }            from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
export const { GET, POST } = toNextJsHandler(auth)
```

---

## MongoDB Schema

Use the MongoDB native driver. All timestamps are `Date` objects. Define typed TypeScript interfaces in `types/`.

### `user` — Managed by Better Auth

Extended automatically with: `role`, `banned`, `banReason`, `banExpires`, `twoFactorEnabled`, `twoFactorSecret`, and the custom `approved` field.

### `wallets`

```ts
interface Wallet {
  _id: ObjectId
  userId: string
  name: string
  type: "bank" | "cash" | "credit_card" | "savings" | "investment"
  currency: string        // ISO 4217: "USD", "INR", "EUR"
  balance: number         // Store in smallest unit (cents / paise)
  color: string           // Hex color
  icon: string            // Icon name string
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}
```

### `transactions`

```ts
interface Transaction {
  _id: ObjectId
  userId: string
  walletId: string
  categoryId: string
  type: "income" | "expense" | "transfer"
  amount: number          // Always positive; type determines direction
  currency: string
  description: string
  notes?: string
  date: Date              // User-specified date, not createdAt
  tags: string[]
  isRecurring: boolean
  recurringId?: string    // Links to recurring_rules._id if generated by a rule
  createdAt: Date
  updatedAt: Date
}
```

### `categories`

```ts
interface Category {
  _id: ObjectId
  userId: string | null   // null = system default (shared); string = user-owned
  name: string
  type: "income" | "expense" | "both"
  icon: string
  color: string
  parentId?: string       // For subcategories
  isDefault: boolean
  createdAt: Date
}
```

**Seed system defaults on startup** (check count === 0 before inserting):
- **Expense:** Food & Dining, Transport, Housing, Utilities, Healthcare, Entertainment, Shopping, Education, Travel, Personal Care, Subscriptions, Other
- **Income:** Salary, Freelance, Business, Investment, Gift, Rental, Other

### `budgets`

```ts
interface Budget {
  _id: ObjectId
  userId: string
  categoryId: string
  walletId?: string       // undefined = applies across all wallets
  name: string
  amount: number
  currency: string
  period: "daily" | "weekly" | "monthly" | "yearly"
  startDate: Date
  endDate?: Date
  isActive: boolean
  alertThreshold: number  // 0–100; alert when spending % hits this value
  createdAt: Date
  updatedAt: Date
}
```

### `recurring_rules`

```ts
interface RecurringRule {
  _id: ObjectId
  userId: string
  walletId: string
  categoryId: string
  type: "income" | "expense"
  amount: number
  currency: string
  description: string
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly"
  startDate: Date
  endDate?: Date
  nextDueDate: Date
  lastProcessedDate?: Date
  isActive: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}
```

### Required Indexes (`lib/db/indexes.ts`)

```ts
// transactions
transactions.createIndex({ userId: 1, date: -1 })
transactions.createIndex({ userId: 1, walletId: 1, date: -1 })
transactions.createIndex({ userId: 1, categoryId: 1, date: -1 })
transactions.createIndex({ userId: 1, type: 1, date: -1 })
transactions.createIndex({ tags: 1 })

// budgets
budgets.createIndex({ userId: 1, isActive: 1 })
budgets.createIndex({ userId: 1, categoryId: 1 })

// recurring_rules
recurring_rules.createIndex({ userId: 1, nextDueDate: 1, isActive: 1 })

// Better Auth user approval lookup
db.collection("user").createIndex({ approved: 1, role: 1 })
```

---

## Application Routes & Page Architecture

```
app/
├── layout.tsx                            # Root — must include @modal slot
├── not-found.tsx
├── global-error.tsx
│
├── (auth)/                               # Unauthenticated — centered Card layout
│   ├── layout.tsx
│   ├── sign-in/page.tsx
│   ├── sign-up/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── verify-email/page.tsx
│   ├── magic-link/page.tsx
│   └── 2fa/page.tsx
│
├── (pending)/                            # approved=false holding page
│   ├── layout.tsx
│   └── pending-approval/page.tsx
│
├── (dashboard)/                          # Approved users only
│   ├── layout.tsx                        # requireApprovedUser() + ImpersonationBanner
│   ├── error.tsx
│   ├── loading.tsx
│   ├── page.tsx                          # Overview dashboard
│   ├── transactions/
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   └── [id]/page.tsx               # Full-page fallback (hard nav)
│   ├── wallets/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── budgets/page.tsx
│   ├── recurring/page.tsx
│   ├── reports/page.tsx
│   ├── categories/page.tsx
│   └── settings/page.tsx
│
├── (admin)/                              # Admin role only
│   ├── layout.tsx                        # requireAdmin()
│   └── admin/
│       ├── page.tsx                      # redirect → /admin/users
│       └── users/
│           ├── page.tsx
│           ├── error.tsx
│           └── loading.tsx
│
├── @modal/                               # Parallel route slot
│   ├── default.tsx                       # REQUIRED — export default () => null
│   └── (.)transactions/
│       └── [id]/
│           └── page.tsx
│
└── api/
    ├── auth/[...all]/route.ts
    └── cron/
        └── process-recurring/route.ts
```

### Root Layout — `@modal` Slot Required

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {modal}
      </body>
    </html>
  )
}
```

### `proxy.ts` (project root)

```ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = [
  "/sign-in", "/sign-up", "/forgot-password",
  "/reset-password", "/verify-email", "/magic-link",
  "/pending-approval", "/api/auth",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  if (isPublic) return NextResponse.next()

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token")
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

---

## Auth Pages — Implementation Detail

### `/sign-in`

shadcn `Tabs` (triggers inside `TabsList`):
1. **Email** — email + password. On success: check `twoFactorRedirect` → `/2fa`. On `PENDING_APPROVAL` error → `/pending-approval`.
2. **Username** — username + password. Same success/error handling.
3. **Magic Link** — email only → `authClient.signIn.magicLink(...)` → show inline "Check your email" state.
4. **Passkey** — single button → `authClient.signIn.passkey()`.

Below tabs: Google OAuth button → `authClient.signIn.social({ provider: "google", callbackURL: absolute })`.

All email/username inputs: `autocomplete="username webauthn"` or `autocomplete="email webauthn"` (passkey conditional UI). On mount: initiate `authClient.signIn.passkey({ autoFill: true })` if `isConditionalMediationAvailable`.

### `/sign-up`

shadcn `Tabs`:
1. **Email** — name, email, password, confirm password.
2. **Username** — name, username, email, password, confirm password.
3. **Google** — "Continue with Google" button.

After **any** successful signup → redirect to `/pending-approval`. **Never to `/`.**

Show notice: *"After signing up, your account requires admin approval before you can access Dime."*

### `/2fa`

`ToggleGroup` to switch between:
- **Authenticator App** → `authClient.twoFactor.verifyTotp({ code, trustDevice: true })`
- **Email Code** → `authClient.twoFactor.verifyOtp({ code, trustDevice: true })` + "Resend" → `authClient.twoFactor.sendOtp()`
- **Backup Code** link → `authClient.twoFactor.verifyBackupCode({ code })`

### `/pending-approval`

Centered `Card`. Shows user name + email from `useSession()`. "Sign Out" → `authClient.signOut()` then redirect to `/sign-in`.

---

## Admin Panel — `/admin/users`

Layout calls `requireAdmin()`. Users with `role !== "admin"` are redirected to `/`.

### Stats Cards (above tabs) — MongoDB aggregation

- Total Approved Users
- Pending Approval count (shadcn `Alert` with warning style if > 0)
- Banned Users
- Admin Count

### Tab 1 — All Users

`Table`: Avatar+Name, Email, Username, Role (`Badge`), Status (`Badge`), Joined, Actions (`DropdownMenu`).

DropdownMenu per row:
- View Profile → `Sheet`
- Set Role Admin → `authClient.admin.setUserRole({ userId, role: "admin" })`
- Set Role User → `authClient.admin.setUserRole({ userId, role: "user" })`
- Ban → `AlertDialog` with reason `Input` → `authClient.admin.banUser({ userId, reason })`
- Unban → `authClient.admin.unbanUser({ userId })`
- Impersonate → `authClient.admin.impersonateUser({ userId })` → redirect to `/`
- Revoke Sessions → `authClient.admin.revokeUserSessions({ userId })`
- Delete → `AlertDialog` → `authClient.admin.removeUser({ userId })`

### Tab 2 — Pending Approval

Users where `approved === false && banned === false`. Columns: Name/Email, Username, Auth method, Requested at.

- **Approve** → Server Action `approveUser(userId)` in `lib/actions/admin.ts`:
  ```ts
  await auth.api.updateUser({ body: { userId, approved: true }, headers: await headers() })
  revalidatePath("/admin/users")
  ```
- **Reject** → `AlertDialog` → Server Action `rejectUser(userId)` (calls `auth.api.removeUser`)
- **Bulk:** checkbox + "Approve Selected" / "Reject Selected" via `Promise.all`

### Tab 3 — Banned Users

`banned === true`. Shows `banReason`, `banExpires`. Action: Unban.

### Tab 4 — Admins

`role === "admin"`. Action: Demote to User.

### Impersonation Banner

In `components/layout/impersonation-banner.tsx` ("use client"). Check `(session?.session as any)?.impersonatedBy`. If set: sticky `Alert variant="destructive"` with "Stop Impersonating" button → `authClient.admin.stopImpersonating()` → `window.location.reload()`. Add to `app/(dashboard)/layout.tsx`.

---

## Feature Implementation

### 1. Dashboard Overview (`/`)

All RSC unless noted. Use `Promise.all` + multiple `Suspense` boundaries. `experimental_ppr = true`.

- **`NetWorthCard`** (RSC) — aggregate sum of wallet balances per currency
- **`MonthlySummaryCard`** (RSC) — this month income vs expense, % change vs last month
- **`SpendingTrendChart`** ("use client") — 6-month area chart using shadcn `Chart`; receives `initialData` prop from RSC parent
- **`CategoryBreakdownChart`** ("use client") — pie chart; receives `data` prop; uses shadcn `Chart`
- **`BudgetProgressList`** (RSC) — active budgets, shadcn `Progress` per budget
- **`RecentTransactionsList`** (RSC) — last 10, shadcn `Table`
- Quick actions (Dialog triggers): "Add Transaction", "Add Wallet", "Add Budget"

### 2. Transactions (`/transactions`)

- Full CRUD + soft delete
- URL `searchParams` filters: date range, type (income/expense/transfer), category (multi-select), wallet (multi-select), amount range, tags, text search
- Server-side pagination — 25 per page
- Bulk select + bulk delete (checkboxes + `AlertDialog`)
- CSV export via `Blob` + `URL.createObjectURL` in a Client Component
- Transaction detail as intercepting route modal (`@modal` slot); close with `router.back()`
- **Transfer type:** creates two linked transaction records (debit source wallet, credit target wallet)
- `useOptimistic` (React 19) for create/delete instant feedback

shadcn components: `Table`, `Dialog`, `AlertDialog`, `Sheet` (mobile filter panel), Calendar + `Popover` (date picker), `Select`, `Badge`, `Checkbox`, `DropdownMenu`, `Skeleton`, `Empty`

### 3. Wallets (`/wallets`)

- CRUD — name, type, currency, color, icon
- Per-wallet currency (ISO 4217)
- Manual balance adjustment → creates an `"adjustment"` type transaction with a reason note
- Wallet detail page: full transaction history for that wallet + balance history line chart (shadcn `Chart`)
- Archive / unarchive (archived wallets hidden from main list but transactions preserved)

### 4. Budgets (`/budgets`)

- Create per category, optional wallet scope
- Periods: daily / weekly / monthly / yearly
- Spent amount via MongoDB aggregate (match userId + categoryId + type="expense" + date in period range)
- shadcn `Progress` tinted by percentage: green < 70%, amber 70–90%, red > 90%
- Configurable `alertThreshold` (0–100%)
- Budget history: past period performance

### 5. Recurring Transactions (`/recurring`)

- Full CRUD for rules
- Frequencies: daily / weekly / biweekly / monthly / quarterly / yearly
- Toggle active/inactive
- "Process Now" button → calls Server Action directly
- Cron endpoint at `app/api/cron/process-recurring/route.ts` — protected by `CRON_SECRET` env var; finds rules where `nextDueDate <= now && isActive`, creates transactions, updates `nextDueDate` and `lastProcessedDate`

```ts
function getNextDueDate(current: Date, frequency: string): Date {
  const d = new Date(current)
  switch (frequency) {
    case "daily":     d.setDate(d.getDate() + 1); break
    case "weekly":    d.setDate(d.getDate() + 7); break
    case "biweekly":  d.setDate(d.getDate() + 14); break
    case "monthly":   d.setMonth(d.getMonth() + 1); break
    case "quarterly": d.setMonth(d.getMonth() + 3); break
    case "yearly":    d.setFullYear(d.getFullYear() + 1); break
  }
  return d
}
```

### 6. Reports (`/reports`)

All charts use shadcn `Chart` only. All chart components are Client Components receiving `initialData` from RSC parents. Date range selector updates `searchParams` → server re-renders with new data.

`experimental_ppr = true` on this page.

| Report | Chart Type | Period Options |
|--------|-----------|----------------|
| Income vs Expense Trend | Area (dual-line) | 3 / 6 / 12 months |
| Category Breakdown | Pie | Current month / custom range |
| Spending by Day of Week | Bar | Last 30 days |
| Wallet Balance History | Multi-line | 3 / 6 / 12 months |
| Monthly Net Savings | Pos/neg bar | Last 12 months |
| Budget Performance | Grouped bar | Current period |

CSV download per report via `Blob` in Client Component.

### 7. Categories (`/categories`)

- System defaults (read-only — no edit/delete)
- User custom categories: create (name, type, icon, color, optional parent for subcategory), edit, delete
- **Merge category:** reassign all transactions from source category to target, then delete source. Show count of affected transactions in the confirmation `AlertDialog`.

### 8. Settings (`/settings`)

shadcn `Tabs`:

| Tab | Content |
|-----|---------|
| **Profile** | Name, email (re-verify on change), username, avatar (initials-based `Avatar` + `AvatarFallback`) |
| **Security** | Change password; 2FA setup/disable (TOTP with QR code via `react-qr-code`, email OTP, backup codes display + regenerate); passkey management (register via `authClient.passkey.addPasskey()`, list + delete passkeys); linked OAuth accounts; active sessions list with per-session revoke |
| **Preferences** | Default currency, default wallet, date format (`DD/MM/YYYY` etc.) |
| **Data** | Export all data as JSON / CSV; delete account (`AlertDialog` with "type DIME to confirm" text input) |

---

## Layout & Navigation

### Dashboard Layout

shadcn `Sidebar` + `SidebarProvider` + `SidebarTrigger` (from block — search `"sidebar"` first).

**Sidebar nav items:**

```
📊 Overview          /
💸 Transactions      /transactions
👛 Wallets           /wallets
🎯 Budgets           /budgets
🔁 Recurring         /recurring
📈 Reports           /reports
🏷️  Categories        /categories
⚙️  Settings          /settings
── admin only (render when role === "admin") ──
👥 Users             /admin/users
```

**Header:** shadcn `Breadcrumb` + user `Avatar` (`AvatarFallback` required) + `DropdownMenu` (Profile, Settings, Sign Out).

---

## Multi-Currency

- Each wallet stores its own `currency` (ISO 4217)
- Each transaction records its `currency` (inherited from wallet at creation time)
- Dashboard groups balances by currency OR converts to user's selected display currency
- Exchange rates: fetch from a free API, cache in MongoDB `exchange_rates` collection with a 1-hour TTL
- Currency selector UI: shadcn `Command` inside `Popover` — searchable list of ISO code + currency name

---

## Complete Folder Structure

```
dime/
├── proxy.ts
├── app/
│   ├── layout.tsx                          # Root — @modal slot
│   ├── not-found.tsx
│   ├── global-error.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── magic-link/page.tsx
│   │   └── 2fa/page.tsx
│   ├── (pending)/
│   │   ├── layout.tsx
│   │   └── pending-approval/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   ├── page.tsx
│   │   ├── transactions/
│   │   │   ├── page.tsx
│   │   │   ├── error.tsx
│   │   │   ├── loading.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── wallets/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── recurring/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── categories/page.tsx
│   │   └── settings/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       └── users/
│   │           ├── page.tsx
│   │           ├── error.tsx
│   │           └── loading.tsx
│   ├── @modal/
│   │   ├── default.tsx                     # export default () => null
│   │   └── (.)transactions/[id]/page.tsx
│   └── api/
│       ├── auth/[...all]/route.ts
│       └── cron/process-recurring/route.ts
├── components/
│   ├── auth/
│   │   ├── sign-in-form.tsx                # "use client"
│   │   ├── sign-up-form.tsx                # "use client"
│   │   ├── two-factor-form.tsx             # "use client"
│   │   └── passkey-button.tsx              # "use client"
│   ├── admin/
│   │   ├── users-table.tsx                 # "use client"
│   │   ├── pending-table.tsx               # "use client"
│   │   ├── banned-table.tsx                # "use client"
│   │   ├── user-actions-menu.tsx           # "use client"
│   │   └── admin-stats.tsx                 # RSC
│   ├── dashboard/
│   │   ├── net-worth-card.tsx              # RSC
│   │   ├── monthly-summary.tsx             # RSC
│   │   ├── spending-trend-chart.tsx        # "use client" — receives initialData prop
│   │   ├── category-breakdown.tsx          # "use client" — receives data prop
│   │   ├── budget-progress-list.tsx        # RSC
│   │   └── recent-transactions.tsx         # RSC
│   ├── transactions/
│   │   ├── transaction-table.tsx           # RSC shell
│   │   ├── transaction-form.tsx            # "use client"
│   │   ├── transaction-filters.tsx         # "use client" — wrapped in Suspense
│   │   └── transaction-modal.tsx           # "use client" — router.back() to close
│   ├── layout/
│   │   ├── app-sidebar.tsx
│   │   ├── dashboard-header.tsx
│   │   └── impersonation-banner.tsx        # "use client"
│   └── shared/
│       ├── currency-display.tsx            # RSC
│       ├── currency-selector.tsx           # "use client"
│       ├── date-range-picker.tsx           # "use client" — wrapped in Suspense
│       └── amount-input.tsx                # "use client"
├── lib/
│   ├── access.ts                           # No server-only imports
│   ├── auth.ts
│   ├── auth-client.ts
│   ├── auth-guard.ts
│   ├── email.ts
│   ├── currency.ts
│   ├── db/
│   │   ├── client.ts
│   │   ├── collections.ts
│   │   └── indexes.ts
│   ├── actions/
│   │   ├── admin.ts
│   │   ├── transactions.ts
│   │   ├── wallets.ts
│   │   ├── budgets.ts
│   │   ├── categories.ts
│   │   └── recurring.ts
│   ├── queries/
│   │   ├── admin.ts
│   │   ├── transactions.ts
│   │   ├── wallets.ts
│   │   ├── budgets.ts
│   │   └── reports.ts
│   └── validations/
│       ├── transaction.schema.ts
│       ├── wallet.schema.ts
│       ├── budget.schema.ts
│       └── recurring.schema.ts
├── types/
│   ├── auth.ts
│   ├── transaction.ts
│   └── index.ts
├── next.config.ts
└── .env.local
```

---

## Environment Variables

```env
# Better Auth
BETTER_AUTH_SECRET=          # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/dime

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Passkey
NEXT_PUBLIC_APP_DOMAIN=localhost

# Email (Resend)
RESEND_API_KEY=

# Cron
CRON_SECRET=
```

---

## Implementation Order

> Start every session by saying: *"Read @app-spec.md. Execute Step N."*

1. Read **all skill files** in `.agents/rules/` and the skill paths listed in each rule file
2. Run `npx shadcn@latest info` — capture `base`, `iconLibrary`, `isRSC`, `aliases`, `packageManager`
3. `lib/db/` — MongoDB client singleton, typed collections, indexes, seed default categories
4. `types/` — all TypeScript interfaces (Wallet, Transaction, Category, Budget, RecurringRule, ActionResult)
5. `lib/access.ts` — shared AC (no server-only imports)
6. `lib/auth.ts` + `lib/auth-client.ts` + `lib/auth-guard.ts` — full Better Auth config
7. `npm install @better-auth/passkey resend` — **no migrate command for MongoDB**
8. `proxy.ts` — route guard using `proxy()` + `config`
9. Auth pages — **search for blocks first** (`"login"`, `"sign up"`): sign-in (tabs + passkey autofill), sign-up, 2FA, pending-approval, forgot/reset password, verify-email
10. `app/@modal/default.tsx` — must return `null`
11. Dashboard layout — **search for sidebar block first** (`"sidebar"`, `"nav"`): sidebar, header, impersonation banner
12. `lib/validations/` — all Zod schemas
13. `lib/queries/` — all read functions with `React.cache()`
14. `lib/actions/` — all Server Actions (each starts with `requireApprovedUser()`)
15. Dashboard overview — **search for dashboard/stats blocks first**: `Promise.all` + `Suspense` + PPR
16. Admin panel `/admin/users` — **search for table/data-table blocks first**: 4 tabs + stats cards
17. Transactions — **search for data-table block first**: list, form dialog, intercepting modal
18. Wallets — list + detail page with chart
19. Budgets — list + progress cards
20. Recurring — list + cron route handler
21. Reports — **search for chart blocks first** (`"chart"`, `"area chart"`, `"pie chart"`): all 6 chart types
22. Categories — list + CRUD + merge
23. Settings — **search for settings block first**: all 4 tabs including passkey management