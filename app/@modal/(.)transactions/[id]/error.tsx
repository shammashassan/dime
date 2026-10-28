"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function InterceptedTransactionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) {
        router.back()
      }
    }}>
      <DialogContent className="max-w-md bg-background border border-border/40 rounded-2xl shadow-xl p-6 min-w-0">
        <DialogHeader className="min-w-0">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5 shrink-0" />
            <DialogTitle className="text-lg font-bold">Failed to load transaction</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-2">
          {error.message || "Could not load details for this transaction."}
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Close
          </Button>
          <Button size="sm" onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
