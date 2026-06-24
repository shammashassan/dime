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
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { authClient } from "@/lib/auth-client"

export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const user = session?.user as { role?: string | null } | undefined
  const isAdmin = user?.role === "admin"

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const onSelectEntity = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  const navigationItems = [
    { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { path: "/transactions", label: "Transactions", icon: ArrowLeftRight },
    { path: "/wallets", label: "Wallets", icon: Wallet },
    { path: "/budgets", label: "Budgets", icon: PiggyBank },
    { path: "/goals", label: "Savings Goals", icon: Target },
    { path: "/recurring", label: "Recurring Transactions", icon: Repeat },
    { path: "/reports", label: "Reports & Analytics", icon: BarChart3 },
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-40 sm:w-56 md:w-64 items-center gap-2 rounded-lg border border-input bg-muted/30 px-3 text-xs sm:text-sm text-muted-foreground transition-all hover:bg-muted"
      >
        <Search className="size-3.5" aria-hidden="true" />
        <span className="flex-1 text-left font-medium">Search pages...</span>
        <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Dime Navigation" description="Navigate to other pages in your workspace.">
        <CommandInput
          placeholder="Search pages..."
        />
        <CommandList className="max-h-80 overflow-y-auto">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate To">
            {navigationItems.map(item => {
              const Icon = item.icon
              return (
                <CommandItem key={item.path} onSelect={() => onSelectEntity(item.path)}>
                  <Icon className="mr-2 size-4 text-muted-foreground" aria-hidden="true" />
                  <span>{item.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
