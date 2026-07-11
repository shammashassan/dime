"use server";

import { organizationSettingsCollection } from "@/lib/db/collections";
import { getFinancialScope } from "@/lib/scope";
import { organizationSettingsSchema } from "@/lib/validations/organization.schema";
import { updateTag } from "next/cache";

export async function updateOrganizationSettings(input: unknown) {
  const data = organizationSettingsSchema.parse(input);
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
  updateTag(`org-settings-${scope.organizationId}`);
  
  return { success: true };
}


