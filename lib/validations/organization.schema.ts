import { z } from "zod";

export const organizationSettingsSchema = z.object({
  baseCurrency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  spaceType: z.enum(["family", "couple", "business", "travel", "roommates", "other"]),
});

export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
