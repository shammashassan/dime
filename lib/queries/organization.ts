import { organizationSettingsCollection } from "@/lib/db/collections";
import { cache } from "react";

/**
 * Retrieves the settings for a specific organization.
 */
export const getOrganizationSettings = cache(async (orgId: string) => {
  return organizationSettingsCollection.findOne({ organizationId: orgId });
});
