import { Skeleton } from "@/components/ui/skeleton"

export default function RootLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        <Skeleton className="size-12 rounded-2xl animate-pulse" />
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-2 w-48 rounded-full" />
      </div>
    </div>
  )
}
