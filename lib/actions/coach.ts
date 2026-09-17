"use server"

import { revalidatePath } from "next/cache"
import { requireApprovedUser } from "@/lib/auth-guard"
import { getFinancialScope } from "@/lib/scope"
import { coachMessagesCollection } from "@/lib/db/collections"
import { askCoachSchema, AskCoachInput } from "@/lib/validations/coach.schema"
import { getCoachOverviewData } from "@/lib/queries/coach"
import {
  generateCoachChatAnswer,
  generateOnDemandAiBriefing,
} from "@/lib/calculations/coach"
import type { CoachSummaryBrief } from "@/types"

export async function askCoachAction(rawInput: AskCoachInput): Promise<{
  success: boolean
  reply?: string
  error?: string
}> {
  try {
    const session = await requireApprovedUser()
    const parsed = askCoachSchema.safeParse(rawInput)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid question" }
    }

    const { question } = parsed.data
    const userId = session.user.id
    const scope = await getFinancialScope()
    const organizationId = scope.isOrganization ? scope.organizationId : null

    // Get current financial telemetry to ground the coach
    const overview = await getCoachOverviewData(userId)

    // Get recent chat history
    const recentHistory = (overview.recentChatMessages || []).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    // Save user's question first
    await coachMessagesCollection.insertOne({
      userId,
      organizationId,
      role: "user",
      content: question,
      createdAt: new Date(),
    } as any)

    // Generate grounded response (Gemini if key exists, deterministic fallback otherwise)
    const reply = await generateCoachChatAnswer({
      question,
      context: {
        liquidSavingsCents: overview.emergencyFund.liquidSavingsCents,
        monthlyBurnRateCents: overview.emergencyFund.monthlyBurnRateCents,
        runwayMonths: overview.emergencyFund.currentRunwayMonths,
        totalDebtCents: overview.debtComparison ? overview.debtComparison.totalDebtCents : 0,
        activeLoansCount: overview.debtComparison ? overview.debtComparison.activeLoanCount : 0,
        activeGoalsCount: overview.goalAccelerations.length,
        currency: overview.targetCurrency,
        topStrategies: overview.strategies.map((s) => s.title),
      },
      history: recentHistory,
    })

    // Save coach's reply
    await coachMessagesCollection.insertOne({
      userId,
      organizationId,
      role: "coach",
      content: reply,
      createdAt: new Date(),
    } as any)

    revalidatePath("/coach")
    return { success: true, reply }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to consult coach" }
  }
}

export async function clearCoachChatAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireApprovedUser()
    const userId = session.user.id
    const scope = await getFinancialScope()
    const organizationId = scope.isOrganization ? scope.organizationId : null

    await coachMessagesCollection.deleteMany({
      userId,
      ...(organizationId ? { organizationId } : {}),
    })

    revalidatePath("/coach")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to clear chat history" }
  }
}

export async function refreshAiBriefingAction(): Promise<{
  success: boolean
  brief?: CoachSummaryBrief
  error?: string
}> {
  try {
    const session = await requireApprovedUser()
    const overview = await getCoachOverviewData(session.user.id)

    const brief = await generateOnDemandAiBriefing({
      strategies: overview.strategies,
      emergencyFund: overview.emergencyFund,
      debtComparison: overview.debtComparison,
      currency: overview.targetCurrency,
    })

    return { success: true, brief }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to generate AI review" }
  }
}
