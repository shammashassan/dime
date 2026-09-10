import { Suspense } from "react"
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getAssetById, getAssetValuations } from "@/lib/queries/assets"
import { AssetDetails } from "@/components/net-worth/asset-details"
import { serializeData } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

import { AssetDetailSkeleton } from "./loading"

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
