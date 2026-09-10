"use client"

import * as React from "react"
import Link from "next/link"
import { HealthRecommendation, PillarId } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemActions,
} from "@/components/ui/item"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Droplet,
  PiggyBank,
  Scale,
  Receipt,
  TrendingUp,
  Lightbulb,
} from "lucide-react"

interface HealthRecommendationsProps {
  recommendations: HealthRecommendation[]
}

const pillarIconMap: Record<PillarId, React.ComponentType<{ className?: string }>> = {
  liquidity: Droplet,
  savings: PiggyBank,
  debt: Scale,
  budget: Receipt,
  growth: TrendingUp,
}

const pillarColorMap: Record<PillarId, string> = {
  liquidity: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  savings: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  debt: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  budget: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  growth: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
}

export function HealthRecommendations({ recommendations }: HealthRecommendationsProps) {
  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden h-full flex flex-col bg-card">
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            Actionable Score Improvements
          </span>
        </div>
        <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0 h-4.5 rounded-md shrink-0">
          {recommendations.length} Suggestions
        </Badge>
      </div>

      <div className="flex-1 flex flex-col justify-center min-h-0">
        {recommendations.length > 0 ? (
          <ScrollArea className="h-64 sm:h-72 px-2">
            <ItemGroup className="flex flex-col divide-y divide-border/20 gap-0 py-2">
              {recommendations.map((rec) => {
                const Icon = pillarIconMap[rec.pillarId] || Lightbulb
                const iconColor = pillarColorMap[rec.pillarId] || "text-primary bg-primary/10 border-primary/20"

                return (
                  <Item
                    key={rec.id}
                    className="flex-col xl:flex-row items-start xl:items-center justify-between gap-2.5 px-2.5 py-3 hover:bg-muted/40 transition-colors rounded-xl border-transparent"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1 w-full">
                      <ItemMedia className={cn("size-8 rounded-lg border shrink-0 mt-0.5", iconColor)}>
                        <Icon className="size-4" />
                      </ItemMedia>
                      <ItemContent className="min-w-0 flex-1 flex flex-col gap-1">
                        {/* Line 1: Title and Potential Points Badge */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground leading-snug">
                            {rec.title}
                          </span>
                          <Badge
                            variant={rec.priority === "high" ? "default" : "secondary"}
                            className="text-[10px] font-bold px-1.5 py-0 h-4 rounded-sm shrink-0"
                          >
                            +{rec.potentialPoints} pts
                          </Badge>
                        </div>

                        {/* Line 2: Full-width Description on its own line */}
                        <ItemDescription className="text-xs text-muted-foreground leading-relaxed">
                          {rec.description}
                        </ItemDescription>
                      </ItemContent>
                    </div>

                    {/* Line 3: Action Button on its own line on middle/small screens, inline on xl */}
                    {rec.actionUrl && (
                      <ItemActions className="shrink-0 w-full xl:w-auto pl-11 xl:pl-0 flex justify-start sm:justify-end xl:justify-start">
                        <Button
                          variant="outline"
                          size="xs"
                          asChild
                          className="w-full sm:w-auto rounded-lg font-medium text-[11px] h-7 px-3 hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Link href={rec.actionUrl}>
                            {rec.actionLabel || "Take Action"}
                            <ArrowRight data-icon="inline-end" className="size-3 ml-1" />
                          </Link>
                        </Button>
                      </ItemActions>
                    )}
                  </Item>
                )
              })}
            </ItemGroup>
          </ScrollArea>
        ) : (
          <Empty className="py-10">
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
              <CheckCircle2 className="size-6" />
            </div>
            <EmptyHeader>
              <EmptyTitle className="text-sm">Peak Financial Health</EmptyTitle>
              <EmptyDescription className="text-xs max-w-sm">
                All key metrics across emergency reserves, savings rate, debt ratio, and budget adherence are in optimal ranges.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  )
}