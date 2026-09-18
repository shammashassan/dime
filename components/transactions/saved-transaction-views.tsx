"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { format, startOfMonth, endOfMonth, subMonths, subDays, startOfYear } from "date-fns"
import {
  Layers,
  Calendar,
  CalendarDays,
  CalendarRange,
  History,
  Sparkles,
  Bookmark,
  Plus,
  Trash2,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getCurrencySymbol } from "@/lib/utils"

export interface SavedViewItem {
  id: string
  name: string
  queryString: string
  createdAt: number
}

export interface SavedTransactionViewsProps {
  defaultCurrency?: string
}

const STORAGE_KEY = "dime_saved_transaction_views"

export function SavedTransactionViews({ defaultCurrency = "USD" }: SavedTransactionViewsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [savedViews, setSavedViews] = React.useState<SavedViewItem[]>([])
  const [manageModalOpen, setManageModalOpen] = React.useState(false)
  const [viewName, setViewName] = React.useState("")

  // Load custom saved views from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as SavedViewItem[]
        setSavedViews(parsed)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const saveViewsToStorage = (views: SavedViewItem[]) => {
    setSavedViews(views)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
    } catch {
      // Ignore
    }
  }

  // Calculate built-in preset date query strings
  const today = new Date()
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd")

  const lastMonthDate = subMonths(today, 1)
  const lastMonthStart = format(startOfMonth(lastMonthDate), "yyyy-MM-dd")
  const lastMonthEnd = format(endOfMonth(lastMonthDate), "yyyy-MM-dd")

  const thirtyDaysAgo = format(subDays(today, 30), "yyyy-MM-dd")
  const todayStr = format(today, "yyyy-MM-dd")

  const yearStart = format(startOfYear(today), "yyyy-MM-dd")

  const { majorAmount, majorAmountFormatted } = React.useMemo(() => {
    const upper = defaultCurrency.toUpperCase()
    let amount = 100
    if (upper === "INR") amount = 5000
    else if (upper === "JPY") amount = 10000
    else if (upper === "KRW") amount = 100000
    else if (upper === "VND" || upper === "IDR") amount = 1000000

    const symbol = getCurrencySymbol(defaultCurrency)
    return {
      majorAmount: amount,
      majorAmountFormatted: `${symbol}${amount.toLocaleString()}`,
    }
  }, [defaultCurrency])

  const PRESETS = React.useMemo(
    () => [
      {
        id: "all",
        label: "All Transactions",
        shortLabel: "All Views",
        icon: <Layers className="size-3.5 text-muted-foreground shrink-0" />,
        matches: (params: URLSearchParams) => {
          const ignored = new Set(["page", "pageSize", "sortBy", "sortOrder"])
          return Array.from(params.keys()).every((k) => ignored.has(k))
        },
        apply: () => {
          const params = new URLSearchParams()
          if (searchParams.has("sortBy")) params.set("sortBy", searchParams.get("sortBy")!)
          if (searchParams.has("sortOrder")) params.set("sortOrder", searchParams.get("sortOrder")!)
          router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname)
        },
      },
      {
        id: "this-month",
        label: "This Month",
        shortLabel: "This Month",
        icon: <Calendar className="size-3.5 text-indigo-500 shrink-0" />,
        matches: (params: URLSearchParams) => {
          const from = params.get("from")?.slice(0, 10)
          const to = params.get("to")?.slice(0, 10)
          return from === monthStart && to === monthEnd && !params.has("type") && !params.has("minAmount")
        },
        apply: () => {
          const params = new URLSearchParams()
          params.set("from", monthStart)
          params.set("to", monthEnd)
          router.push(`${pathname}?${params.toString()}`)
        },
      },
      {
        id: "last-month",
        label: "Last Month",
        shortLabel: "Last Month",
        icon: <CalendarDays className="size-3.5 text-blue-500 shrink-0" />,
        matches: (params: URLSearchParams) => {
          const from = params.get("from")?.slice(0, 10)
          const to = params.get("to")?.slice(0, 10)
          return from === lastMonthStart && to === lastMonthEnd && !params.has("type") && !params.has("minAmount")
        },
        apply: () => {
          const params = new URLSearchParams()
          params.set("from", lastMonthStart)
          params.set("to", lastMonthEnd)
          router.push(`${pathname}?${params.toString()}`)
        },
      },
      {
        id: "last-30-days",
        label: "Last 30 Days",
        shortLabel: "Last 30 Days",
        icon: <History className="size-3.5 text-teal-500 shrink-0" />,
        matches: (params: URLSearchParams) => {
          const from = params.get("from")?.slice(0, 10)
          const to = params.get("to")?.slice(0, 10)
          return from === thirtyDaysAgo && to === todayStr && !params.has("type") && !params.has("minAmount")
        },
        apply: () => {
          const params = new URLSearchParams()
          params.set("from", thirtyDaysAgo)
          params.set("to", todayStr)
          router.push(`${pathname}?${params.toString()}`)
        },
      },
      {
        id: "year-to-date",
        label: "Year to Date",
        shortLabel: "Year to Date",
        icon: <CalendarRange className="size-3.5 text-violet-500 shrink-0" />,
        matches: (params: URLSearchParams) => {
          const from = params.get("from")?.slice(0, 10)
          const to = params.get("to")?.slice(0, 10)
          return from === yearStart && to === todayStr && !params.has("type") && !params.has("minAmount")
        },
        apply: () => {
          const params = new URLSearchParams()
          params.set("from", yearStart)
          params.set("to", todayStr)
          router.push(`${pathname}?${params.toString()}`)
        },
      },
      {
        id: "major-expenses",
        label: `Major Expenses (>${majorAmountFormatted})`,
        shortLabel: "Major Expenses",
        icon: <Sparkles className="size-3.5 text-amber-500 shrink-0" />,
        matches: (params: URLSearchParams) => {
          return params.get("type") === "expense" && params.get("minAmount") === String(majorAmount)
        },
        apply: () => {
          const params = new URLSearchParams()
          params.set("type", "expense")
          params.set("minAmount", String(majorAmount))
          router.push(`${pathname}?${params.toString()}`)
        },
      },
    ],
    [
      monthStart,
      monthEnd,
      lastMonthStart,
      lastMonthEnd,
      thirtyDaysAgo,
      todayStr,
      yearStart,
      majorAmount,
      majorAmountFormatted,
      pathname,
      router,
      searchParams,
    ]
  )

  const activePreset = React.useMemo(
    () => PRESETS.find((p) => p.matches(searchParams)),
    [PRESETS, searchParams]
  )

  const activeCustomView = React.useMemo(
    () => savedViews.find((v) => searchParams.toString() === v.queryString),
    [savedViews, searchParams]
  )

  const isCurrentFilterCustom = React.useMemo(() => {
    const filterKeys = ["type", "wallets", "categories", "status", "from", "to", "minAmount", "maxAmount", "search"]
    const hasActiveFilter = filterKeys.some((k) => searchParams.has(k))
    return !activePreset && !activeCustomView && hasActiveFilter
  }, [activeCustomView, activePreset, searchParams])

  const activeValue = activeCustomView
    ? activeCustomView.id
    : activePreset
      ? activePreset.id
      : "all"

  const handleValueChange = (val: string) => {
    if (val === "save-current" || val === "manage-views") {
      setManageModalOpen(true)
      return
    }

    const preset = PRESETS.find((p) => p.id === val)
    if (preset) {
      preset.apply()
      return
    }

    const customView = savedViews.find((v) => v.id === val)
    if (customView) {
      router.push(`${pathname}?${customView.queryString}`)
    }
  }

  const handleSaveCustomView = () => {
    const trimmed = viewName.trim()
    if (!trimmed) return

    const cleanParams = new URLSearchParams(searchParams.toString())
    cleanParams.delete("page")

    const newView: SavedViewItem = {
      id: "view_" + Date.now(),
      name: trimmed,
      queryString: cleanParams.toString(),
      createdAt: Date.now(),
    }

    const updated = [...savedViews, newView]
    saveViewsToStorage(updated)
    setViewName("")
    setManageModalOpen(false)
    toast.success(`Saved view "${trimmed}" created`)
  }

  const handleDeleteCustomView = (id: string) => {
    const updated = savedViews.filter((v) => v.id !== id)
    saveViewsToStorage(updated)
    toast.success("Saved view removed")
  }

  return (
    <>
      <Select value={activeValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full h-9">
          <SelectValue placeholder="All Views" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Layers className="size-3.5 text-muted-foreground shrink-0" />
                <span>All Views</span>
              </div>
            </SelectItem>
            <SelectItem value="this-month">
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 text-indigo-500 shrink-0" />
                <span>This Month</span>
              </div>
            </SelectItem>
            <SelectItem value="last-month">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-3.5 text-blue-500 shrink-0" />
                <span>Last Month</span>
              </div>
            </SelectItem>
            <SelectItem value="last-30-days">
              <div className="flex items-center gap-2">
                <History className="size-3.5 text-teal-500 shrink-0" />
                <span>Last 30 Days</span>
              </div>
            </SelectItem>
            <SelectItem value="year-to-date">
              <div className="flex items-center gap-2">
                <CalendarRange className="size-3.5 text-violet-500 shrink-0" />
                <span>Year to Date</span>
              </div>
            </SelectItem>
            <SelectItem value="major-expenses">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                <span>Major Expenses (&gt;{majorAmountFormatted})</span>
              </div>
            </SelectItem>

            {/* Custom Saved Views */}
            {savedViews.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                <div className="flex items-center gap-2">
                  <Bookmark className="size-3.5 text-violet-500 shrink-0" />
                  <span className="truncate">{v.name}</span>
                </div>
              </SelectItem>
            ))}

            {/* Actions */}
            {isCurrentFilterCustom && (
              <SelectItem value="save-current">
                <div className="flex items-center gap-2">
                  <Plus className="size-3.5 text-primary shrink-0" />
                  <span>Save view...</span>
                </div>
              </SelectItem>
            )}
            {savedViews.length > 0 && (
              <SelectItem value="manage-views">
                <div className="flex items-center gap-2">
                  <Bookmark className="size-3.5 text-muted-foreground shrink-0" />
                  <span>Manage views...</span>
                </div>
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Save & Manage Views Modal */}
      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Saved Views</DialogTitle>
            <DialogDescription>
              Save your current filter setup or manage your existing saved views.
            </DialogDescription>
          </DialogHeader>

          {isCurrentFilterCustom && (
            <div className="space-y-2 py-2">
              <div className="text-xs font-semibold text-foreground">Save Current View</div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. Monthly Grocery Spend..."
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSaveCustomView()
                    }
                  }}
                  className="h-9 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleSaveCustomView}
                  disabled={!viewName.trim()}
                  className="h-9 px-4 text-xs font-semibold shrink-0"
                >
                  Save
                </Button>
              </div>
            </div>
          )}

          {savedViews.length > 0 ? (
            <div className="space-y-2 py-2">
              <div className="text-xs font-semibold text-foreground">Your Saved Views</div>
              <div className="divide-y divide-border/40 rounded-xl border border-border/40 overflow-hidden">
                {savedViews.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-2.5 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Bookmark className="size-3.5 text-primary shrink-0" />
                      <span className="font-medium truncate">{v.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteCustomView(v.id)}
                      title="Delete view"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : !isCurrentFilterCustom && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No custom views saved yet. Apply filters on transactions to save a custom view.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
