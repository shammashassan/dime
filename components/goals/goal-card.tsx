"use client"

import React, { useState } from "react"
import { Goal, Wallet } from "@/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Target, 
  PiggyBank, 
  Car, 
  Home, 
  Gift, 
  Gamepad2, 
  Plane, 
  Laptop, 
  Calendar, 
  Edit, 
  Trash2, 
  Plus, 
  Sparkles,
  Wallet as WalletIcon
} from "lucide-react"
import { toast } from "sonner"
import { GoalFormDialog } from "./goal-form"
import { GoalContributionDialog } from "./goal-contribution-dialog"
import { cn } from "@/lib/utils"

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

interface GoalCardProps {
  goal: Goal
  wallets: Wallet[]
  onDeleteClick: () => void
}

export function GoalCard({ goal, wallets, onDeleteClick }: GoalCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [contributeOpen, setContributeOpen] = useState(false)

  const IconComponent = GOAL_ICONS[goal.icon] || Target
  const percentage = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
    100
  )
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)
  
  const formattedTargetDate = formatDate(goal.targetDate)
  const isCompleted = goal.currentAmount >= goal.targetAmount
  const isOverdue = new Date(goal.targetDate) < new Date() && !isCompleted

  const accentColor = goal.color || "#8b5cf6"
  const barColor = isCompleted ? "#10b981" : isOverdue ? "#f43f5e" : accentColor
  const pctColor = isCompleted ? "text-emerald-500" : isOverdue ? "text-rose-500" : "text-primary"

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
        {/* Top Accent line */}
        <div className="h-[3px] w-full" style={{ backgroundColor: accentColor }} />

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundColor: accentColor + "18", color: accentColor }}
            >
              <IconComponent className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                {goal.name}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 border-border/50 text-muted-foreground bg-muted/10">
                  {goal.currency}
                </Badge>
                {isCompleted ? (
                  <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                    Completed
                  </Badge>
                ) : isOverdue ? (
                  <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4 border-rose-500/20 text-rose-500 bg-rose-500/5">
                    Overdue
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons (hover visible) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5">
            <Button
              variant="ghost" size="icon"
              className="size-8 rounded-lg hover:bg-muted/70 cursor-pointer"
              onClick={() => setEditOpen(true)}
            >
              <Edit className="size-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              onClick={onDeleteClick}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-4 pb-3 flex flex-col gap-3">
          {/* Amounts saved vs percentage */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Saved</p>
              <p className="text-[1.5rem] font-black tabular-nums text-foreground leading-none select-all">
                {formatCurrency(goal.currentAmount, goal.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Progress</p>
              <p className={cn("text-[1.5rem] font-black tabular-nums leading-none", pctColor)}>
                {percentage}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%`, backgroundColor: barColor }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-medium text-muted-foreground mt-1">
              <span>
                {remaining > 0 ? (
                  `${formatCurrency(remaining, goal.currency)} remaining`
                ) : (
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <Sparkles className="size-3 animate-pulse" /> Fully Funded!
                  </span>
                )}
              </span>
              <span>Target: {formatCurrency(goal.targetAmount, goal.currency)}</span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-border/20 px-4 py-2 flex items-center justify-between gap-1.5 mt-auto bg-muted/20">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="size-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground font-semibold truncate">
              Target {formattedTargetDate}
            </span>
          </div>
          
          {!isCompleted && (
            <Button
              size="sm"
              onClick={() => setContributeOpen(true)}
              className="h-7 rounded-lg text-xs font-bold px-3 cursor-pointer shrink-0"
            >
              <Plus className="mr-1 size-3" /> Contribute
            </Button>
          )}
        </div>
      </div>

      <GoalFormDialog 
        open={editOpen} 
        onOpenChange={setEditOpen} 
        goal={goal} 
      />

      <GoalContributionDialog
        open={contributeOpen}
        onOpenChange={setContributeOpen}
        goal={goal}
        wallets={wallets}
      />
    </>
  )
}
