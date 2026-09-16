import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function VerifyEmailLoading() {
  return (
    <Card className="w-full max-w-md border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl p-6 text-center flex flex-col items-center">
      <Skeleton className="h-12 w-12 rounded-2xl mb-4" />
      <Skeleton className="h-6 w-44 rounded mb-2" />
      <Skeleton className="h-4 w-64 rounded" />
    </Card>
  )
}
