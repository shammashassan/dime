"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Goal, Wallet } from "@/types"
import { deleteGoal } from "@/lib/actions/goals"
import { deleteTransaction } from "@/lib/actions/transactions"
import { GoalFormDialog } from "./goal-form"
import { GoalContributionDialog } from "./goal-contribution-dialog"
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
    Target,
    PiggyBank,
    Car,
    Home,
    Gift,
    Gamepad2,
    Plane,
    Laptop,
    Edit,
    Trash2,
    Plus,
    Calendar,
    Clock,
    Sparkles,
    Wallet as WalletIcon,
    TrendingUp,
    Info,
    Activity,
    CalendarDays,
    Banknote,
    Hourglass,
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import Link from "next/link"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { toast } from "sonner"

const GOAL_ICONS: Record<string, React.ComponentType<any>> = {
    Target,
    PiggyBank,
    Car,
    Home,
    Gift,
    Gamepad2,
    Plane,
    Laptop,
}

interface GoalContribution {
    _id: string
    amount: number
    walletId: string
    date: string | Date
    notes?: string
}

interface GoalDetailsProps {
    goal: Goal
    contributions: GoalContribution[]
    wallets: Wallet[]
}

export function GoalDetails({ goal, contributions, wallets }: GoalDetailsProps) {
    const router = useRouter()
    const [editOpen, setEditOpen] = useState(false)
    const [contributeOpen, setContributeOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [localContributions, setLocalContributions] = useState(contributions)

    useEffect(() => {
        setLocalContributions(contributions)
    }, [contributions])

    const handleDeleteContribution = async (txId: string) => {
        const p = new Promise(async (resolve, reject) => {
            try {
                const res = await deleteTransaction(txId)
                if (res && !res.success) throw new Error(res.error || "Failed to delete")
                setLocalContributions((prev) => prev.filter((c) => c._id !== txId))
                router.refresh()
                resolve(true)
            } catch (err) { reject(err) }
        })
        toast.promise(p, {
            loading: "Deleting contribution...",
            success: "Contribution deleted successfully",
            error: (err: any) => err.message || "Failed to delete contribution"
        })
    }

    const IconComponent = GOAL_ICONS[goal.icon] || Target
    const percentage = Math.min(
        Math.round((goal.currentAmount / goal.targetAmount) * 100),
        100
    )
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)
    const isCompleted = goal.currentAmount >= goal.targetAmount
    const isOverdue = new Date(goal.targetDate) < new Date() && !isCompleted
    const daysUntilTarget = differenceInDays(new Date(goal.targetDate), new Date())

    const accentColor = goal.color || "#8b5cf6"
    const barColor = isCompleted ? "#10b981" : isOverdue ? "#f43f5e" : accentColor
    const pctColor = isCompleted ? "text-emerald-500" : isOverdue ? "text-rose-500" : "text-primary"
    const associatedWallet = wallets.find((w) => w._id.toString() === goal.walletId)

    const sortedContributions = [...localContributions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const avgContribution =
        localContributions.length > 0
            ? Math.round(localContributions.reduce((sum, c) => sum + c.amount, 0) / localContributions.length)
            : 0

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await deleteGoal(goal._id.toString())
            if (res && !res.success) {
                toast.error(res.error || "Failed to delete goal")
                return
            }
            toast.success("Goal deleted successfully")
            router.push("/goals")
        } catch (err) {
            console.error(err)
            toast.error("Failed to delete goal")
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
                        onClick={() => router.push("/goals")}
                        className="flex items-center justify-center size-11 shrink-0 border border-border/40 hover:bg-muted/50 rounded-2xl transition-colors mt-0.5 cursor-pointer"
                    >
                        <ArrowLeft className="size-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-extrabold tracking-tight">{goal.name}</h1>
                            {isCompleted ? (
                                <Badge className="rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[10px] h-5">
                                    Completed
                                </Badge>
                            ) : isOverdue ? (
                                <Badge variant="destructive" className="rounded-md font-semibold text-[10px] h-5">
                                    Overdue
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="rounded-md font-semibold text-[10px] h-5">
                                    Active
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Savings Goal · {goal.currency} · Target {formatDate(goal.targetDate)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {!isCompleted && (
                        <Button
                            onClick={() => setContributeOpen(true)}
                            className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform"
                        >
                            <Plus className="size-4" /> Contribute
                        </Button>
                    )}
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
                                <AlertDialogTitle>Delete this savings goal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove the goal and all of its contribution records. This
                                    action cannot be undone.
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
                                    {isDeleting ? "Deleting..." : "Delete Goal"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* ── Metric Cards ── */}
            <div className="flex flex-wrap gap-4">
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
                    icon={IconComponent}
                    color={accentColor}
                    label="Saved"
                    value={formatCurrency(goal.currentAmount, goal.currency)}
                />
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
                    icon={remaining > 0 ? TrendingUp : Sparkles}
                    color={remaining > 0 ? "#10b981" : "#f59e0b"}
                    label="Remaining"
                    value={remaining > 0 ? formatCurrency(remaining, goal.currency) : "Fully Funded"}
                />
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
                    icon={Target}
                    color="#3b82f6"
                    label="Target"
                    value={formatCurrency(goal.targetAmount, goal.currency)}
                />
                <MetricCard
                    style={{ minWidth: "clamp(200px, calc((1024px - 100%) * 9999), calc(25% - 1rem))" }}
                    icon={Clock}
                    color={isCompleted ? "#10b981" : isOverdue ? "#f43f5e" : accentColor}
                    label="Progress"
                    value={`${percentage}%`}
                    valueClassName={pctColor}
                />
            </div>

            {/* ── Progress Card ── */}
            <Card className="rounded-2xl border border-border/40 shadow-sm p-5 gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="size-4 text-primary" />
                        <span className="text-sm font-bold">Funding Progress</span>
                    </div>
                    <span className={cn("text-xs font-bold tabular-nums", isCompleted ? "text-emerald-500" : "text-primary")}>
                        {percentage}% complete
                    </span>
                </div>

                <Progress
                    value={percentage}
                    indicatorStyle={{ backgroundColor: barColor }}
                    className="h-2.5 bg-muted/60"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Saved</span>
                        <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(goal.currentAmount, goal.currency)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Remaining</span>
                        <span className="text-sm font-bold tabular-nums">{formatCurrency(remaining, goal.currency)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                            Contributions
                        </span>
                        <span className="text-sm font-bold tabular-nums">{contributions.length}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                            Avg. Contribution
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                            {avgContribution > 0 ? formatCurrency(avgContribution, goal.currency) : "—"}
                        </span>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ── Left column: Goal Info ── */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-border/30 flex items-center gap-2 shrink-0">
                            <Info className="size-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Goal Information
                            </span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-3.5 text-xs">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Banknote className="size-3" /> Currency
                                </span>
                                <span className="font-semibold">{goal.currency}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Calendar className="size-3" /> Target Date
                                </span>
                                <span className={cn("font-semibold", isOverdue && "text-rose-500")}>
                                    {formatDate(goal.targetDate)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Target className="size-3" /> Target Amount
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(goal.targetAmount, goal.currency)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <PiggyBank className="size-3" /> Remaining Gap
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(remaining, goal.currency)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Activity className="size-3" /> Status
                                </span>
                                <span className={cn("font-semibold", isCompleted ? "text-emerald-600 dark:text-emerald-400" : isOverdue ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400")}>
                                    {isCompleted ? "Completed" : isOverdue ? "Overdue" : "In Progress"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <CalendarDays className="size-3" /> Created At
                                </span>
                                <span className="font-semibold">
                                    {formatDate(goal.createdAt)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5 col-span-2">
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-1">
                                    <Hourglass className="size-3" /> Time Remaining
                                </span>
                                <span className="font-semibold">
                                    {isCompleted ? "Goal Completed!" : daysUntilTarget > 0 ? `${daysUntilTarget} days left` : "Overdue / Target date passed"}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Right column: Contribution History ── */}
                <div className="lg:col-span-2 flex flex-col gap-4 lg:h-0 lg:min-h-full">
                    <Card className="rounded-2xl border border-border/40 shadow-sm gap-0 py-0 flex-1 min-h-0 overflow-hidden">
                        <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Clock className="size-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Contribution History
                                </span>
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                                {sortedContributions.length} entr{sortedContributions.length !== 1 ? "ies" : "y"}
                            </span>
                        </div>

                        {sortedContributions.length > 0 ? (
                            <ScrollArea className="flex-1 min-h-0">
                                <ItemGroup className="gap-0 divide-y divide-border/30 px-2 py-1">
                                    {sortedContributions.map((c) => {
                                        const wallet = wallets.find((w) => w._id.toString() === c.walletId)
                                        return (
                                            <Item key={c._id.toString()} size="sm" className="group" asChild>
                                                <Link href={`/transactions/${c._id.toString()}`}>
                                                    <ItemMedia className="size-8 rounded-xl border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                        <Plus className="size-3.5" />
                                                    </ItemMedia>
                                                    <ItemContent className="gap-0.5">
                                                        <ItemTitle className="flex-wrap gap-2">
                                                            <span className="text-xs font-bold text-foreground">Contribution</span>
                                                            <span className="text-[10px] font-normal text-muted-foreground">
                                                                {format(new Date(c.date), "PP")}
                                                            </span>
                                                        </ItemTitle>
                                                        <ItemDescription className="truncate text-[11px]">
                                                            {c.notes || `From ${wallet?.name || "wallet"}`}
                                                        </ItemDescription>
                                                    </ItemContent>
                                                    <ItemActions>
                                                        <span className="text-xs font-bold whitespace-nowrap tabular-nums text-emerald-600 dark:text-emerald-400">
                                                            +{formatCurrency(c.amount, goal.currency)}
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
                                                                        <AlertDialogTitle>Delete this contribution?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will permanently delete this contribution transaction, revert the wallet balance, and update the goal's saved amount. This cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="rounded-xl font-semibold">
                                                                            Cancel
                                                                        </AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            variant="destructive"
                                                                            className="rounded-xl font-semibold"
                                                                            onClick={() => handleDeleteContribution(c._id.toString())}
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
                                <WalletIcon className="size-8 text-muted-foreground/25 mb-2" />
                                <p className="text-sm font-bold">No contributions yet</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                    Contribute from a wallet to start funding this goal.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <GoalFormDialog open={editOpen} onOpenChange={setEditOpen} goal={goal} />
            <GoalContributionDialog
                open={contributeOpen}
                onOpenChange={setContributeOpen}
                goal={goal}
                wallets={wallets}
            />
        </div>
    )
}