import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import React from "react"

interface MetricCardProps {
  icon: React.ElementType
  color: string
  label: string
  value: React.ReactNode
  valueClassName?: string
  className?: string
  style?: React.CSSProperties
}

export function MetricCard({ icon: Icon, color, label, value, valueClassName, className, style }: MetricCardProps) {
  return (
    <Card className={cn("group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex-1 min-w-[200px]", className)} style={style}>
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ background: `radial-gradient(120% 100% at 0% 0%, ${color}, transparent 60%)` }} />
      <CardContent className="relative p-4 flex items-center gap-3">
        <div className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: color + "18", color }}>
          <Icon className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 truncate">{label}</p>
          <div className={cn("text-xl font-black tabular-nums leading-tight truncate", valueClassName)}>{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}
