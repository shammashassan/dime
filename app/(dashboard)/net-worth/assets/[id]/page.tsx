import { Suspense } from "react"
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getAssetById, getAssetValuations } from "@/lib/queries/assets"
import { AssetDetails } from "@/components/net-worth/asset-details"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

function AssetDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-pulse p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[90px] flex-1 min-w-[200px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[250px] w-full rounded-2xl" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[220px] w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

async function AssetDetailContent({ id }: { id: string }) {
  await requireApprovedUser()

  const asset = await getAssetById(id)
  if (!asset) {
    notFound()
  }

  const valuations = await getAssetValuations(id)

  return (
    <AssetDetails
      asset={serializeData(asset)}
      valuations={serializeData(valuations)}
    />
  )
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Suspense fallback={<AssetDetailSkeleton />}>
      <AssetDetailContent id={id} />
    </Suspense>
  )
}
