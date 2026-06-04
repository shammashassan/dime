import { cache } from "react"
import { getCollection } from "@/lib/db/collections"
import { ObjectId } from "mongodb"
import { Goal } from "@/types"

export const getGoals = cache(async (userId: string): Promise<Goal[]> => {
  const goalsColl = await getCollection<Goal>("goals")
  return goalsColl.find({ userId }).sort({ targetDate: 1 }).toArray()
})

export const getGoalById = cache(async (userId: string, id: string): Promise<Goal | null> => {
  try {
    const goalsColl = await getCollection<Goal>("goals")
    return goalsColl.findOne({ _id: new ObjectId(id), userId })
  } catch (err) {
    return null
  }
})
