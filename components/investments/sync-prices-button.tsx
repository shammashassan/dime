"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { syncMarketPricesAction } from "@/lib/actions/market-prices"

interface SyncPricesButtonProps {
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function SyncPricesButton({
  variant = "outline",
  size = "sm",
  className,
}: SyncPricesButtonProps) {
  const [isPending, startTransition] = React.useTransition()

  const handleSync = () => {
    startTransition(async () => {
      try {
        const res = await syncMarketPricesAction()
        if (res.success) {
          if (res.updatedCount > 0) {
            const syms = (res as any).symbols
            const label = syms && syms.length > 0 ? syms.join(", ") : `${res.updatedCount} holdings`
            toast.success(`Updated market prices for ${label}`)
          } else {
            toast.info("Prices are already up to date or no live quotes were found")
          }
        } else {
          toast.error(res.error || "Failed to sync market prices")
        }
      } catch {
        toast.error("An unexpected error occurred while syncing market prices")
      }
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isPending}
      className={className}
    >
      <RefreshCw className={`size-3.5 ${isPending ? "animate-spin text-primary" : ""}`} />
      <span>{isPending ? "Syncing..." : "Sync Prices"}</span>
    </Button>
  )
}
