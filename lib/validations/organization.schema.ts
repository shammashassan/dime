import { z } from "zod";

export const organizationSettingsSchema = z.object({
  baseCurrency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
  locale: z.string().min(2, "Locale must be at least 2 characters").max(10, "Locale must be 10 characters or less"),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  spaceType: z.enum(["family", "couple", "business", "travel", "roommates", "other"]),
});

export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
