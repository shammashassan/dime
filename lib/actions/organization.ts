"use server";

import { organizationSettingsCollection } from "@/lib/db/collections";
import { getFinancialScope } from "@/lib/scope";
import { revalidateTag } from "next/cache";

export async function updateOrganizationSettings(data: {
  baseCurrency: string;
  locale: string;
  fiscalYearStartMonth: number;
  spaceType: "family" | "couple" | "business" | "travel" | "roommates" | "other";
}) {
  const scope = await getFinancialScope();
  if (!scope.isOrganization || !scope.organizationId) {
    throw new Error("Not inside an organization space");
  }

  const now = new Date();

  // Find and update, or insert if not exists
  await organizationSettingsCollection.findOneAndUpdate(
    { organizationId: scope.organizationId },
    {
      $set: {
        baseCurrency: data.baseCurrency,
        locale: data.locale,
        fiscalYearStartMonth: data.fiscalYearStartMonth,
        spaceType: data.spaceType,
        updatedBy: scope.userId,
        updatedAt: now,
      },
      $setOnInsert: {
        organizationId: scope.organizationId,
      },
      $inc: { version: 1 }
    },
    { upsert: true }
  );

  // Invalidate cache tags
  revalidateTag(`org-settings-${scope.organizationId}`, "max");
  
  return { success: true };
}
