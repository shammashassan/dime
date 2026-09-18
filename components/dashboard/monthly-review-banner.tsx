"use client"

import * as React from "react"
import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"
import {
  Banner,
  BannerIcon,
  BannerTitle,
  BannerAction,
  BannerClose,
} from "@/components/ui/banner"
import { formatCurrency } from "@/lib/utils"
import type { LatestCompletedMonthSummary } from "@/types"

const emptySubscribe = (callback: () => void) => {
  if (typeof window === "undefined") return () => {}
  window.addEventListener("storage", callback)
  window.addEventListener("dime-review-dismiss", callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener("dime-review-dismiss", callback)
  }
}

export function MonthlyReviewBanner({
  summary,
}: {
  summary?: LatestCompletedMonthSummary | null
}) {
  const monthKey = summary?.monthKey || ""

  const isDismissed = React.useSyncExternalStore(
    emptySubscribe,
    () => {
      if (!monthKey) return true
      try {
        return localStorage.getItem(`dime_review_dismissed_${monthKey}`) === "true"
      } catch {
        return false
      }
    },
    () => true // Server snapshot
  )

  if (isDismissed || !summary || !summary.hasTransactions) {
    return null
  }

  // Show during first 14 days of current month
  const now = new Date()
  if (now.getDate() > 14) {
    return null
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(`dime_review_dismissed_${monthKey}`, "true")
      window.dispatchEvent(new Event("dime-review-dismiss"))
    } catch {
      // Ignore
    }
  }

  return (
    <Banner
      inset
      className="mb-2 bg-gradient-to-r from-primary/95 via-primary to-primary/90 text-primary-foreground shadow-xs border border-primary/20"
      onClose={handleDismiss}
    >
      <BannerIcon icon={Sparkles} className="bg-primary-foreground/15 border-primary-foreground/20 text-primary-foreground" />
      <BannerTitle className="text-xs sm:text-sm font-medium">
        <span>
          <strong>{summary.monthLabel} Review is ready:</strong>{" "}
          {summary.savingsRatePercentage > 0 ? (
            <>You saved {summary.savingsRatePercentage}% ({formatCurrency(summary.netSavingsCents, summary.targetCurrency)}) of your income.</>
          ) : (
            <>Review your category spending shifts and budget performance.</>
          )}
        </span>
      </BannerTitle>
      <div className="flex items-center gap-1.5 shrink-0">
        <BannerAction
          asChild
          variant="outline"
          size="sm"
          className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 h-7 text-xs px-2.5"
          onClick={handleDismiss}
        >
          <Link href={`/reports?tab=review&month=${summary.monthKey}`}>
            <span>View Review</span>
            <ArrowRight className="size-3 ml-1" />
          </Link>
        </BannerAction>
        <BannerClose
          onClick={handleDismiss}
          className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20 size-7"
        />
      </div>
    </Banner>
  )
}
