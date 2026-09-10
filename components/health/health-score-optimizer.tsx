"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SlidersHorizontal, Sparkles, TrendingUp } from "lucide-react"

interface HealthScoreOptimizerCardProps {
    currentScore: number
    potentialScore: number
    totalPotentialBoost: number
    onOpenSimulator: () => void
}

const LEVERAGES = [
    { label: "Emergency Runway Boost", points: 5 },
    { label: "Debt Paydown Acceleration", points: 5 },
    { label: "Subscription Leaks Optimization", points: 4 },
]

export function HealthScoreOptimizerCard({
    currentScore,
    potentialScore,
    totalPotentialBoost,
    onOpenSimulator,
}: HealthScoreOptimizerCardProps) {
    return (
        <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
            <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                        Score Optimizer
                    </span>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 h-4.5 rounded-md gap-1 shrink-0">
                    <Sparkles className="size-2.5 text-primary" />
                    What-If
                </Badge>
            </div>

            <div className="p-3.5 flex-1 flex flex-col justify-between gap-3.5">
                {/* Score Target Preview */}
                <div className="rounded-xl border border-border/30 bg-muted/20 p-3 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Current</span>
                        <span className="text-xl font-extrabold tabular-nums text-foreground">{currentScore}</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                            <TrendingUp className="size-3" />
                            +{totalPotentialBoost} pts
                        </span>
                        <span className="text-[9px] text-muted-foreground">Unlockable</span>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-semibold text-primary uppercase tracking-wider">Target</span>
                        <span className="text-xl font-extrabold tabular-nums text-primary">{potentialScore}</span>
                    </div>
                </div>

                {/* Action Opportunities Summary */}
                <div className="flex flex-col gap-2 text-xs">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Key Leverages</span>
                    <div className="flex flex-col gap-1.5 text-muted-foreground text-xs">
                        {LEVERAGES.map((lev, idx) => (
                            <div
                                key={lev.label}
                                className={
                                    idx < LEVERAGES.length - 1
                                        ? "flex items-center justify-between py-1 border-b border-border/20"
                                        : "flex items-center justify-between py-1"
                                }
                            >
                                <span className="truncate">{lev.label}</span>
                                <span className="font-semibold text-foreground shrink-0">+{lev.points} pts</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Simulation Action CTA */}
                <Button
                    onClick={onOpenSimulator}
                    className="w-full rounded-xl text-xs font-bold h-9 gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                >
                    <SlidersHorizontal className="size-3.5" />
                    Run What-If Simulation
                </Button>
            </div>
        </div>
    )
}