import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Asset Details",
  description: "View valuation history and asset information.",
}
import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getAssetById, getAssetValuations } from "@/lib/queries/assets"
import { AssetDetails } from "@/components/net-worth/asset-details"
import { serializeData } from "@/lib/utils"

import {
  calculateAssetValuationMetrics,
  generateAssetValuationBriefing,
} from "@/lib/calculations/asset-valuation"
import { AssetDetailSkeleton } from "./loading"

async function AssetDetailContent({ id }: { id: string }) {
  await requireApprovedUser()

  const asset = await getAssetById(id)
  if (!asset) {
    notFound()
  }

  const valuations = await getAssetValuations(id)
  const metrics = calculateAssetValuationMetrics(asset, valuations)
  const briefing = await generateAssetValuationBriefing(
    asset.name,
    asset.category,
    metrics,
    asset.currency
  )

  return (
    <AssetDetails
      asset={serializeData(asset)}
      valuations={serializeData(valuations)}
      valuationMetrics={serializeData(metrics)}
      valuationBriefing={serializeData(briefing)}
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
