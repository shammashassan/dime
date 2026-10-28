"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

export default function InterceptedTransactionLoading() {
  const router = useRouter()

  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) {
        router.back()
      }
    }}>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl p-0 min-w-0">
        <DialogHeader className="px-6 pt-6 pb-0 min-w-0">
          <DialogTitle className="text-xl font-extrabold tracking-tight truncate">
            Transaction Details
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4 min-w-0 flex flex-col gap-6">
          {/* Top amount and category banner */}
          <div className="flex items-center justify-between pb-6 border-b border-border/20">
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-12 rounded-xl shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Attribute lines */}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
            ))}
          </div>

          {/* Action buttons footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
