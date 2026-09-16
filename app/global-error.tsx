"use client"

import * as React from "react"
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

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error("Root global error occurred:", error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-sans antialiased">
        <Empty className="max-w-md w-full border border-border/50 bg-card p-8 sm:p-12 shadow-2xl rounded-3xl">
          <EmptyMedia variant="icon" className="size-16 rounded-2xl bg-destructive/10 text-destructive mb-2">
            <AlertCircle className="size-8" />
          </EmptyMedia>
          <EmptyHeader className="gap-2">
            <EmptyTitle className="text-2xl font-extrabold tracking-tight text-foreground">
              Application Shell Error
            </EmptyTitle>
            <EmptyDescription className="text-sm text-muted-foreground leading-relaxed">
              A critical error interrupted the root application layout. You can attempt to reload the session or restart navigation.
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
              <RotateCcw data-icon="inline-start" className="size-4" />
              Reload Application
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = "/" }}
              className="rounded-xl font-bold gap-1.5 border-border/60"
            >
              <Home data-icon="inline-start" className="size-4" />
              Return Home
            </Button>
          </EmptyContent>
        </Empty>
      </body>
    </html>
  )
}
