"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Search,
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
  HandCoins,
  Users,
  Landmark,
  CalendarDays,
  Activity,
  Sparkles,
  TrendingUp,
  History,
  SlidersHorizontal,
  Compass,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { authClient } from "@/lib/auth-client"
import { universalSearchAction } from "@/lib/actions/search"
import { formatCurrency } from "@/lib/utils"
import type { SearchResultItem } from "@/types"

const ICON_MAP: Record<string, React.ElementType> = {
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
  HandCoins,
  Users,
  Landmark,
  CalendarDays,
  Activity,
  Sparkles,
  TrendingUp,
  Compass,
  FileText,
}

const QUICK_FILTER_CHIPS = [
  { label: "Over $50", syntax: "amount>50 " },
  { label: "Category: Food", syntax: "category:Food " },
  { label: "This Month", syntax: "date:this-month " },
  { label: "Overdue Bills", syntax: "bill:overdue " },
  { label: "Active Loans", syntax: "loan:active " },
  { label: "Active Subscriptions", syntax: "subscription:active " },
  { label: "Cash Account", syntax: "wallet:Cash " },
]

export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResultItem[]>([])
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const user = session?.user as { role?: string | null } | undefined
  const isAdmin = user?.role === "admin"

  // Load recent searches from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("dime_recent_searches")
      if (saved) {
        const parsed = JSON.parse(saved).slice(0, 5)
        queueMicrotask(() => {
          setRecentSearches(parsed)
        })
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const saveRecentSearch = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    const next = [trimmed, ...recentSearches.filter((item) => item !== trimmed)].slice(0, 5)
    setRecentSearches(next)
    try {
      localStorage.setItem("dime_recent_searches", JSON.stringify(next))
    } catch {
      // Ignore
    }
  }

  // Keyboard shortcut: ⌘K or Ctrl+K & custom global open event
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    const handleOpen = () => setOpen(true)

    document.addEventListener("keydown", down)
    window.addEventListener("open-global-search", handleOpen)
    return () => {
      document.removeEventListener("keydown", down)
      window.removeEventListener("open-global-search", handleOpen)
    }
  }, [])

  // Live debounced search execution
  React.useEffect(() => {
    if (!open) return
    const trimmed = query.trim()

    const timeout = setTimeout(async () => {
      if (!trimmed) {
        setResults([])
        return
      }
      try {
        const res = await universalSearchAction(trimmed, 5)
        setResults(res.items)
      } catch (err) {
        console.error("Failed to run search:", err)
      }
    }, 150)

    return () => clearTimeout(timeout)
  }, [query, open])

  const onSelectEntity = (path: string, searchToSave?: string) => {
    if (searchToSave) {
      saveRecentSearch(searchToSave)
    }
    setOpen(false)
    router.push(path)
  }

  const navigationItems = [
    { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { path: "/transactions", label: "Transactions", icon: ArrowLeftRight },
    { path: "/wallets", label: "Wallets & Accounts", icon: Wallet },
    { path: "/budgets", label: "Budgets", icon: PiggyBank },
    { path: "/goals", label: "Savings Goals", icon: Target },
    { path: "/recurring", label: "Recurring Platform", icon: Repeat },
    { path: "/investments", label: "Investment Portfolio", icon: TrendingUp },
    { path: "/loans", label: "Loans & Lending", icon: HandCoins },
    { path: "/contacts", label: "Contacts Directory", icon: Users },
    { path: "/net-worth", label: "Net Worth", icon: Landmark },
    { path: "/calendar", label: "Cash Flow Calendar", icon: CalendarDays },
    { path: "/health", label: "Financial Health Score", icon: Activity },
    { path: "/insights", label: "AI Spending Insights", icon: Sparkles },
    { path: "/coach", label: "Financial Coach", icon: Compass },
    { path: "/reports", label: "Reports & Analytics", icon: BarChart3 },
    { path: "/reports?tab=review", label: "Monthly Review", icon: FileText },
    { path: "/categories", label: "Categories", icon: Tags },
    { path: "/settings", label: "Settings & Profile", icon: Cog },
  ]

  if (isAdmin) {
    navigationItems.push({
      path: "/admin/users",
      label: "User Management (Admin)",
      icon: Shield,
    })
  }

  // Categorize results into proper CommandGroups
  const transactions = results.filter((r) => r.entityType === "transaction")
  const wallets = results.filter((r) => r.entityType === "wallet")
  const budgets = results.filter((r) => r.entityType === "budget")
  const goals = results.filter((r) => r.entityType === "goal")
  const recurring = results.filter((r) => r.entityType === "recurring")
  const investments = results.filter((r) => r.entityType === "investment")
  const loans = results.filter((r) => r.entityType === "loan")
  const contacts = results.filter((r) => r.entityType === "contact")
  const assetsAndLiabilities = results.filter(
    (r) => r.entityType === "asset" || r.entityType === "liability"
  )
  const matchedPages = results.filter((r) => r.entityType === "page")

  const isQueryActive = query.trim().length > 0

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 w-40 sm:w-56 md:w-64 justify-start bg-muted/30 text-xs sm:text-sm text-muted-foreground hover:bg-muted"
      >
        <Search data-icon="inline-start" />
        <span className="flex-1 text-left truncate">Search or type :</span>
        <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Universal Search"
        description="Search transactions, accounts, budgets, goals, recurring rules, and navigation."
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Type a command, search term, or operator..."
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* EMPTY STATE: Recent searches, operator shortcuts, and navigation */}
          {!isQueryActive && (
            <>
              {recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((term) => (
                    <CommandItem
                      key={term}
                      value={`recent-${term}`}
                      onSelect={() => setQuery(term)}
                    >
                      <History />
                      <span>{term}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandGroup heading="Filter Suggestions">
                {QUICK_FILTER_CHIPS.map((chip) => (
                  <CommandItem
                    key={chip.label}
                    value={`${chip.label} ${chip.syntax}`}
                    onSelect={() => setQuery(chip.syntax)}
                  >
                    <SlidersHorizontal />
                    <span>{chip.label}</span>
                    <CommandShortcut>{chip.syntax.trim()}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Navigation">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem
                      key={item.path}
                      value={item.label}
                      onSelect={() => onSelectEntity(item.path)}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          )}

          {/* ACTIVE STATE: Live categorized search results */}
          {isQueryActive && (
            <>
              {matchedPages.length > 0 && (
                <CommandGroup heading="Navigation">
                  {matchedPages.map((p) => {
                    const Icon = ICON_MAP[p.iconName] || LayoutDashboard
                    return (
                      <CommandItem
                        key={p.id}
                        value={`${p.title} ${p.subtitle}`}
                        onSelect={() => onSelectEntity(p.url, query)}
                      >
                        <Icon />
                        <span>{p.title}</span>
                        <CommandShortcut>{p.subtitle}</CommandShortcut>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {transactions.length > 0 && (
                <CommandGroup heading="Transactions">
                  {transactions.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={`${t.title} ${t.subtitle} ${t.amount}`}
                      onSelect={() => onSelectEntity(t.url, query)}
                    >
                      <ArrowLeftRight />
                      <span>{t.title}</span>
                      {t.amount !== undefined && (
                        <CommandShortcut>{formatCurrency(t.amount, t.currency)}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {wallets.length > 0 && (
                <CommandGroup heading="Accounts">
                  {wallets.map((w) => (
                    <CommandItem
                      key={w.id}
                      value={`${w.title} ${w.subtitle}`}
                      onSelect={() => onSelectEntity(w.url, query)}
                    >
                      <Wallet />
                      <span>{w.title}</span>
                      {w.amount !== undefined && (
                        <CommandShortcut>{formatCurrency(w.amount, w.currency)}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {(budgets.length > 0 || goals.length > 0) && (
                <CommandGroup heading="Budgets & Goals">
                  {budgets.map((b) => (
                    <CommandItem
                      key={b.id}
                      value={`${b.title} ${b.subtitle}`}
                      onSelect={() => onSelectEntity(b.url, query)}
                    >
                      <PiggyBank />
                      <span>{b.title}</span>
                      {b.amount !== undefined && (
                        <CommandShortcut>{formatCurrency(b.amount, b.currency)}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                  {goals.map((g) => (
                    <CommandItem
                      key={g.id}
                      value={`${g.title} ${g.subtitle}`}
                      onSelect={() => onSelectEntity(g.url, query)}
                    >
                      <Target />
                      <span>{g.title}</span>
                      {g.badge && <CommandShortcut>{g.badge.label}</CommandShortcut>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {recurring.length > 0 && (
                <CommandGroup heading="Recurring Platform">
                  {recurring.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={`${r.title} ${r.subtitle}`}
                      onSelect={() => onSelectEntity(r.url, query)}
                    >
                      <Repeat />
                      <span>{r.title}</span>
                      {r.amount !== undefined && (
                        <CommandShortcut>{formatCurrency(r.amount, r.currency)}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {investments.length > 0 && (
                <CommandGroup heading="Investments">
                  {investments.map((inv) => (
                    <CommandItem
                      key={inv.id}
                      value={`${inv.title} ${inv.subtitle}`}
                      onSelect={() => onSelectEntity(inv.url, query)}
                    >
                      <TrendingUp />
                      <span>{inv.title}</span>
                      {inv.amount !== undefined && (
                        <CommandShortcut>{formatCurrency(inv.amount, inv.currency)}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {(loans.length > 0 || contacts.length > 0) && (
                <CommandGroup heading="Loans & Contacts">
                  {loans.map((l) => (
                    <CommandItem
                      key={l.id}
                      value={`${l.title} ${l.subtitle}`}
                      onSelect={() => onSelectEntity(l.url, query)}
                    >
                      <HandCoins />
                      <span>{l.title}</span>
                      {l.amount !== undefined && (
                        <CommandShortcut>{formatCurrency(l.amount, l.currency)}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                  {contacts.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.title} ${c.subtitle}`}
                      onSelect={() => onSelectEntity(c.url, query)}
                    >
                      <Users />
                      <span>{c.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {assetsAndLiabilities.length > 0 && (
                <CommandGroup heading="Net Worth">
                  {assetsAndLiabilities.map((a) => (
                    <CommandItem
                      key={a.id}
                      value={`${a.title} ${a.subtitle}`}
                      onSelect={() => onSelectEntity(a.url, query)}
                    >
                      <Landmark />
                      <span>{a.title}</span>
                      {a.amount !== undefined && (
                        <CommandShortcut>{formatCurrency(a.amount, a.currency)}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandSeparator />

              <CommandGroup heading="Search Hub">
                <CommandItem
                  value={`search-hub-${query}`}
                  onSelect={() => onSelectEntity(`/search?q=${encodeURIComponent(query)}`, query)}
                >
                  <Search />
                  <span>Search all records in Search Hub</span>
                  <CommandShortcut>↵</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
