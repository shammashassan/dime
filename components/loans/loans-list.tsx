"use client"

import { useState, useEffect, useTransition } from "react"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Wallet, Contact, Loan } from "@/types"
import { OwedSummaries } from "@/lib/queries/loans"
import { LoanDialog } from "./loan-dialog"
import { RepaymentDialog } from "./repayment-dialog"
import { deleteLoan } from "@/lib/actions/loans"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia
} from "@/components/ui/empty"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog"
import {
  Coins,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HandCoins,
  ChevronRight,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  Loader2,
  LucideIcon
} from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

interface LoansListProps {
  initialLoans: Loan[]
  wallets: Wallet[]
  contacts: Contact[]
  summaries: OwedSummaries
}

interface MetricCard {
  label: string
  value: string
  subtext: string
  icon: LucideIcon
  color: string
  urgent?: boolean
}

export function LoansList({
  initialLoans,
  wallets,
  contacts,
  summaries,
}: LoansListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [loans, setLoans] = useState<Loan[]>(initialLoans)
  const [search, setSearch] = useState("")

  const tabParam = searchParams.get("tab")
  const validTabs = ["active", "overdue", "repaid", "all"]
  const [activeTab, setActiveTab] = useState<string>(() => {
    return tabParam && validTabs.includes(tabParam) ? tabParam : "active"
  })

  const [isPending, startTransition] = useTransition()
  const [deletingLoanId, setDeletingLoanId] = useState<string | null>(null)

  useEffect(() => {
    setLoans(initialLoans)
  }, [initialLoans])

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    } else if (!tabParam) {
      setActiveTab("active")
    }
  }, [tabParam])

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    const params = new URLSearchParams(searchParams.toString())
    if (newTab === "active") {
      params.delete("tab")
    } else {
      params.set("tab", newTab)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const openCount = loans.filter(
    (loan) => loan.status === "active" || loan.status === "partially_repaid" || loan.status === "overdue"
  ).length
  const overdueCount = loans.filter((loan) => loan.status === "overdue").length
  const repaidCount = loans.filter((loan) => loan.status === "fully_repaid").length

  const tabNames: Record<string, string> = {
    active: `Active (${openCount})`,
    overdue: `Overdue (${overdueCount})`,
    repaid: `Repaid (${repaidCount})`,
    all: `All (${loans.length})`,
  }

  // Filter loans based on search query and active tab
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.personName.toLowerCase().includes(search.toLowerCase()) ||
      (loan.notes && loan.notes.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (activeTab === "active") {
      return loan.status === "active" || loan.status === "partially_repaid" || loan.status === "overdue"
    }
    if (activeTab === "overdue") return loan.status === "overdue"
    if (activeTab === "repaid") return loan.status === "fully_repaid"
    if (activeTab === "all") return true
    return true
  })

  const handleDelete = async () => {
    if (!deletingLoanId) return
    const p = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await deleteLoan(deletingLoanId)
          if (res && !res.success) {
            reject(new Error((res as any).error || "Failed to delete loan"))
          } else {
            setDeletingLoanId(null)
            router.refresh()
            resolve(true)
          }
        } catch (err) {
          reject(err)
        }
      })
    })
    toast.promise(p, {
      loading: "Deleting...",
      success: "Loan deleted",
      error: (err: any) => err.message || "Failed to delete loan",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="rounded-md font-semibold text-[10px] h-5">Active</Badge>
      case "partially_repaid":
        return <Badge variant="outline" className="rounded-md border-primary/30 text-primary bg-primary/5 font-semibold text-[10px] h-5">Partial</Badge>
      case "fully_repaid":
        return <Badge variant="default" className="rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[10px] h-5">Repaid</Badge>
      case "overdue":
        return <Badge variant="destructive" className="rounded-md font-semibold text-[10px] h-5">Overdue</Badge>
      case "cancelled":
        return <Badge variant="outline" className="rounded-md font-semibold text-muted-foreground text-[10px] h-5">Cancelled</Badge>
      default:
        return null
    }
  }

  // Dashboard metric cards data
  const metricCards: MetricCard[] = [
    {
      label: "Outstanding Lent",
      value: formatCurrency(summaries.totalLent, summaries.baseCurrency),
      subtext: "Others owe you",
      icon: ArrowUpRight,
      color: "#10b981",
    },
    {
      label: "Outstanding Borrowed",
      value: formatCurrency(summaries.totalBorrowed, summaries.baseCurrency),
      subtext: "You owe others",
      icon: ArrowDownLeft,
      color: "#ef4444",
    },
    {
      label: "Due This Month",
      value: formatCurrency(summaries.dueThisMonth, summaries.baseCurrency),
      subtext: "Approaching deadlines",
      icon: Calendar,
      color: "#3b82f6",
    },
    {
      label: "Overdue",
      value: formatCurrency(summaries.overdue, summaries.baseCurrency),
      subtext: "Action required",
      icon: AlertCircle,
      color: "#f43f5e",
      urgent: true,
    },
    {
      label: "Repaid This Month",
      value: formatCurrency(summaries.repaidThisMonth, summaries.baseCurrency),
      subtext: "Paid back this month",
      icon: CheckCircle2,
      color: "#10b981",
    },
  ]

  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header matching Dime page structures */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <HandCoins className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Loans & Lending</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage personal loans, borrowed money, and repayment schedules.
            </p>
          </div>
        </div>
        <LoanDialog
          wallets={wallets}
          contacts={contacts}
          trigger={
            <Button className="w-full md:w-auto rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
              <Plus className="size-4" />
              Record Loan
            </Button>
          }
        />
      </div>

      {/* Rich Dashboard Metrics Cards */}
      <div className="flex flex-wrap gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <Card
              key={idx}
              className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex-1 min-w-[200px]"
              style={{ minWidth: "clamp(200px, calc((1064px - 100%) * 9999), calc(33.33% - 1rem))" }}
            >
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{ background: `radial-gradient(120% 100% at 0% 0%, ${card.color}, transparent 60%)` }}
              />
              <CardContent className="relative p-4 flex items-center gap-3">
                <div
                  className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: `${card.color}18`, color: card.color }}
                >
                  <Icon className="size-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 truncate">
                    {card.label}
                  </p>
                  <p
                    className="text-xl font-black tabular-nums leading-tight truncate"
                    style={{ color: card.urgent ? card.color : undefined }}
                  >
                    {card.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Filter & Control Area */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap gap-3 items-stretch sm:items-center justify-between w-full">
        {/* Desktop Filter (visible on sm and larger screens) */}
        <div className="hidden sm:flex shrink-0">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-9 p-1 rounded-xl bg-muted/80">
              <TabsTrigger value="active" className="cursor-pointer text-xs font-semibold px-3.5 rounded-lg">
                Active ({openCount})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="cursor-pointer text-xs font-semibold px-3.5 rounded-lg gap-1.5">
                Overdue ({overdueCount})
                {overdueCount > 0 && (
                  <span className="size-1.5 rounded-full bg-destructive" />
                )}
              </TabsTrigger>
              <TabsTrigger value="repaid" className="cursor-pointer text-xs font-semibold px-3.5 rounded-lg">
                Repaid ({repaidCount})
              </TabsTrigger>
              <TabsTrigger value="all" className="cursor-pointer text-xs font-semibold px-3.5 rounded-lg">
                All ({loans.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile Filter (visible on smaller screens) */}
        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full border-border/40 bg-card h-10">
              <SelectValue placeholder={tabNames[activeTab]} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectGroup>
                <SelectItem value="active" className="rounded-lg">
                  Active ({openCount})
                </SelectItem>
                <SelectItem value="overdue" className="rounded-lg">
                  Overdue ({overdueCount})
                </SelectItem>
                <SelectItem value="repaid" className="rounded-lg">
                  Repaid ({repaidCount})
                </SelectItem>
                <SelectItem value="all" className="rounded-lg">
                  All ({loans.length})
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:max-w-xs justify-end">
          <InputGroup className="w-full sm:w-60 min-w-0">
            <InputGroupInput
              placeholder="Search by contact or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </InputGroup>
        </div>
      </div>

      {/* Loans Grid / List */}
      {loans.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <HandCoins className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No loans yet</EmptyTitle>
              <EmptyDescription>You haven't recorded any personal loans yet. Keep track of what you owe and what others owe you.</EmptyDescription>
            </EmptyHeader>
            <div className="mt-4">
              <LoanDialog
                wallets={wallets}
                contacts={contacts}
                trigger={
                  <Button className="rounded-xl font-bold gap-2">
                    Record your first loan
                  </Button>
                }
              />
            </div>
          </Empty>
        </Card>
      ) : filteredLoans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLoans.map((loan) => {
            const repaidAmount = loan.amount - loan.remainingAmount
            const progress = loan.amount > 0 ? (repaidAmount / loan.amount) * 100 : 0
            const isLent = loan.type === "lent"

            return (
              <Card
                key={loan._id.toString()}
                className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full justify-between"
                onClick={() => router.push(`/loans/${loan._id.toString()}`)}
              >
                {/* Top accent */}
                <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: isLent ? "#10b981" : "#ef4444" }} />

                {/* Header */}
                <CardHeader className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: isLent ? "#10b98118" : "#ef444418",
                        color: isLent ? "#10b981" : "#ef4444",
                      }}
                    >
                      {isLent ? <HandCoins className="size-4.5" /> : <Coins className="size-4.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                        {loan.personName}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4"
                          style={{
                            backgroundColor: isLent ? "#10b98115" : "#ef444415",
                            color: isLent ? "#10b981" : "#ef4444",
                            borderColor: isLent ? "#10b98130" : "#ef444430",
                          }}
                        >
                          {isLent ? "Lent" : "Borrowed"}
                        </Badge>
                        {getStatusBadge(loan.status)}
                      </div>
                    </div>
                  </div>

                  {/* Actions (always visible on mobile, hover-revealed on desktop) */}
                  <div
                    className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <LoanDialog
                            wallets={wallets}
                            contacts={contacts}
                            initialLoan={loan}
                            trigger={
                              <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-muted/70">
                                <Edit className="size-3.5 text-muted-foreground" />
                              </Button>
                            }
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        Edit loan
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          onClick={() => setDeletingLoanId(loan._id.toString())}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        Delete loan
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>

                {/* Body */}
                <CardContent className="px-4 pb-3 flex flex-col gap-3">
                  {/* Amounts */}
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Remaining</p>
                      <p className="text-[1.5rem] font-black tabular-nums text-foreground leading-none select-all">
                        {formatCurrency(loan.remainingAmount, loan.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Repaid</p>
                      <p className={cn("text-[1.5rem] font-black tabular-nums leading-none", progress >= 100 ? "text-emerald-500" : "text-primary")}>
                        {progress.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <Progress
                      value={progress}
                      indicatorStyle={{ backgroundColor: progress >= 100 ? "#10b981" : "var(--primary)" }}
                      className="h-2 bg-muted/60"
                    />
                    <div className="flex justify-between text-[9px] font-medium text-muted-foreground mt-1">
                      <span>{formatCurrency(loan.amount - loan.remainingAmount, loan.currency)} repaid</span>
                      <span>Principal: {formatCurrency(loan.amount, loan.currency)}</span>
                    </div>
                  </div>
                </CardContent>

                {/* Footer */}
                <Separator className="bg-border/30" />
                <CardFooter className="px-3 py-2 flex items-center justify-between bg-muted/20 mt-auto" onClick={(e) => e.stopPropagation()}>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="size-3" />
                    {loan.dueDate ? `Due ${formatDate(loan.dueDate)}` : "No due date"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {loan.status !== "fully_repaid" && loan.status !== "cancelled" ? (
                      <RepaymentDialog
                        loan={loan}
                        wallets={wallets}
                        trigger={
                          <Button
                            size="sm"
                            className="h-7 rounded-lg text-xs font-bold px-3 cursor-pointer shrink-0"
                          >
                            Pay
                          </Button>
                        }
                      />
                    ) : null}

                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="h-7 rounded-lg text-xs font-bold px-3 cursor-pointer shrink-0"
                    >
                      <Link href={`/loans/${loan._id.toString()}`}>
                        Details
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : !search && activeTab === "active" && openCount === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No active loans</EmptyTitle>
              <EmptyDescription>
                You don't have any open loans right now. All your loans are fully settled!
              </EmptyDescription>
            </EmptyHeader>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {repaidCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTabChange("repaid")}
                  className="rounded-xl font-semibold text-xs cursor-pointer"
                >
                  View Repaid Loans ({repaidCount})
                </Button>
              )}
              <LoanDialog
                wallets={wallets}
                contacts={contacts}
                trigger={
                  <Button size="sm" className="rounded-xl font-semibold text-xs cursor-pointer gap-1.5">
                    <Plus className="size-3.5" />
                    Record New Loan
                  </Button>
                }
              />
            </div>
          </Empty>
        </Card>
      ) : !search && activeTab === "overdue" && overdueCount === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No overdue loans</EmptyTitle>
              <EmptyDescription>Great news! None of your loans are overdue.</EmptyDescription>
            </EmptyHeader>
            {openCount > 0 && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTabChange("active")}
                  className="rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Back to Active Loans ({openCount})
                </Button>
              </div>
            )}
          </Empty>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-muted text-muted-foreground">
              <Search className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No loans found</EmptyTitle>
              <EmptyDescription>
                {search ? "No loans match your search criteria." : "Adjust your filters or record a new loan."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      )}

      <AlertDialog open={!!deletingLoanId} onOpenChange={(open) => !open && setDeletingLoanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Loan</AlertDialogTitle>
            <AlertDialogDescription>This action is permanent and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}