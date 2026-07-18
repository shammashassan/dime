import { notFound } from "next/navigation"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getAssetById, getAssetValuations } from "@/lib/queries/assets"
import { AssetDetails } from "@/components/net-worth/asset-details"
import { serializeData } from "@/lib/utils"

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireApprovedUser()
  const { id } = await params

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
