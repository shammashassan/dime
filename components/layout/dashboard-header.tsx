"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { SearchCommand } from "@/components/layout/search-command"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const PAGE_LABELS: Record<string, string> = {
  "": "Overview",
  "transactions": "Transactions",
  "wallets": "Wallets",
  "budgets": "Budgets",
  "goals": "Savings Goals",
  "recurring": "Recurring",
  "reports": "Reports",
  "categories": "Categories",
  "settings": "Settings",
  "admin": "Admin",
  "users": "User Management",
}

export function DashboardHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1] || ""
  const pageLabel =
    PAGE_LABELS[lastSegment] ??
    (lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1))
  const isHome = pathname === "/dashboard"

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md transition-all ease-linear">
      <div className="flex w-full items-center justify-between gap-2 px-4 lg:gap-4 lg:px-6">
        {/* Left: trigger + breadcrumb */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 hidden lg:block"
          />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 text-muted-foreground/60 transition-colors hover:text-foreground"
                  >
                    <Home className="size-4" />
                    Dime
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {!isHome && <BreadcrumbSeparator />}
              {!isHome && (
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground font-medium">
                    {pageLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <SearchCommand />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
