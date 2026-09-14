import { cache } from "react"
import { Filter, ObjectId } from "mongodb"
import {
  walletsCollection,
  transactionsCollection,
  categoriesCollection,
  budgetsCollection,
  recurringRulesCollection,
  loansCollection,
  contactsCollection,
  investmentHoldingsCollection,
  assetsCollection,
  goalsCollection,
} from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import { parseSearchQuery } from "@/lib/search/parser"
import type {
  SearchResultItem,
  SearchEntityType,
  UniversalSearchResults,
  ParsedSearchQuery,
} from "@/lib/search/types"
import type {
  Transaction,
  Wallet,
  Budget,
  Goal,
  RecurringRule,
  Loan,
  Contact,
  InvestmentHolding,
  Asset,
} from "@/types"

export interface SearchOptions {
  limitPerEntity?: number
  allowedEntities?: SearchEntityType[]
}

interface PageNavigationItem {
  id: string
  title: string
  subtitle: string
  url: string
  iconName: string
  keywords: string[]
}

const APP_PAGES: PageNavigationItem[] = [
  {
    id: "page-dashboard",
    title: "Overview",
    subtitle: "Dashboard & financial overview",
    url: "/dashboard",
    iconName: "LayoutDashboard",
    keywords: ["dashboard", "overview", "home", "stats", "kpi", "metrics", "summary"],
  },
  {
    id: "page-transactions",
    title: "Transactions",
    subtitle: "Income, expenses, and ledger entries",
    url: "/transactions",
    iconName: "ArrowLeftRight",
    keywords: ["transactions", "expenses", "income", "transfers", "ledger", "payments", "history", "spend"],
  },
  {
    id: "page-wallets",
    title: "Wallets & Accounts",
    subtitle: "Bank accounts, cash, credit cards",
    url: "/wallets",
    iconName: "Wallet",
    keywords: ["wallets", "accounts", "banks", "cash", "credit", "cards", "balances"],
  },
  {
    id: "page-budgets",
    title: "Budgets",
    subtitle: "Spending limits and category allocations",
    url: "/budgets",
    iconName: "PiggyBank",
    keywords: ["budgets", "spending limits", "allowance", "category budgets", "targets"],
  },
  {
    id: "page-goals",
    title: "Savings Goals",
    subtitle: "Target savings and progress trackers",
    url: "/goals",
    iconName: "Target",
    keywords: ["goals", "savings", "targets", "emergency fund", "vacation fund", "milestones"],
  },
  {
    id: "page-recurring",
    title: "Recurring Platform",
    subtitle: "Subscriptions, recurring bills & utilities",
    url: "/recurring",
    iconName: "Repeat",
    keywords: ["recurring", "subscriptions", "bills", "utilities", "netflix", "spotify", "renewals"],
  },
  {
    id: "page-investments",
    title: "Investment Portfolio",
    subtitle: "Holdings, stocks, crypto, mutual funds",
    url: "/investments",
    iconName: "TrendingUp",
    keywords: ["investments", "portfolio", "stocks", "etf", "crypto", "mutual funds", "holdings", "shares"],
  },
  {
    id: "page-loans",
    title: "Loans & Lending",
    subtitle: "Money lent, borrowed, and repayments",
    url: "/loans",
    iconName: "HandCoins",
    keywords: ["loans", "lending", "borrowed", "lent", "debts", "repayments", "iou"],
  },
  {
    id: "page-contacts",
    title: "Contacts Directory",
    subtitle: "People, debtors, and creditors",
    url: "/contacts",
    iconName: "Users",
    keywords: ["contacts", "people", "directory", "debtors", "creditors", "friends"],
  },
  {
    id: "page-shared-expenses",
    title: "Shared Expenses",
    subtitle: "Split expenses and settle balances",
    url: "/shared-expenses",
    iconName: "Split",
    keywords: ["shared expenses", "split", "settle", "balances", "groups", "spaces"],
  },
  {
    id: "page-net-worth",
    title: "Net Worth",
    subtitle: "Total assets and liabilities tracking",
    url: "/net-worth",
    iconName: "Landmark",
    keywords: ["net worth", "assets", "liabilities", "wealth", "real estate", "vehicles", "property"],
  },
  {
    id: "page-calendar",
    title: "Cash Flow Calendar",
    subtitle: "Future balances and upcoming payments",
    url: "/calendar",
    iconName: "CalendarDays",
    keywords: ["calendar", "cash flow", "schedule", "due dates", "upcoming", "forecast calendar"],
  },
  {
    id: "page-health",
    title: "Financial Health Score",
    subtitle: "0-100 wellness score and recommendations",
    url: "/health",
    iconName: "Activity",
    keywords: ["health", "score", "wellness", "financial health", "recommendations", "grade"],
  },
  {
    id: "page-insights",
    title: "AI Spending Insights",
    subtitle: "Anomalies, spending spikes, and tips",
    url: "/insights",
    iconName: "Sparkles",
    keywords: ["insights", "ai", "anomalies", "spikes", "spending insights", "gemini", "tips"],
  },
  {
    id: "page-planner",
    title: "Financial Planner",
    subtitle: "Cash flow projections and what-if scenarios",
    url: "/planner",
    iconName: "LineChart",
    keywords: ["planner", "forecasting", "scenarios", "what if", "simulations", "future projection"],
  },
  {
    id: "page-reports",
    title: "Reports & Analytics",
    subtitle: "Historical trends, charts, category breakdown",
    url: "/reports",
    iconName: "BarChart3",
    keywords: ["reports", "analytics", "charts", "trends", "spending trends", "breakdown"],
  },
  {
    id: "page-categories",
    title: "Categories",
    subtitle: "Transaction categories and tax classes",
    url: "/categories",
    iconName: "Tags",
    keywords: ["categories", "tags", "taxonomies", "classification"],
  },
  {
    id: "page-notifications",
    title: "Notifications Center",
    subtitle: "Financial inbox, reminders, and alerts",
    url: "/notifications",
    iconName: "Bell",
    keywords: ["notifications", "alerts", "inbox", "reminders", "warnings"],
  },
  {
    id: "page-settings",
    title: "Settings & Profile",
    subtitle: "Preferences, automation rules, currencies",
    url: "/settings",
    iconName: "Settings",
    keywords: ["settings", "preferences", "profile", "automation rules", "currency", "rules"],
  },
  {
    id: "page-admin",
    title: "Admin Management",
    subtitle: "User approvals, spaces, system access",
    url: "/admin",
    iconName: "Shield",
    keywords: ["admin", "users", "organization", "management", "roles"],
  },
]

export const searchEntities = cache(
  async (
    userId: string,
    rawQuery: string,
    options: SearchOptions = {}
  ): Promise<UniversalSearchResults> => {
    const limit = options.limitPerEntity || 5
    const parsedQuery: ParsedSearchQuery = parseSearchQuery(rawQuery)
    const { textQuery, operators } = parsedQuery

    const countsByEntity: Record<SearchEntityType, number> = {
      transaction: 0,
      wallet: 0,
      budget: 0,
      goal: 0,
      loan: 0,
      contact: 0,
      recurring: 0,
      investment: 0,
      asset: 0,
      liability: 0,
      page: 0,
    }

    const items: SearchResultItem[] = []

    // If query is completely empty and no operators, return empty structure
    if (!textQuery && Object.keys(operators).length === 0) {
      return {
        totalCount: 0,
        items: [],
        countsByEntity,
        parsedQuery,
      }
    }

    const scope = await getFinancialScope()
    const scopeFilter = getScopeFilter(scope)

    // Check entity type filtering
    const shouldQuery = (type: SearchEntityType): boolean => {
      if (options.allowedEntities && !options.allowedEntities.includes(type)) {
        return false
      }
      if (operators.entityTypes && operators.entityTypes.length > 0) {
        return operators.entityTypes.includes(type)
      }
      return true
    }

    // Prepare regex for text matching
    const safeEscape = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const textRegex = textQuery ? new RegExp(safeEscape(textQuery), "i") : null

    // Parallel fetch lookups for categories and wallets to enrich search and filter mapping
    const [categories, wallets] = await Promise.all([
      categoriesCollection.find({ ...scopeFilter }).project({ _id: 1, name: 1, color: 1, icon: 1 }).toArray(),
      walletsCollection.find({ ...scopeFilter, isArchived: false }).project({ _id: 1, name: 1, currency: 1, type: 1 }).toArray(),
    ])

    const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]))
    const walletMap = new Map(wallets.map((w) => [w._id.toString(), w]))

    // Match category IDs if category operator is used
    let matchedCategoryIds: string[] | undefined
    if (operators.category) {
      const catRegex = new RegExp(safeEscape(operators.category), "i")
      matchedCategoryIds = categories.filter((c) => catRegex.test(c.name)).map((c) => c._id.toString())
    }

    // Match wallet IDs if wallet operator is used
    let matchedWalletIds: string[] | undefined
    if (operators.wallet) {
      const wRegex = new RegExp(safeEscape(operators.wallet), "i")
      matchedWalletIds = wallets.filter((w) => wRegex.test(w.name)).map((w) => w._id.toString())
    }

    // Helper for amount filtering
    const buildAmountFilter = () => {
      if (operators.exactAmount !== undefined) return operators.exactAmount
      const filter: { $gte?: number; $lte?: number } = {}
      if (operators.minAmount !== undefined) filter.$gte = operators.minAmount
      if (operators.maxAmount !== undefined) filter.$lte = operators.maxAmount
      return Object.keys(filter).length > 0 ? filter : undefined
    }

    const amountFilter = buildAmountFilter()

    // 1. App Pages Match
    if (shouldQuery("page") && textQuery) {
      const matchedPages = APP_PAGES.filter((page) => {
        return (
          page.title.toLowerCase().includes(textQuery.toLowerCase()) ||
          page.subtitle.toLowerCase().includes(textQuery.toLowerCase()) ||
          page.keywords.some((k) => k.includes(textQuery.toLowerCase()))
        )
      })

      countsByEntity.page = matchedPages.length
      matchedPages.slice(0, limit).forEach((p) => {
        items.push({
          id: p.id,
          entityType: "page",
          title: p.title,
          subtitle: p.subtitle,
          url: p.url,
          iconName: p.iconName,
          badge: { label: "Navigation", variant: "outline" },
        })
      })
    }

    // Parallel entity queries
    const queryPromises: Promise<void>[] = []

    // 2. Transactions Query
    if (shouldQuery("transaction")) {
      queryPromises.push(
        (async () => {
          const query: Filter<Transaction> = {
            ...scopeFilter,
          }

          if (operators.type) query.type = operators.type
          if (operators.currency) query.currency = operators.currency
          if (operators.isSplit) query.isSplit = true
          if (operators.status === "flagged") query.isFlagged = true
          if (operators.status === "review") query.needsReview = true

          if (operators.startDate || operators.endDate) {
            const dateQ: { $gte?: Date; $lte?: Date } = {}
            if (operators.startDate) dateQ.$gte = operators.startDate
            if (operators.endDate) dateQ.$lte = operators.endDate
            query.date = dateQ
          }

          if (amountFilter !== undefined) {
            query.amount = amountFilter
          }

          if (matchedCategoryIds !== undefined) {
            query.$or = [
              { categoryId: { $in: matchedCategoryIds } },
              { "splits.categoryId": { $in: matchedCategoryIds } },
            ]
          }

          if (matchedWalletIds !== undefined) {
            query.walletId = { $in: matchedWalletIds }
          }

          if (operators.tag) {
            query.tags = { $in: [new RegExp(safeEscape(operators.tag), "i")] }
          }

          if (operators.merchant) {
            query.description = { $regex: safeEscape(operators.merchant), $options: "i" }
          }

          if (textRegex) {
            query.$or = [
              { description: { $regex: textRegex } },
              { notes: { $regex: textRegex } },
              { tags: { $in: [textRegex] } },
            ]
          }

          const [txCount, txList] = await Promise.all([
            transactionsCollection.countDocuments(query),
            transactionsCollection
              .find(query)
              .sort({ date: -1 })
              .limit(limit)
              .toArray(),
          ])

          countsByEntity.transaction = txCount

          txList.forEach((t) => {
            const category = t.categoryId ? categoryMap.get(t.categoryId) : undefined
            const wallet = t.walletId ? walletMap.get(t.walletId) : undefined
            const subtitleParts = [
              wallet ? wallet.name : null,
              category ? category.name : null,
              t.date ? new Date(t.date).toISOString().slice(0, 10) : null,
            ].filter(Boolean)

            items.push({
              id: t._id.toString(),
              entityType: "transaction",
              title: t.description || "Untitled Transaction",
              subtitle: subtitleParts.join(" • "),
              amount: t.amount,
              currency: t.currency || "USD",
              date: t.date ? new Date(t.date).toISOString().slice(0, 10) : undefined,
              url: `/transactions/${t._id.toString()}`,
              iconName: "ArrowLeftRight",
              badge: {
                label: t.type.toUpperCase(),
                variant: t.type === "income" ? "default" : t.type === "expense" ? "secondary" : "outline",
              },
            })
          })
        })()
      )
    }

    // 3. Wallets Query
    if (shouldQuery("wallet")) {
      queryPromises.push(
        (async () => {
          const query: Filter<Wallet> = {
            ...scopeFilter,
            isArchived: false,
          }

          if (operators.currency) query.currency = operators.currency
          if (textRegex) {
            query.$or = [
              { name: { $regex: textRegex } },
              { type: { $regex: textRegex } },
            ]
          }

          const [wCount, wList] = await Promise.all([
            walletsCollection.countDocuments(query),
            walletsCollection.find(query).limit(limit).toArray(),
          ])

          countsByEntity.wallet = wCount

          wList.forEach((w) => {
            items.push({
              id: w._id.toString(),
              entityType: "wallet",
              title: w.name,
              subtitle: `${w.type.toUpperCase()} Account • ${w.currency}`,
              amount: w.balance,
              currency: w.currency,
              url: `/wallets/${w._id.toString()}`,
              iconName: "Wallet",
              badge: { label: w.type, variant: "outline" },
            })
          })
        })()
      )
    }

    // 4. Budgets Query
    if (shouldQuery("budget")) {
      queryPromises.push(
        (async () => {
          const query: Filter<Budget> = {
            ...scopeFilter,
          }

          if (matchedCategoryIds !== undefined) {
            query.categoryId = { $in: matchedCategoryIds }
          }

          if (amountFilter !== undefined) {
            query.amount = amountFilter
          }

          if (textRegex) {
            query.name = { $regex: textRegex }
          }

          const [bCount, bList] = await Promise.all([
            budgetsCollection.countDocuments(query),
            budgetsCollection.find(query).limit(limit).toArray(),
          ])

          countsByEntity.budget = bCount

          bList.forEach((b) => {
            const cat = b.categoryId ? categoryMap.get(b.categoryId) : undefined
            items.push({
              id: b._id.toString(),
              entityType: "budget",
              title: b.name,
              subtitle: `Budget • ${cat ? cat.name + " • " : ""}${b.period || "monthly"}`,
              amount: b.amount,
              currency: b.currency || "USD",
              url: `/budgets/${b._id.toString()}`,
              iconName: "PiggyBank",
              badge: { label: b.period || "budget", variant: "secondary" },
            })
          })
        })()
      )
    }

    // 5. Goals Query
    if (shouldQuery("goal")) {
      queryPromises.push(
        (async () => {
          const query: Filter<Goal> = {
            ...scopeFilter,
          }

          if (operators.status === "completed") {
            query.$expr = { $gte: ["$currentAmount", "$targetAmount"] }
          } else if (operators.status === "active") {
            query.$expr = { $lt: ["$currentAmount", "$targetAmount"] }
          }

          if (textRegex) {
            query.name = { $regex: textRegex }
          }

          const [gCount, gList] = await Promise.all([
            goalsCollection.countDocuments(query),
            goalsCollection.find(query).limit(limit).toArray(),
          ])

          countsByEntity.goal = gCount

          gList.forEach((g) => {
            const progress = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0
            items.push({
              id: g._id.toString(),
              entityType: "goal",
              title: g.name,
              subtitle: `Goal: ${progress}% reached • Target: ${(g.targetAmount / 100).toFixed(2)} ${g.currency}`,
              amount: g.currentAmount,
              currency: g.currency,
              url: `/goals/${g._id.toString()}`,
              iconName: "Target",
              badge: { label: `${progress}%`, variant: progress >= 100 ? "default" : "secondary" },
            })
          })
        })()
      )
    }

    // 6. Recurring Platform Query (Subscriptions & Bills)
    if (shouldQuery("recurring")) {
      queryPromises.push(
        (async () => {
          const query: Filter<RecurringRule> = {
            ...scopeFilter,
          }

          if (operators.kind) query.kind = operators.kind
          if (operators.frequency) query.frequency = operators.frequency as RecurringRule["frequency"]
          if (operators.currency) query.currency = operators.currency
          if (operators.status) {
            if (operators.status === "active") query.isActive = true
            else if (operators.status === "paused" || operators.status === "cancelled") query.status = operators.status as RecurringRule["status"]
          }

          if (textRegex) {
            query.$or = [
              { description: { $regex: textRegex } },
              { providerName: { $regex: textRegex } },
            ]
          }

          const [rCount, rList] = await Promise.all([
            recurringRulesCollection.countDocuments(query),
            recurringRulesCollection.find(query).limit(limit).toArray(),
          ])

          countsByEntity.recurring = rCount

          rList.forEach((r) => {
            const isSub = r.kind === "subscription"
            const isBill = r.kind === "bill"
            const label = isSub ? "Subscription" : isBill ? "Bill" : "Recurring"

            items.push({
              id: r._id.toString(),
              entityType: "recurring",
              title: r.description || r.providerName || "Recurring Item",
              subtitle: `${label} • ${r.frequency} • Next: ${r.nextDueDate ? new Date(r.nextDueDate).toISOString().slice(0, 10) : "N/A"}`,
              amount: r.amount,
              currency: r.currency || "USD",
              url: `/recurring/${r._id.toString()}`,
              iconName: "Repeat",
              badge: { label, variant: isSub ? "default" : "secondary" },
            })
          })
        })()
      )
    }

    // 7. Loans Query
    if (shouldQuery("loan")) {
      queryPromises.push(
        (async () => {
          const query: Filter<Loan> = {
            ...scopeFilter,
          }

          if (operators.status) {
            query.status = operators.status as Loan["status"]
          }

          if (operators.person) {
            query.personName = { $regex: safeEscape(operators.person), $options: "i" }
          }

          if (textRegex) {
            query.$or = [
              { personName: { $regex: textRegex } },
              { notes: { $regex: textRegex } },
            ]
          }

          const [lCount, lList] = await Promise.all([
            loansCollection.countDocuments(query),
            loansCollection.find(query).limit(limit).toArray(),
          ])

          countsByEntity.loan = lCount

          lList.forEach((l) => {
            const isLent = l.type === "lent"
            items.push({
              id: l._id.toString(),
              entityType: "loan",
              title: `${isLent ? "Lent to" : "Borrowed from"} ${l.personName}`,
              subtitle: `Status: ${l.status.replace("_", " ")} • Due: ${l.dueDate ? new Date(l.dueDate).toISOString().slice(0, 10) : "No date"}`,
              amount: l.remainingAmount,
              currency: l.currency,
              url: `/loans/${l._id.toString()}`,
              iconName: "HandCoins",
              badge: {
                label: isLent ? "Money Lent" : "Borrowed",
                variant: isLent ? "default" : "destructive",
              },
            })
          })
        })()
      )
    }

    // 8. Contacts Query
    if (shouldQuery("contact")) {
      queryPromises.push(
        (async () => {
          const query: Filter<Contact> = {
            ...scopeFilter,
          }

          if (operators.person) {
            query.name = { $regex: safeEscape(operators.person), $options: "i" }
          }

          if (textRegex) {
            query.$or = [
              { name: { $regex: textRegex } },
              { email: { $regex: textRegex } },
              { phone: { $regex: textRegex } },
            ]
          }

          const [cCount, cList] = await Promise.all([
            contactsCollection.countDocuments(query),
            contactsCollection.find(query).limit(limit).toArray(),
          ])

          countsByEntity.contact = cCount

          cList.forEach((c) => {
            items.push({
              id: c._id.toString(),
              entityType: "contact",
              title: c.name,
              subtitle: c.email || c.phone || "Contact",
              url: `/contacts/${c._id.toString()}`,
              iconName: "Users",
              badge: { label: "Contact", variant: "outline" },
            })
          })
        })()
      )
    }

    // 9. Investment Holdings Query
    if (shouldQuery("investment")) {
      queryPromises.push(
        (async () => {
          const query: Filter<InvestmentHolding> = {
            ...scopeFilter,
            status: "active",
          }

          if (operators.assetClass) {
            query.assetType = operators.assetClass as InvestmentHolding["assetType"]
          }

          if (textRegex) {
            query.$or = [
              { symbol: { $regex: textRegex } },
              { name: { $regex: textRegex } },
            ]
          }

          const [iCount, iList] = await Promise.all([
            investmentHoldingsCollection.countDocuments(query),
            investmentHoldingsCollection.find(query).limit(limit).toArray(),
          ])

          countsByEntity.investment = iCount

          iList.forEach((h) => {
            const holdingValue = Math.round(h.quantity * h.currentPrice)
            items.push({
              id: h._id.toString(),
              entityType: "investment",
              title: `${h.symbol} • ${h.name}`,
              subtitle: `${h.assetType.toUpperCase()} • Qty: ${h.quantity} @ ${(h.currentPrice / 100).toFixed(2)} ${h.currency}`,
              amount: holdingValue,
              currency: h.currency,
              url: `/investments/${h.walletId}/${h.symbol}`,
              iconName: "TrendingUp",
              badge: { label: h.assetType, variant: "secondary" },
            })
          })
        })()
      )
    }

    // 10. Assets & Liabilities Query
    if (shouldQuery("asset") || shouldQuery("liability")) {
      queryPromises.push(
        (async () => {
          const query: Filter<Asset> = {
            ...scopeFilter,
            isArchived: false,
          }

          if (operators.assetClass) {
            query.category = operators.assetClass as Asset["category"]
          }

          if (textRegex) {
            query.$or = [
              { name: { $regex: textRegex } },
              { category: { $regex: textRegex } },
            ]
          }

          const [aCount, aList] = await Promise.all([
            assetsCollection.countDocuments(query),
            assetsCollection.find(query).limit(limit).toArray(),
          ])

          aList.forEach((a) => {
            if (a.kind === "liability") {
              countsByEntity.liability++
              items.push({
                id: a._id.toString(),
                entityType: "liability",
                title: a.name,
                subtitle: `Liability • ${a.category.replace("_", " ")}`,
                amount: a.currentValue,
                currency: a.currency,
                url: `/net-worth/assets/${a._id.toString()}`,
                iconName: "Landmark",
                badge: { label: "Liability", variant: "destructive" },
              })
            } else {
              countsByEntity.asset++
              items.push({
                id: a._id.toString(),
                entityType: "asset",
                title: a.name,
                subtitle: `Asset • ${a.category.replace("_", " ")}`,
                amount: a.currentValue,
                currency: a.currency,
                url: `/net-worth/assets/${a._id.toString()}`,
                iconName: "Landmark",
                badge: { label: "Asset", variant: "default" },
              })
            }
          })
        })()
      )
    }

    // Await all parallel searches
    await Promise.all(queryPromises)

    const totalCount = Object.values(countsByEntity).reduce((sum, c) => sum + c, 0)

    return {
      totalCount,
      items,
      countsByEntity,
      parsedQuery,
    }
  }
)
