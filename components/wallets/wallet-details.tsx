"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Transaction, Category } from "@/types"
import { toggleArchiveWallet, deleteWallet } from "@/lib/actions/wallets"
import { deleteTransaction } from "@/lib/actions/transactions"
import { WalletForm } from "./wallet-form"
import { WalletDetailChart } from "./wallet-detail-chart"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    Edit,
    Trash2,
    Archive,
    ArchiveRestore,
    Landmark,
    Wallet as WalletIcon,
    Coins,
    CreditCard,
    TrendingUp,
    PiggyBank,
    HandCoins,
    Banknote,
    ArrowUpRight,
    ArrowDownRight,
    ArrowLeftRight,
    Receipt,
    Activity,
    Info,
    Clock,
    ExternalLink,
    Loader2,
    ShieldCheck,
    Tag,
} from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

const iconMap: Record<string, React.ElementType> = {
    Landmark,
    Wallet: WalletIcon,
    Coins,
    CreditCard,
    TrendingUp,
    PiggyBank,
    HandCoins,
}

interface WalletDetailsProps {
    wallet: Wallet
    history: { date: string; balance: number }[]
    transactions: Transaction[]
    categories: Category[]
    isOwner: boolean
}

export function WalletDetails({
    wallet,
    history,
    transactions,
    categories,
    isOwner,
}: WalletDetailsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [localTransactions, setLocalTransactions] = useState(transactions)

    useEffect(() => {
        setLocalTransactions(transactions)
    }, [transactions])

    const Icon = iconMap[wallet.icon] || WalletIcon
    const accent = wallet.color || "#3b82f6"
    const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]))

    const income = localTransactions.filter((t) => t.type === "income")
    const expense = localTransactions.filter((t) => t.type === "expense")
    const transfers = localTransactions.filter((t) => t.type === "transfer")
    const totalIncome = income.reduce((s, t) => s + t.amount, 0)
    const totalExpense = expense.reduce((s, t) => s + t.amount, 0)
    const netFlow = totalIncome - totalExpense
    const flowTotal = totalIncome + totalExpense
    const incomeShare = flowTotal > 0 ? (totalIncome / flowTotal) * 100 : 0

    const lastActivity = localTransactions[0]
    const avgTransaction = localTransactions.length > 0
        ? Math.round(localTransactions.reduce((s, t) => s + t.amount, 0) / localTransactions.length)
        : 0

    const handleDeleteTransaction = async (txId: string) => {
        const p = new Promise(async (resolve, reject) => {
            try {
                const res = await deleteTransaction(txId)
                if (res && !(res as any).success) throw new Error((res as any).error || "Failed to delete")
                setLocalTransactions((prev) => prev.filter((t) => t._id.toString() !== txId))
                router.refresh()
                resolve(true)
            } catch (err) { reject(err) }
        })
        toast.promise(p, { loading: "Deleting...", success: "Transaction deleted", error: (err: any) => err.message || "Failed to delete" })
    }

    const handleToggleArchive = () => {
        const isArchiving = !wallet.isArchived
        const p = new Promise((resolve, reject) => {
            startTransition(async () => {
                try {
                    const res = await toggleArchiveWallet(wallet._id.toString())
                    if (res && !res.success) reject(new Error(res.error || "Unauthorized"))
                    else {
                        router.refresh()
                        resolve(true)
                    }
                } catch (err) {
                    reject(err)
                }
            })
        })
        toast.promise(p, {
            loading: isArchiving ? "Archiving..." : "Restoring...",
            success: isArchiving ? "Wallet archived" : "Wallet restored",
            error: (err: Error) => err.message || "Failed to update wallet",
        })
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await deleteWallet(wallet._id.toString())
            if (res && !res.success) {
                toast.error(res.error || "Failed to delete wallet")
                return
            }
            toast.success("Wallet deleted")
            router.push("/wallets")
        } catch (err) {
            console.error(err)
            toast.error("Failed to delete wallet")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <Link
                        href="/wallets"
                        className="flex items-center justify-center size-11 shrink-0 border border-border/40 hover:bg-muted/50 rounded-2xl transition-colors mt-0.5"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-extrabold tracking-tight">{wallet.name}</h1>
                            <Badge
                                variant="outline"
                                className="rounded-full px-2 py-0 h-5 capitalize"
                                style={{ color: accent, borderColor: accent + "40", backgroundColor: accent + "10" }}
                            >
                                {wallet.type.replace("_", " ")}
                            </Badge>
                            {wallet.isArchived && (
                                <Badge variant="destructive" className="rounded-full px-2 py-0 h-5">
                                    Archived
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Detailed performance, stats, and transaction history for this wallet.
                        </p>
                    </div>
                </div>

                {isOwner && (
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            onClick={handleToggleArchive}
                            disabled={isPending}
                            className="h-9 rounded-xl font-bold border-border/50 bg-card"
                        >
                            {wallet.isArchived ? <ArchiveRestore className="size-4 mr-2" /> : <Archive className="size-4 mr-2" />}
                            {wallet.isArchived ? "Restore" : "Archive"}
                        </Button>
                        <Button onClick={() => setIsEditOpen(true)} className="h-9 rounded-xl font-bold bg-primary hover:bg-primary/90">
                            <Edit className="size-4 mr-2" /> Edit
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon" className="size-9 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-500">
                                    <Trash2 className="size-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                                        <Trash2 />
                                    </AlertDialogMedia>
                                    <AlertDialogTitle>Delete Wallet</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        All associated transactions will also be permanently deleted. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                        {isDeleting && <Loader2 className="animate-spin" data-icon="inline-start" />}
                                        Delete Permanently
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            {/* ── Metric Cards ── */}
            <div className="flex flex-wrap gap-4">
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
                    icon={Icon}
                    color={accent}
                    label="Current Balance"
                    value={formatCurrency(wallet.balance, wallet.currency)}
                />
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
                    icon={netFlow >= 0 ? ArrowDownRight : ArrowUpRight}
                    color={netFlow >= 0 ? "#10b981" : "#f43f5e"}
                    label="Net Flow"
                    value={(netFlow >= 0 ? "+" : "") + formatCurrency(netFlow, wallet.currency)}
                    valueClassName={netFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
                />
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
                    icon={ArrowDownRight}
                    color="#10b981"
                    label="Income"
                    value={formatCurrency(totalIncome, wallet.currency)}
                />
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))" }}
                    icon={ArrowUpRight}
                    color="#f43f5e"
                    label="Expense"
                    value={formatCurrency(totalExpense, wallet.currency)}
                />
            </div>

            {/* ── Cash Flow Progress Card ── */}
            <Card className="rounded-2xl border border-border/40 shadow-sm p-5 gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Activity className="size-4 text-primary" />
                        <span className="text-sm font-bold">Recent Cash Flow Mix</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-primary">{incomeShare.toFixed(0)}% income</span>
                </div>
                <Progress
                    value={incomeShare}
                    indicatorStyle={{ backgroundColor: "#10b981" }}
                    className="h-2.5 bg-rose-500/30"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Transactions</span>
                        <span className="text-sm font-bold tabular-nums">{localTransactions.length}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Transfers</span>
                        <span className="text-sm font-bold tabular-nums">{transfers.length}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Avg. Transaction</span>
                        <span className="text-sm font-bold tabular-nums">{avgTransaction > 0 ? formatCurrency(avgTransaction, wallet.currency) : "—"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Last Activity</span>
                        <span className="text-sm font-bold">{lastActivity ? format(new Date(lastActivity.date), "MMM d") : "—"}</span>
                    </div>
                </div>
            </Card>

            {/* Daily Balance History Area Chart */}
            <WalletDetailChart initialData={history} currency={wallet.currency} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ── Left column: Wallet Info ── */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2">
                            <Info className="size-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Wallet Information</span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-3.5 text-xs">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <WalletIcon className="size-3" /> Type
                                </span>
                                <span className="font-semibold capitalize">{wallet.type.replace("_", " ")}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Banknote className="size-3" /> Currency
                                </span>
                                <span className="font-semibold">{wallet.currency}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Clock className="size-3" /> Created
                                </span>
                                <span className="font-semibold">{formatDate(wallet.createdAt)}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <ShieldCheck className="size-3" /> Status
                                </span>
                                <span className={cn("font-semibold", wallet.isArchived ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400")}>
                                    {wallet.isArchived ? "Archived" : "Active"}
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 flex-1 min-h-0 overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2 shrink-0">
                            <Tag className="size-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category Breakdown</span>
                        </div>
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-4 flex flex-col gap-2">
                                {(() => {
                                    const byCategory = new Map<string, number>()
                                    expense.forEach((tx) => {
                                        const key = tx.categoryId || "uncategorized"
                                        byCategory.set(key, (byCategory.get(key) || 0) + tx.amount)
                                    })
                                    const rows = Array.from(byCategory.entries())
                                        .sort((a, b) => b[1] - a[1])

                                    if (rows.length === 0) {
                                        return <p className="text-xs text-muted-foreground">No expense activity yet.</p>
                                    }

                                    return rows.map(([catId, amount]) => {
                                        const cat = categoryMap.get(catId)
                                        return (
                                            <div key={catId} className="flex items-center justify-between gap-2 rounded-lg border border-border/30 bg-muted/20 px-3 py-2">
                                                <span className="flex items-center gap-1.5 text-xs font-semibold truncate">
                                                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: cat?.color || "#94a3b8" }} />
                                                    {cat?.name || "Uncategorized"}
                                                </span>
                                                <span className="text-xs font-bold tabular-nums shrink-0">{formatCurrency(amount, wallet.currency)}</span>
                                            </div>
                                        )
                                    })
                                })()}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>

                {/* ── Right column: Transactions Timeline ── */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 max-h-[380px] lg:max-h-none lg:h-[350px] overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Receipt className="size-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recent Transactions</span>
                            </div>
                            <Button variant="outline" size="sm" asChild className="h-7 rounded-lg text-xs font-bold border-border/50">
                                <Link href={`/transactions?wallets=${wallet._id.toString()}`}>View All</Link>
                            </Button>
                        </div>

                        {localTransactions.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                                <Receipt className="size-10 text-muted-foreground/30 mb-3" />
                                <p className="font-semibold text-foreground text-sm">No transactions yet</p>
                                <p className="text-xs text-muted-foreground max-w-sm mt-1">Transactions made through this wallet will appear here.</p>
                            </div>
                        ) : (
                            <ScrollArea className="flex-1 min-h-0">
                                <ItemGroup className="gap-0 divide-y divide-border/30 px-2 py-1">
                                    {localTransactions.map((tx) => {
                                        const category = categoryMap.get(tx.categoryId || "")
                                        const isIncome = tx.type === "income"
                                        const isExpense = tx.type === "expense"
                                        const catColor = category?.color || "#94a3b8"

                                        let iconColor = "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        let TxIcon = ArrowLeftRight
                                        if (isIncome) {
                                            iconColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            TxIcon = ArrowDownRight
                                        } else if (isExpense) {
                                            iconColor = "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                            TxIcon = ArrowUpRight
                                        }

                                        return (
                                            <Item key={tx._id.toString()} size="sm" className="group" asChild>
                                                <Link href={`/transactions/${tx._id.toString()}`}>
                                                    <ItemMedia className={cn("size-8 rounded-xl border", iconColor)}>
                                                        <TxIcon className="size-3.5" />
                                                    </ItemMedia>

                                                    <ItemContent className="gap-0.5">
                                                        <ItemTitle className="flex-wrap gap-2">
                                                            <span className="text-xs font-bold text-foreground truncate">{tx.description}</span>
                                                            <span className="text-[10px] font-normal text-muted-foreground">{formatDate(tx.date)}</span>
                                                        </ItemTitle>
                                                        <ItemDescription className="text-[11px]">
                                                            {category ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span className="size-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                                                                    {category.name}
                                                                </span>
                                                            ) : (
                                                                "Uncategorized"
                                                            )}
                                                        </ItemDescription>
                                                    </ItemContent>

                                                    <ItemActions>
                                                        <span
                                                            className={cn(
                                                                "text-xs font-bold whitespace-nowrap tabular-nums shrink-0",
                                                                isIncome ? "text-emerald-500" : isExpense ? "text-foreground" : "text-amber-500"
                                                            )}
                                                        >
                                                            {isIncome ? "+" : isExpense ? "-" : ""}
                                                            {formatCurrency(tx.amount, tx.currency)}
                                                        </span>

                                                        <div className="size-6 flex items-center justify-center shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Trash2 className="size-3.5" />
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
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
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction variant="destructive" onClick={() => handleDeleteTransaction(tx._id.toString())}>
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
                        )}
                    </Card>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
                    <DialogHeader><DialogTitle className="text-xl font-extrabold">Edit Wallet</DialogTitle></DialogHeader>
                    <div className="py-2">
                        <WalletForm initialWallet={wallet} onSuccess={() => setIsEditOpen(false)} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}