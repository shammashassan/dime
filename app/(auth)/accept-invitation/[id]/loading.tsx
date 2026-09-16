import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AcceptInvitationLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border border-border/40 shadow-xl rounded-2xl overflow-hidden p-6 text-center flex flex-col items-center">
        <Skeleton className="h-12 w-12 rounded-2xl mb-3" />
        <Skeleton className="h-6 w-48 rounded mb-2" />
        <Skeleton className="h-4 w-64 rounded" />
      </Card>
    </div>
  )
}
