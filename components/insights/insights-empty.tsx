import React from "react"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"
import { Sparkles } from "lucide-react"

interface InsightsEmptyProps {
  title?: string
  description?: string
}

export function InsightsEmpty({
  title = "All clear on this radar",
  description = "No active spending spikes, billing anomalies, or irregularities found for this category.",
}: InsightsEmptyProps) {
  return (
    <Empty className="rounded-2xl border border-dashed border-border/60 p-8 flex flex-col items-center justify-center text-center">
      <EmptyMedia variant="icon" className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Sparkles className="size-5" aria-hidden="true" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle className="text-base font-bold text-foreground">{title}</EmptyTitle>
        <EmptyDescription className="text-xs text-muted-foreground max-w-sm mt-1">
          {description}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
