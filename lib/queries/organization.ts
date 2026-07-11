import { organizationSettingsCollection } from "@/lib/db/collections";
import { OrganizationSettings } from "@/types";
import { cache } from "react";

/**
 * Retrieves the settings for a specific organization.
 */
export const getOrganizationSettings = cache(async (orgId: string): Promise<OrganizationSettings | null> => {
  return organizationSettingsCollection.findOne({ organizationId: orgId });
});

