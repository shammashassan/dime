"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, RotateCcw, Home } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
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
    reset?: () => void
    retry?: () => void
    title?: string
    description?: string
    backHref?: string
    backLabel?: string
}

export function RouteError({
    error,
    reset,
    retry,
    title = "Something went wrong",
    description = "An unexpected error interrupted this page. You can try refreshing or returning to navigation.",
    backHref = "/dashboard",
    backLabel = "Return to Dashboard",
}: RouteErrorProps) {
    const router = useRouter()
    const [isPending, startTransition] = React.useTransition()

    React.useEffect(() => {
        console.error("Route error boundary triggered:", error)
    }, [error])

    const handleRetry = React.useCallback(() => {
        startTransition(() => {
            if (retry) {
                retry()
            } else if (reset) {
                router.refresh()
                reset()
            } else {
                window.location.reload()
            }
        })
    }, [retry, reset, router])

    return (
        <div className="min-h-100 flex items-center justify-center p-6 w-full">
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

                    {process.env.NODE_ENV === "development" && error?.message && (
                        <div className="mt-2 text-left w-full rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs font-mono text-destructive">
                            <span className="font-semibold block text-[10px] uppercase tracking-wider mb-1 text-destructive/70">
                                Diagnostics (Dev Only)
                            </span>
                            <p className="break-all select-all leading-snug">{error.message}</p>
                        </div>
                    )}

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
                        onClick={handleRetry}
                        disabled={isPending}
                        className="rounded-xl font-bold gap-1.5"
                    >
                        <RotateCcw className={cn("size-4", isPending && "animate-spin")} />
                        {isPending ? "Retrying..." : "Try Again"}
                    </Button>
                    <Link
                        href={backHref}
                        className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "rounded-xl font-bold gap-1.5 border-border/60"
                        )}
                    >
                        <Home className="size-4" />
                        {backLabel}
                    </Link>
                </EmptyContent>
            </Empty>
        </div>
    )
}
