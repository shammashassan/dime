"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Category, Wallet } from "@/types"
import { BudgetWithSpending } from "@/lib/queries/budgets"
import { deleteBudget } from "@/lib/actions/budgets"
import { deleteTransaction } from "@/lib/actions/transactions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Item,
    ItemMedia,
    ItemContent,
    ItemTitle,
    ItemDescription,
    ItemActions,
    ItemGroup,
} from "@/components/ui/item"
import { BudgetForm } from "./budget-form"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    AlertDialogMedia,
} from "@/components/ui/alert-dialog"
import {
    ArrowLeft,
    PiggyBank,
    Edit,
    Trash2,
    CalendarDays,
    Wallet as WalletIcon,
    AlertTriangle,
    ShieldAlert,
    Info,
    TrendingUp,
    Receipt,
    Clock,
    Bell,
    RefreshCw,
    Activity,
    Banknote,
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { toast } from "sonner"

interface BudgetTransaction {
    _id: string
    description?: string
    amount: number
    date: string | Date
    walletId?: string
}

interface BudgetDetailsProps {
    budget: BudgetWithSpending
    transactions: BudgetTransaction[]
    categories: Category[]
    wallets: Wallet[]
}

export function BudgetDetails({ budget, transactions, categories, wallets }: BudgetDetailsProps) {
    const router = useRouter()
    const [editOpen, setEditOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [localTransactions, setLocalTransactions] = useState(transactions)

    useEffect(() => {
        setLocalTransactions(transactions)
    }, [transactions])

    const handleDeleteTransaction = async (txId: string) => {
        const p = new Promise(async (resolve, reject) => {
            try {
                const res = await deleteTransaction(txId)
                if (res && !res.success) throw new Error(res.error || "Failed to delete")
                setLocalTransactions((prev) => prev.filter((t) => t._id !== txId))
                router.refresh()
                resolve(true)
            } catch (err) { reject(err) }
        })
        toast.promise(p, {
            loading: "Deleting transaction...",
            success: "Transaction deleted successfully",
            error: (err: any) => err.message || "Failed to delete transaction"
        })
    }

    const percent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
    const remaining = Math.max(budget.amount - budget.spent, 0)
    const isOverBudget = percent >= 100
    const isOverThreshold = percent >= budget.alertThreshold && !isOverBudget
    const barColor = isOverBudget ? "#f43f5e" : percent >= 70 ? "#f59e0b" : "#10b981"
    const pctColor = isOverBudget ? "text-rose-500" : percent >= 70 ? "text-amber-500" : "text-emerald-500"

    const sortedTransactions = [...localTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const avgTransaction =
        transactions.length > 0
            ? Math.round(transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length)
            : 0

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await deleteBudget(budget._id.toString())
            if (res && !res.success) {
                toast.error(res.error || "Failed to delete budget")
                return
            }
            toast.success("Budget deleted successfully")
            router.push("/budgets")
        } catch (err) {
            console.error(err)
            toast.error("Failed to delete budget")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <button
                        onClick={() => router.push("/budgets")}
                        className="flex items-center justify-center size-11 shrink-0 border border-border/40 hover:bg-muted/50 rounded-2xl transition-colors mt-0.5 cursor-pointer"
                    >
                        <ArrowLeft className="size-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-extrabold tracking-tight">{budget.name}</h1>
                            <Badge variant="secondary" className="rounded-md font-semibold text-[10px] h-5 capitalize">
                                {budget.period}
                            </Badge>
                            {!budget.isActive && (
                                <Badge variant="outline" className="rounded-md font-semibold text-[10px] h-5">
                                    Inactive
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {budget.categoryName}
                            {budget.walletName ? ` · ${budget.walletName}` : ""} · Started {formatDate(budget.startDate)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-10 rounded-xl"
                        onClick={() => setEditOpen(true)}
                    >
                        <Edit className="size-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-10 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border border-border/40 p-6 shadow-xl">
                            <AlertDialogHeader>
                                <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                                    <Trash2 />
                                </AlertDialogMedia>
                                <AlertDialogTitle>Delete this budget?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action is permanent and cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-semibold" disabled={isDeleting}>
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    variant="destructive"
                                    className="rounded-xl font-semibold"
                                    disabled={isDeleting}
                                    onClick={handleDelete}
                                >
                                    {isDeleting ? "Deleting..." : "Delete Budget"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* ── Alert Banner ── */}
            {(isOverThreshold || isOverBudget) && (
                <div
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-semibold",
                        isOverBudget
                            ? "bg-rose-500/8 border-rose-500/20 text-rose-600 dark:text-rose-400"
                            : "bg-amber-500/8 border-amber-500/20 text-amber-600 dark:text-amber-400"
                    )}
                >
                    {isOverBudget ? (
                        <>
                            <ShieldAlert className="size-4 shrink-0" />
                            <span>Over budget — limit reached</span>
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="size-4 shrink-0" />
                            <span>Alert: exceeded {budget.alertThreshold}% threshold</span>
                        </>
                    )}
                </div>
            )}

            {/* ── Metric Cards ── */}
            <div className="flex flex-wrap gap-4">
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
                    icon={PiggyBank}
                    color={budget.categoryColor}
                    label="Spent"
                    value={formatCurrency(budget.spent, budget.currency)}
                />
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
                    icon={TrendingUp}
                    color={remaining > 0 ? "#10b981" : "#f43f5e"}
                    label="Remaining"
                    value={formatCurrency(remaining, budget.currency)}
                />
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
                    icon={WalletIcon}
                    color="#3b82f6"
                    label="Limit"
                    value={formatCurrency(budget.amount, budget.currency)}
                />
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
                    icon={Clock}
                    color={isOverBudget ? "#f43f5e" : percent >= 70 ? "#f59e0b" : "#10b981"}
                    label="Usage"
                    value={`${Math.min(percent, 999).toFixed(0)}%`}
                    valueClassName={pctColor}
                />
            </div>

            {/* ── Progress Card ── */}
            <Card className="rounded-2xl border border-border/40 shadow-sm p-5 gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="size-4 text-primary" />
                        <span className="text-sm font-bold">Spending Progress</span>
                    </div>
                    <span className={cn("text-xs font-bold tabular-nums", pctColor)}>
                        {Math.min(percent, 999).toFixed(1)}% used
                    </span>
                </div>

                <Progress
                    value={Math.min(percent, 100)}
                    indicatorStyle={{ backgroundColor: barColor }}
                    className="h-2.5 bg-muted/60"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Spent</span>
                        <span className="text-sm font-bold tabular-nums">{formatCurrency(budget.spent, budget.currency)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Remaining</span>
                        <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(remaining, budget.currency)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                            Transactions
                        </span>
                        <span className="text-sm font-bold tabular-nums">{transactions.length}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                            Avg. Transaction
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                            {avgTransaction > 0 ? formatCurrency(avgTransaction, budget.currency) : "—"}
                        </span>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ── Left column: Budget Info ── */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2 shrink-0">
                            <Info className="size-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Budget Information
                            </span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-3.5 text-xs">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider">
                                    Category
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="size-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: budget.categoryColor }}
                                    />
                                    <span className="font-semibold truncate">{budget.categoryName}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <WalletIcon className="size-3" /> Wallet
                                </span>
                                <span className="font-semibold truncate">{budget.walletName || "All Wallets"}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <CalendarDays className="size-3" /> Start Date
                                </span>
                                <span className="font-semibold">{formatDate(budget.startDate)}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Clock className="size-3" /> End Date
                                </span>
                                <span className="font-semibold">
                                    {budget.endDate ? formatDate(budget.endDate) : "None"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Banknote className="size-3" /> Currency
                                </span>
                                <span className="font-semibold">{budget.currency}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <RefreshCw className="size-3" /> Period
                                </span>
                                <span className="font-semibold capitalize">{budget.period}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Bell className="size-3" /> Alert Limit
                                </span>
                                <span className="font-semibold">
                                    {budget.alertThreshold ? `${budget.alertThreshold}%` : "Disabled"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Activity className="size-3" /> Status
                                </span>
                                <span className={cn("font-semibold", budget.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                                    {budget.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Right column: Transaction History ── */}
                <div className="lg:col-span-2 flex flex-col gap-4 lg:h-0 lg:min-h-full">
                    <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 max-h-[480px] lg:max-h-none flex-1 min-h-0 overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Receipt className="size-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Transaction History
                                </span>
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                                {sortedTransactions.length} txn{sortedTransactions.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {sortedTransactions.length > 0 ? (
                            <ScrollArea className="flex-1 min-h-0">
                                <ItemGroup className="gap-0 divide-y divide-border/30 px-2 py-1">
                                    {sortedTransactions.map((t) => {
                                        const wallet = wallets.find((w) => w._id.toString() === t.walletId)
                                        return (
                                            <Item key={t._id.toString()} size="sm" className="group" asChild>
                                                <Link href={`/transactions/${t._id.toString()}`}>
                                                    <ItemMedia className="size-8 rounded-xl border bg-rose-500/10 text-rose-500 border-rose-500/20">
                                                        <Receipt className="size-3.5" />
                                                    </ItemMedia>
                                                    <ItemContent className="gap-0.5">
                                                        <ItemTitle className="flex-wrap gap-2">
                                                            <span className="text-xs font-bold text-foreground">
                                                                {t.description || "Transaction"}
                                                            </span>
                                                            <span className="text-[10px] font-normal text-muted-foreground">
                                                                {format(new Date(t.date), "PP")}
                                                            </span>
                                                        </ItemTitle>
                                                        <ItemDescription className="truncate text-[11px]">
                                                            {wallet?.name || "Unknown wallet"}
                                                        </ItemDescription>
                                                    </ItemContent>
                                                    <ItemActions>
                                                        <span className="text-xs font-bold whitespace-nowrap tabular-nums text-rose-600 dark:text-rose-400">
                                                            -{formatCurrency(t.amount, budget.currency)}
                                                        </span>
                                                        <div className="size-6 flex items-center justify-center shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Trash2 className="size-3.5" />
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="rounded-2xl border border-border/40 p-6 shadow-xl">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                                                                            <Trash2 />
                                                                        </AlertDialogMedia>
                                                                        <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will permanently delete this transaction and revert the wallet balance. This cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="rounded-xl font-semibold">
                                                                            Cancel
                                                                        </AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            variant="destructive"
                                                                            className="rounded-xl font-semibold"
                                                                            onClick={() => handleDeleteTransaction(t._id.toString())}
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </ItemActions>
                                                </Link>
                                            </Item>
                                        )
                                    })}
                                </ItemGroup>
                            </ScrollArea>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center text-center p-10">
                                <Receipt className="size-8 text-muted-foreground/25 mb-2" />
                                <p className="text-sm font-bold">No transactions yet</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                    Transactions matching this category and wallet will appear here.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Edit dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold">Edit Budget</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <BudgetForm
                            categories={categories}
                            wallets={wallets}
                            initialBudget={budget}
                            onSuccess={() => setEditOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}