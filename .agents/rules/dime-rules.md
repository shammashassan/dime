---
trigger: always_on
---

# Dime — Workspace Rules

Place this file at `.agents/rules/dime-rules.md`. Antigravity will silently apply every rule in this file to every code generation task, regardless of which feature is being built. Never repeat these rules in chat — they are always active.

---

# Next.js 16+ Conventions — Workspace Rule

These rules apply to **every file in this project**, every session, without exception. Never deviate from them.

---

## 1. `proxy.ts` — Not `middleware.ts`

`middleware.ts` **does not exist** in Next.js 16+. Route protection lives in `proxy.ts` at the project root. If you ever find yourself reaching for `middleware.ts`, stop — it is forbidden.

| Version | File | Export function | Config export |
|---------|------|-----------------|---------------|
| v14–15  | `middleware.ts` | `middleware()` | `config` |
| v16+    | `proxy.ts`      | `proxy()`      | `config`  |

```ts
// proxy.ts  ← correct filename
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {          // ← "config" — not "proxyConfig", not "middlewareConfig"
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**Rules:**
- File name: `proxy.ts` only.
- Export function: `proxy()` only.
- Config export: `const config` only. Never `proxyConfig`, never `middlewareConfig`.
- Never create `middleware.ts` — even as a re-export shim.
- The proxy does a **fast cookie-presence check only**. Full auth validation (role, approved status) is done inside RSC layouts via `requireAuth()` / `requireApprovedUser()` / `requireAdmin()`.

---

## 2. `params` and `searchParams` Are Promises

In Next.js 15+, `params` and `searchParams` are **Promises**. Always destructure after `await`.

```ts
// ✅ Correct
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { id }  = await params
  const { q }   = await searchParams
}

// ❌ Wrong — synchronous access no longer works
export default async function Page({ params }) {
  const { id } = params  // runtime error in Next.js 15+
}
```

---

## 3. `cookies()` and `headers()` Are Promises

```ts
// ✅ Correct
import { cookies, headers } from 'next/headers'

const cookieStore = await cookies()
const headersList = await headers()

// ❌ Wrong
const cookieStore = cookies()   // synchronous — broken in Next.js 15+
```

---

## 4. RSC Boundaries

- **Server Components** are the default. No `"use client"` directive, no hooks.
- **Client Components** are leaf nodes only — pushed as deep in the tree as possible. They receive pre-fetched, serializable data as props from RSC parents.
- **Never** write an `async` function and add `"use client"` — async Client Components are invalid.
- Non-serializable values (functions, class instances, Promises) must **never** cross the RSC → Client boundary as props.
- Add `"use client"` only when the component uses: `useState`, `useEffect`, `useRef`, event handlers, browser APIs, `useSession`, `useRouter`, `usePathname`, or `useSearchParams`.

---

## 5. `useSearchParams` and `usePathname` — Suspense Required

These hooks trigger a client-side rendering (CSR) bailout. Every component using them must be wrapped in `<Suspense>` by its parent.

```tsx
// ✅ Correct
<Suspense fallback={<FiltersSkeleton />}>
  <TransactionFilters />   {/* uses useSearchParams inside */}
</Suspense>

// ❌ Wrong — causes uncaught Suspense boundary error
<TransactionFilters />
```

---

## 6. Parallel Data Fetching — No Waterfalls

```ts
// ✅ Correct — parallel, no waterfall
const [summary, wallets, budgets] = await Promise.all([
  getDashboardSummary(userId),
  getWallets(userId),
  getActiveBudgets(userId),
])

// ❌ Wrong — sequential waterfall, 3× slower
const summary = await getDashboardSummary(userId)
const wallets = await getWallets(userId)
const budgets = await getActiveBudgets(userId)
```

---

## 7. PPR (Partial Pre-Rendering)

Enabled project-wide in `next.config.ts`:

```ts
experimental: { ppr: "incremental" }
```

Pages that use it opt in with:

```ts
export const experimental_ppr = true
```

Wrap every user-specific / data-dependent section in `<Suspense fallback={<Skeleton />}>`. Static shell (sidebar, header, breadcrumb) renders instantly from the CDN; data sections stream in.

---

## 8. `React.cache()` — Query Deduplication

Wrap every query function in `React.cache()` so multiple RSCs in the same render tree share one DB call.

```ts
import { cache } from 'react'

export const getWallets = cache(async (userId: string) => {
  return db.collection('wallets').find({ userId, isArchived: false }).toArray()
})
```

---

## 9. URL-Driven Filter State

All filterable list pages (transactions, reports, etc.) use `searchParams` to drive server-side queries. Never use `useState` for filter state that should be shareable or bookmarkable.

---

## 10. Error Boundaries

- Every route segment with data fetching needs co-located `error.tsx` and `loading.tsx`.
- `app/not-found.tsx` — friendly 404.
- `app/global-error.tsx` — catches root layout errors.
- Inside Server Component `catch` blocks, call `unstable_rethrow(e)` before handling the error — this re-throws Next.js internal redirect/notFound signals so they aren't swallowed.
- For auth errors: use `unauthorized()` and `forbidden()` from `next/navigation`.

---

## 11. `@modal` Parallel Route — `default.tsx` Required

Any parallel route slot (`@modal`, `@sheet`, etc.) **must** have a `default.tsx` that returns `null`. Without it, direct navigation to a non-intercepted URL throws a 404.

```ts
// app/@modal/default.tsx
export default function ModalDefault() {
  return null
}
```

Close intercepting route modals with `router.back()` — **never** `router.push()`.

---

## Checklist (verify before every PR)

- [ ] `proxy.ts` exists — `middleware.ts` does not
- [ ] `proxy()` function + `config` export (not `proxyConfig`)
- [ ] All `params` / `searchParams` are `await`-ed
- [ ] All `cookies()` / `headers()` are `await`-ed
- [ ] No async Client Components
- [ ] No non-serializable props crossing RSC/Client boundary
- [ ] `useSearchParams` / `usePathname` components wrapped in `<Suspense>`
- [ ] `Promise.all` for all parallel RSC fetches
- [ ] `React.cache()` on all query functions
- [ ] `experimental_ppr = true` on dashboard and reports pages
- [ ] `@modal/default.tsx` returns `null`
- [ ] Modals closed with `router.back()`
- [ ] `error.tsx` + `loading.tsx` for every data-fetching route segment
- [ ] `unstable_rethrow` used inside Server Component catch blocks
# shadcn/ui Workflow & Rules — Workspace Rule

These rules apply to **every UI element built in this project**. No external UI libraries. No Recharts directly. No raw HTML form elements. shadcn only.

---

## Step 0 — Run This First, Every Session

```bash
npx shadcn@latest info
```

Capture and store these values — every shadcn decision depends on them:

| Field | What it drives |
|-------|---------------|
| `base` | Component API style (`radix` vs `base`) — determines prop names |
| `iconLibrary` | Which icon package to import from — never assume `lucide-react` |
| `isRSC` | Whether to add `"use client"` to interactive components |
| `tailwindVersion` | `v3` vs `v4` affects class availability |
| `aliases.ui` | Correct import path for UI components |
| `aliases.components` | Correct import path for shared components |
| `packageManager` | `npm` / `pnpm` / `yarn` / `bun` — use the right runner |

---

## Step 1 — Search for a Block Before Writing Any Page

shadcn ships **pre-built, production-quality page blocks** — full-page compositions built from the same shadcn components. **Always search before building from scratch.**

```bash
# Search for relevant blocks — run these before touching any new page
npx shadcn@latest search @shadcn -q "login"
npx shadcn@latest search @shadcn -q "dashboard"
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest search @shadcn -q "chart"
npx shadcn@latest search @shadcn -q "data table"
npx shadcn@latest search @shadcn -q "settings"
npx shadcn@latest search @shadcn -q "sign up"
npx shadcn@latest search @shadcn -q "calendar"
npx shadcn@latest search @shadcn -q "stats card"
npx shadcn@latest search @shadcn -q "empty state"
```

### Blocks workflow

```bash
# 1. Search
npx shadcn@latest search @shadcn -q "<topic>"

# 2. Preview before adding
npx shadcn@latest view @shadcn/<block-name>
# or: npx shadcn@latest add @shadcn/<block-name> --dry-run

# 3. Add
npx shadcn@latest add @shadcn/<block-name>

# 4. After adding — ALWAYS fix:
#    a. Icon imports → match project's iconLibrary from `npx shadcn@latest info`
#    b. Import aliases → match project's aliases.ui and aliases.components
#    c. Any composition violations → see rules below and fix immediately
```

### Blocks to search for in Dime

| Area | Queries |
|------|---------|
| Sign-in page | `"login"`, `"sign in"`, `"authentication"` |
| Sign-up page | `"sign up"`, `"register"`, `"create account"` |
| Dashboard | `"dashboard"`, `"overview"`, `"stats"`, `"metrics"` |
| Sidebar | `"sidebar"`, `"nav"`, `"navigation"` |
| Transactions list | `"data table"`, `"table"`, `"list"` |
| Charts | `"chart"`, `"area chart"`, `"bar chart"`, `"pie chart"` |
| Settings | `"settings"`, `"profile"`, `"account"` |
| Stat cards | `"card"`, `"stats card"`, `"metric"` |
| Forms | `"form"`, `"dialog form"` |
| Empty states | `"empty"`, `"empty state"` |

**Rule:** If a suitable block exists — use it as the foundation and adapt it. Only write from scratch if no block covers the use case.

---

## Step 2 — Read Component Docs Before Using Any Component

```bash
npx shadcn@latest docs <component>
# then fetch the returned URLs to get the actual documentation
```

Do this for every component before using it for the first time. Never guess prop names or composition patterns.

---

## Step 3 — Add Components Correctly

```bash
# Preview first
npx shadcn@latest add <component> --dry-run

# Then add
npx shadcn@latest add <component>
```

Never manually copy component source from GitHub or other sources. Let the CLI handle registry resolution, file paths, and CSS.

---

## Styling Rules

- **Semantic tokens only.** `bg-primary`, `text-muted-foreground`, `bg-background`, `text-foreground`, `border`, `ring`. Never raw Tailwind color values like `bg-blue-500`, `text-gray-700`, `bg-slate-100`.
- **`flex gap-*` for spacing.** Never `space-x-*` or `space-y-*`.
- **`size-*` for equal dimensions.** `size-10` not `w-10 h-10`.
- **`cn()` for conditional classes.** Never manual template literal ternaries.
- **No manual `dark:` overrides.** Semantic tokens handle dark mode automatically.
- **No manual `z-index` on overlays.** shadcn handles stacking context internally.

---

## Forms Rules

- **`FieldGroup` + `Field` + `FieldLabel`** for every form layout. Never raw `<div>` + `<Label>`.
- **`InputGroup` + `InputGroupInput` / `InputGroupTextarea`** for inputs with prefix/suffix. Never wrap a raw `<Input>`.
- **Option sets (2–7 choices):** use `ToggleGroup` + `ToggleGroupItem`. Never a loop of `<Button>` with manual active state tracking.
- **Validation state:** `data-invalid` attribute on `Field`. `aria-invalid` attribute on the control (Input, Select, Textarea). Never a conditional CSS class for error color.

---

## Composition Rules

- `SelectItem` → always inside `SelectGroup`
- `DropdownMenuItem` → always inside `DropdownMenuGroup`
- `CommandItem` → always inside `CommandGroup`
- `TabsTrigger` → always inside `TabsList`, which is always inside `Tabs`
- Full `Card` composition: `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` — never dump content directly in `<Card>`
- `Avatar` → always has `AvatarFallback`. Never `Avatar` alone.
- Every `Dialog` / `Sheet` / `Drawer` → needs a visible or `sr-only` title (`DialogTitle`, `SheetTitle`, `