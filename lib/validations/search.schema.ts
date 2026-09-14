import { z } from "zod"

export const saveSearchSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  query: z.string().trim().min(1, "Query cannot be empty").max(500, "Query is too long"),
})

export type SaveSearchInput = z.infer<typeof saveSearchSchema>

export const deleteSearchSchema = z.object({
  id: z.string().min(1, "Search ID is required"),
})

export type DeleteSearchInput = z.infer<typeof deleteSearchSchema>
