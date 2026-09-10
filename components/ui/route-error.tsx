"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle, RotateCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"

interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
  backHref?: string
  backLabel?: string
}

export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  description = "An unexpected error interrupted this page. You can try refreshing or returning to navigation.",
  backHref = "/dashboard",
  backLabel = "Return to Dashboard",
}: RouteErrorProps) {
  React.useEffect(() => {
    console.error("Route error boundary triggered:", error)
  }, [error])

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 w-full">
      <Empty className="max-w-md w-full border border-border/50 bg-card p-8 shadow-sm rounded-3xl">
        <EmptyMedia variant="icon" className="size-14 rounded-2xl bg-destructive/10 text-destructive mb-2">
          <AlertCircle className="size-7" />
        </EmptyMedia>
        <EmptyHeader className="gap-2">
          <EmptyTitle className="text-xl font-extrabold tracking-tight text-foreground">
            {title}
          </EmptyTitle>
          <EmptyDescription className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </EmptyDescription>
          {error?.digest && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/60 bg-muted/40 text-[11px] font-mono text-muted-foreground">
              <span>Incident Ref:</span>
              <span className="text-foreground font-semibold">{error.digest}</span>
            </div>
          )}
        </EmptyHeader>
        <EmptyContent className="flex flex-row gap-3 pt-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => reset()}
            className="rounded-xl font-bold gap-1.5"
          >
            <RotateCcw className="size-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-xl font-bold gap-1.5 border-border/60"
          >
            <Link href={backHref}>
              <Home className="size-4" />
              {backLabel}
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
