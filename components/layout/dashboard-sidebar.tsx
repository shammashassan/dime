"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import {
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
  LogOut,
  ChevronsUpDown,
  HandCoins,
  Users,
  TrendingUp,
  LineChart,
  Users2,
  Calculator,
  CalendarDays,
  Activity,
  Sparkles,
  History,
  Compass,
  ChevronRight,
  Bell,
} from "lucide-react"
import { SpaceSwitcher } from "@/components/layout/space-switcher"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"

type NavSubItem = {
  title: string
  href: string
}

type NavItem = {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  items?: NavSubItem[]
}

export const NAV_MAIN: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Money",
    icon: Wallet,
    items: [
      { title: "Transactions", href: "/transactions" },
      { title: "Wallets", href: "/wallets" },
      { title: "Investments", href: "/investments" },
      { title: "Net Worth", href: "/net-worth" },
    ],
  },
  {
    title: "People",
    icon: Users,
    items: [
      { title: "Contacts", href: "/contacts" },
      { title: "Shared Expenses", href: "/shared-expenses" },
      { title: "Loans", href: "/loans" },
    ],
  },
  {
    title: "Planning",
    icon: CalendarDays,
    items: [
      { title: "Budgets", href: "/budgets" },
      { title: "Goals", href: "/goals" },
      { title: "Planner", href: "/planner" },
      { title: "Calendar", href: "/calendar" },
      { title: "Recurring", href: "/recurring" },
    ],
  },
  {
    title: "Insights",
    icon: Sparkles,
    items: [
      { title: "Reports", href: "/reports" },
      { title: "Health Score", href: "/health" },
      { title: "AI Insights", href: "/insights" },
      { title: "Financial Coach", href: "/coach" },
    ],
  },
  {
    title: "Organization",
    icon: Tags,
    items: [
      { title: "Categories", href: "/categories" },
    ],
  },
]

export const NAV_ITEMS = NAV_MAIN.flatMap((item) =>
  item.items
    ? item.items.map((sub) => ({ title: sub.title, href: sub.href, icon: item.icon }))
    : [{ title: item.title, href: item.href!, icon: item.icon }]
)

type SidebarUser = {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

function SidebarNav({
  isAdmin,
  onLinkClick,
}: {
  isAdmin: boolean
  onLinkClick: () => void
}) {
  const pathname = usePathname()
  const { state, setOpen } = useSidebar()
  const isCollapsed = state === "collapsed"

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const item of NAV_MAIN) {
      if (item.items) {
        initial[item.title] = item.items.some((subItem) =>
          subItem.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(subItem.href)
        )
      }
    }
    return initial
  })

  // Automatically expand group if user navigates to an item in a collapsed group
  React.useEffect(() => {
    for (const item of NAV_MAIN) {
      if (item.items) {
        const hasActive = item.items.some((subItem) =>
          subItem.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(subItem.href)
        )
        if (hasActive && !openGroups[item.title]) {
          setOpenGroups((prev) => ({ ...prev, [item.title]: true }))
        }
      }
    }
  }, [pathname])

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          {NAV_MAIN.map((item) => {
            const hasSubItems = Boolean(item.items && item.items.length > 0)

            if (!hasSubItems && item.href) {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} isActive={isActive} className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden" render={<Link href={item.href} onClick={onLinkClick}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>} />
                </SidebarMenuItem>
              )
            }

            const isGroupActive = item.items?.some((subItem) =>
              subItem.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(subItem.href)
            )

            const isOpen = isCollapsed ? false : (openGroups[item.title] ?? isGroupActive ?? false)

            return (
              <Collapsible key={item.title} render={<SidebarMenuItem className="group/collapsible" />} open={isOpen} onOpenChange={(open) => {
                  setOpenGroups((prev) => ({ ...prev, [item.title]: open }))
                }}>
                  <CollapsibleTrigger render={<SidebarMenuButton
                      tooltip={item.title}
                      isActive={isGroupActive}
                      className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden"
                      onClick={() => {
                        if (isCollapsed) {
                          setOpen(true)
                          setOpenGroups((prev) => ({ ...prev, [item.title]: true }))
                        }
                      }}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronRight
                        className={cn(
                          "ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                          "group-data-[open]/collapsible:rotate-90 group-data-[state=open]/collapsible:rotate-90 group-data-[panel-open]:rotate-90",
                          isOpen && "rotate-90"
                        )}
                      />
                    </SidebarMenuButton>} />
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const isSubActive =
                          subItem.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(subItem.href)

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton isActive={isSubActive} render={<Link href={subItem.href} onClick={onLinkClick}>
                                <span>{subItem.title}</span>
                              </Link>} />
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>

      {isAdmin && (
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="User Management" isActive={pathname.startsWith("/admin")} className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden" render={<Link href="/admin/users" onClick={onLinkClick}>
                  <Shield />
                  <span>User Management</span>
                </Link>} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  )
}

function SidebarNavFallback({
  isAdmin = false,
  onLinkClick,
}: {
  isAdmin?: boolean
  onLinkClick: () => void
}) {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          {NAV_MAIN.map((item) => {
            const hasSubItems = Boolean(item.items && item.items.length > 0)

            if (!hasSubItems && item.href) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} isActive={false} className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden" render={<Link href={item.href} onClick={onLinkClick}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>} />
                </SidebarMenuItem>
              )
            }

            return (
              <Collapsible key={item.title} render={<SidebarMenuItem className="group/collapsible" />} defaultOpen={true}>
                  <CollapsibleTrigger render={<SidebarMenuButton
                      tooltip={item.title}
                      className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronRight
                        className={cn(
                          "ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden",
                          "group-data-[open]/collapsible:rotate-90 group-data-[state=open]/collapsible:rotate-90 group-data-[panel-open]:rotate-90"
                        )}
                      />
                    </SidebarMenuButton>} />
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton isActive={false} render={<Link href={subItem.href} onClick={onLinkClick}>
                              <span>{subItem.title}</span>
                            </Link>} />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>

      {isAdmin && (
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="User Management" isActive={false} className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden" render={<Link href="/admin/users" onClick={onLinkClick}>
                  <Shield />
                  <span>User Management</span>
                </Link>} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  )
}

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, setOpenMobile } = useSidebar()
  const { data: session } = authClient.useSession()
  const mounted = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false
  )
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  const handleLinkClick = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])

  const user = session?.user as SidebarUser | undefined
  const isAdmin = user?.role === "admin"

  const handleSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)

    try {
      const signOutPromise = authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/sign-in"
          },
        },
      })

      toast.promise(signOutPromise, {
        loading: "Signing out...",
        success: "Signed out successfully",
        error: "Failed to sign out",
      })

      const res = await signOutPromise
      if (res?.data) {
        window.location.href = "/sign-in"
      }
    } catch {
      toast.add({ title: "Failed to sign out", type: "error" })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      {/* ── Logo & Workspace Switcher ── */}
      <SidebarHeader className="py-1.5 pb-0.5">
        <SpaceSwitcher />
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent>
        <React.Suspense fallback={<SidebarNavFallback isAdmin={isAdmin} onLinkClick={handleLinkClick} />}>
          <SidebarNav isAdmin={isAdmin} onLinkClick={handleLinkClick} />
        </React.Suspense>
      </SidebarContent>

      {/* ── User footer ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={<SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.image || ""} alt={user.name ?? "User"} />
                      <AvatarFallback className="rounded-lg">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>} />
                <DropdownMenuContent
                  className="w-(--anchor-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src={user.image || ""} alt={user.name ?? "User"} />
                          <AvatarFallback className="rounded-lg">
                            {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-medium">{user.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem render={<Link href="/notifications" onClick={handleLinkClick}>
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                      </Link>} />
                    <DropdownMenuItem render={<Link href="/settings" onClick={handleLinkClick}>
                        <Cog className="mr-2 h-4 w-4" />
                        Settings
                      </Link>} />
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isSigningOut ? "Logging out..." : "Log out"}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="h-12" />
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
