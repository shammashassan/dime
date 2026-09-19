import * as React from "react"
import Link from "next/link"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface MetricCardProps extends React.ComponentProps<"div"> {
  icon?: React.ElementType
  color?: string
  label?: React.ReactNode
  value?: React.ReactNode
  subtext?: React.ReactNode
  valueClassName?: string
  className?: string
  style?: React.CSSProperties
  asChild?: boolean
  href?: string
  showChevron?: boolean
  active?: boolean
  badge?: React.ReactNode
}

export function MetricCard({
  icon: Icon,
  color,
  label,
  value,
  subtext,
  valueClassName,
  className,
  style,
  asChild = false,
  href,
  showChevron,
  active,
  badge,
  children,
  ...props
}: MetricCardProps) {
  const isInteractive = Boolean(asChild || href || props.onClick || active !== undefined)
  const hasChevron = showChevron ?? (active !== undefined ? false : isInteractive)

  const cardClassName = cn(
    "group/card group relative flex flex-col py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card text-card-foreground ring-1 ring-foreground/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex-1 min-w-[200px]",
    active && "border-primary bg-primary/[0.03] dark:bg-primary/[0.06] shadow-md -translate-y-0.5",
    isInteractive && "cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className
  )

  const mergedStyle: React.CSSProperties = {
    minWidth: "clamp(200px, calc((848px - 100%) * 9999), calc(50% - 1rem))",
    ...style,
  }

  const defaultContent = (Icon || label || value !== undefined || subtext) ? (
    <>
      {color && (
        <div
          className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.15]"
          style={{ background: `radial-gradient(120% 100% at 0% 0%, ${color}, transparent 60%)` }}
        />
      )}
      <CardContent className="relative p-4 flex items-center gap-3">
        {Icon && (
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={color ? { backgroundColor: color + "18", color } : undefined}
          >
            <Icon className="size-[18px]" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            {label && (
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 truncate">
                {label}
              </div>
            )}
            {badge && (
              <div className="shrink-0">{badge}</div>
            )}
          </div>
          {value !== undefined && (
            <div className={cn("text-xl font-black tabular-nums leading-tight truncate", valueClassName)}>
              {value}
            </div>
          )}
          {subtext && (
            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
              {subtext}
            </div>
          )}
        </div>
        {hasChevron && (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-all duration-300 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-foreground" />
        )}
      </CardContent>
    </>
  ) : null

  if (asChild) {
    const child = React.isValidElement(children) ? children : null
    if (!child) {
      return null
    }

    const childProps = child.props as { children?: React.ReactNode; className?: string; style?: React.CSSProperties }
    const childContent = childProps.children !== undefined ? childProps.children : defaultContent

    return (
      <Slot
        data-slot="metric-card"
        className={cardClassName}
        style={mergedStyle}
        {...props}
      >
        {React.cloneElement(child, {}, childContent)}
      </Slot>
    )
  }

  if (href) {
    return (
      <Link
        href={href}
        data-slot="metric-card"
        className={cardClassName}
        style={mergedStyle}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children ?? defaultContent}
      </Link>
    )
  }

  return (
    <Card
      data-slot="metric-card"
      className={cardClassName}
      style={mergedStyle}
      {...props}
    >
      {children ?? defaultContent}
    </Card>
  )
}

