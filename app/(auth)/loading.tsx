import { Skeleton } from "@/components/ui/skeleton"

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md p-8 rounded-3xl border border-border/40 bg-card/60 shadow-xl flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="size-12 rounded-2xl" />
        <Skeleton className="h-6 w-40 rounded-md mt-2" />
        <Skeleton className="h-4 w-60 rounded-md" />
      </div>
      <div className="flex flex-col gap-4 mt-2">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl mt-2" />
      </div>
    </div>
  )
}
