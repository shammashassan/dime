"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ContactWithSummary } from "@/lib/queries/loans"
import { Contact } from "@/types"
import { deleteContact } from "@/lib/actions/loans"
import { ContactDialog } from "./contact-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  EmptyMedia
} from "@/components/ui/empty"
import {
  Users,
  Search,
  Plus,
  Trash2,
  Mail,
  Phone,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Edit,
  ChevronRight,
  Loader2,
  LucideIcon
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ContactsViewProps {
  contacts: ContactWithSummary[]
}

interface StatCard {
  label: string
  value: string | number
  subtext: string
  icon: LucideIcon
  color: string
  urgent?: boolean
}

export function ContactsView({ contacts }: ContactsViewProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"all" | "borrowers" | "lenders" | "settled">("all")

  // Zyn-style Stats Card Data
  const totalContacts = contacts.length
  const activeBorrowers = contacts.filter(c => c.totalOwed > 0).length
  const activeLenders = contacts.filter(c => c.totalOwed < 0).length
  const settledContacts = contacts.filter(c => c.totalOwed === 0).length

  const tabCounts = {
    all: totalContacts,
    borrowers: activeBorrowers,
    lenders: activeLenders,
    settled: settledContacts,
  }

  const tabNames: Record<string, string> = {
    all: `All (${tabCounts.all})`,
    borrowers: `Borrowers (${tabCounts.borrowers})`,
    lenders: `Lenders (${tabCounts.lenders})`,
    settled: `Settled (${tabCounts.settled})`,
  }

  // Calculate Net balance in default currency (INR)
  let netOwedToYou = 0
  contacts.forEach(c => {
    netOwedToYou += c.totalOwed
  })

  // Filter contacts by tab and search
  const filteredContacts = contacts.filter(c => {
    if (activeTab === "borrowers" && c.totalOwed <= 0) return false
    if (activeTab === "lenders" && c.totalOwed >= 0) return false
    if (activeTab === "settled" && c.totalOwed !== 0) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      if (!c.name.toLowerCase().includes(q) && 
          !(c.email && c.email.toLowerCase().includes(q)) && 
          !(c.phone && c.phone.includes(q))) {
        return false
      }
    }
    return true
  })

  const handleDelete = async () => {
    if (!deletingContactId) return
    const p = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await deleteContact(deletingContactId)
          if (result && !result.success) {
            reject(new Error((result as any).error || "Failed to delete contact"))
          } else {
            setDeletingContactId(null)
            resolve(true)
          }
        } catch (err) {
          reject(err)
        }
      })
    })
    toast.promise(p, {
      loading: "Deleting...",
      success: "Contact deleted",
      error: (err: any) => err.message || "Failed to delete contact",
    })
  }

  // Stats Cards data (hex-driven so watermark + accent colors are easy to theme)
  const statsCards: StatCard[] = [
    {
      label: "Total Contacts",
      value: totalContacts,
      subtext: "Saved in directory",
      icon: Users,
      color: "#3b82f6",
    },
    {
      label: "Owe You Money",
      value: activeBorrowers,
      subtext: `${activeBorrowers} active receivables`,
      icon: ArrowUpRight,
      color: "#10b981",
    },
    {
      label: "You Owe Money",
      value: activeLenders,
      subtext: `${activeLenders} active payables`,
      icon: ArrowDownLeft,
      color: "#f43f5e",
    },
    {
      label: "Net Outstanding",
      value: formatCurrency(netOwedToYou, "INR"),
      subtext: netOwedToYou >= 0 ? "Net receivable from others" : "Net payable to others",
      icon: HandCoins,
      color: netOwedToYou >= 0 ? "#10b981" : "#f43f5e",
      urgent: netOwedToYou < 0,
    }
  ]

  return (
    <div className="flex flex-col gap-7 w-full">
      {/* Header matching Dime page structures */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Contacts Directory</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your personal contacts and track receivables or payables per contact.
            </p>
          </div>
        </div>
        <ContactDialog
          trigger={
            <Button className="w-full md:w-auto rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
              <Plus className="size-4" />
              New Contact
            </Button>
          }
        />
      </div>

      {/* 1. Stats Cards */}
      <div className="flex flex-wrap gap-4">
        {statsCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <Card
              key={idx}
              className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex-1 min-w-[200px]"
              style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
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

      {/* 2. Controls & Search Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
        {/* Desktop Filter (visible on sm and larger screens) */}
        <div className="hidden sm:flex rounded-xl bg-muted/80 p-1 self-start">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({tabCounts.all})
          </button>
          <button
            onClick={() => setActiveTab("borrowers")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "borrowers"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Borrowers ({tabCounts.borrowers})
          </button>
          <button
            onClick={() => setActiveTab("lenders")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "lenders"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Lenders ({tabCounts.lenders})
          </button>
          <button
            onClick={() => setActiveTab("settled")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "settled"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Settled ({tabCounts.settled})
          </button>
        </div>

        {/* Mobile Filter (visible on smaller screens) */}
        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <SelectTrigger className="w-full border-border/40 bg-card h-10">
              <SelectValue placeholder={tabNames[activeTab]} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All ({tabCounts.all})
              </SelectItem>
              <SelectItem value="borrowers" className="rounded-lg">
                Borrowers ({tabCounts.borrowers})
              </SelectItem>
              <SelectItem value="lenders" className="rounded-lg">
                Lenders ({tabCounts.lenders})
              </SelectItem>
              <SelectItem value="settled" className="rounded-lg">
                Settled ({tabCounts.settled})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <InputGroup className="w-full sm:w-60">
            <InputGroupInput
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </InputGroup>
        </div>
      </div>

      {/* 3. Contacts Grid */}
      {contacts.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <Users className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No contacts yet</EmptyTitle>
              <EmptyDescription>Add contacts to keep records of your loans, debts, and repayments.</EmptyDescription>
            </EmptyHeader>
            <div className="mt-4">
              <ContactDialog
                trigger={
                  <Button className="rounded-xl font-bold gap-2">
                    <Plus className="size-4" /> Add Contact
                  </Button>
                }
              />
            </div>
          </Empty>
        </Card>
      ) : filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => {
            const hasBorrowing = contact.totalOwed > 0
            const hasLending = contact.totalOwed < 0
            const isSettled = contact.totalOwed === 0

            return (
              <Card
                key={contact._id}
                className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full justify-between cursor-pointer"
                onClick={() => router.push(`/contacts/${contact._id}`)}
              >
                {/* Top Accent Bar */}
                <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: hasBorrowing ? "#10b981" : hasLending ? "#ef4444" : "#94a3b8" }} />

                {/* Header */}
                <CardHeader className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: hasBorrowing ? "#10b98118" : hasLending ? "#ef444418" : "#94a3b818",
                        color: hasBorrowing ? "#10b981" : hasLending ? "#ef4444" : "#94a3b8",
                      }}
                    >
                      <Users className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                        {contact.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contact.activeLoanCount > 0 ? (
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 bg-amber-500/10 text-amber-600 border-amber-500/20 gap-0.5">
                            <Clock className="size-2" /> {contact.activeLoanCount} Active Loan{contact.activeLoanCount > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 text-muted-foreground border-border/50">
                            No active loans
                          </Badge>
                        )}
                        {hasBorrowing && (
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            Receivable
                          </Badge>
                        )}
                        {hasLending && (
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 bg-rose-500/10 text-rose-600 border-rose-500/20">
                            Payable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions (always visible on mobile, hover-revealed on desktop) */}
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                    {/* Edit Contact */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <ContactDialog
                            initialContact={contact as unknown as Contact}
                            trigger={
                              <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-muted/70">
                                <Edit className="size-3.5 text-muted-foreground" />
                              </Button>
                            }
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        Edit contact
                      </TooltipContent>
                    </Tooltip>

                    {/* Delete Contact */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          onClick={() => setDeletingContactId(contact._id.toString())}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-medium">
                        Delete contact
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>

                {/* Body */}
                <CardContent className="px-4 pb-3 flex flex-col gap-3">
                  {/* Info details */}
                  <div className="space-y-1 text-xs text-muted-foreground mt-2">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-muted-foreground/75" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-3.5 text-muted-foreground/75" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Net Outstanding Balance */}
                  <div className="flex justify-between items-end border-t border-border/30 pt-2.5 mt-1">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Net Balance</span>
                    <span
                      className={cn(
                        "text-lg font-black tabular-nums leading-none select-all",
                        hasBorrowing && "text-emerald-600 dark:text-emerald-400",
                        hasLending && "text-rose-500",
                        isSettled && "text-muted-foreground"
                      )}
                    >
                      {hasBorrowing && "+"}
                      {formatCurrency(contact.totalOwed, contact.baseCurrency)}
                    </span>
                  </div>
                </CardContent>

                {/* Footer Link bar */}
                <Separator className="bg-border/30" />
                <CardFooter className="px-3 py-2 flex items-center justify-between bg-muted/20 mt-auto" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] text-muted-foreground">
                    {contact.loanCount} total loan{contact.loanCount !== 1 && "s"} recorded
                  </span>

                  {contact.loanCount > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="h-7 rounded-lg text-xs font-bold px-3 cursor-pointer shrink-0"
                    >
                      <Link href={`/loans?search=${encodeURIComponent(contact.name)}`}>
                        View Loans
                      </Link>
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="rounded-2xl border border-dashed border-border/40 py-16 text-center w-full col-span-full">
          <Empty>
            <EmptyMedia className="bg-primary/5 text-primary">
              <Users className="size-8" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No contacts found</EmptyTitle>
              <EmptyDescription>Adjust your filters or search to find what you're looking for.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      )}

      <AlertDialog open={!!deletingContactId} onOpenChange={(open) => !open && setDeletingContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this contact. You cannot delete a contact if they have active or unpaid loans.
            </AlertDialogDescription>
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