"use server"

import { requireApprovedUser } from "@/lib/auth-guard"
import { getCollection } from "@/lib/db/collections"
import { getFinancialScope, getScopeFilter } from "@/lib/scope"
import {
  applyTemplateInputSchema,
  saveCurrentBudgetsSchema,
  ApplyTemplateInput,
  SaveCurrentBudgetsInput,
} from "@/lib/validations/budget-template.schema"
import { SYSTEM_BUDGET_TEMPLATES } from "@/lib/budget-templates/system-templates"
import { Budget, Category, BudgetTemplate, Notification } from "@/types"
import { ObjectId } from "mongodb"
import { revalidatePath, updateTag } from "next/cache"
import { db } from "@/lib/db/client"
import { canManageBudgets, Role } from "@/lib/permissions"

export async function applyBudgetTemplateAction(input: ApplyTemplateInput) {
  await requireApprovedUser()
  const validated = applyTemplateInputSchema.parse(input)

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized to manage budgets" }
    }
  }

  const [templatesColl, budgetsColl, categoriesColl, notificationsColl] = await Promise.all([
    getCollection<BudgetTemplate>("budget_templates"),
    getCollection<Budget>("budgets"),
    getCollection<Category>("categories"),
    getCollection<Notification>("notifications"),
  ])

  // 1. Resolve template
  let template = SYSTEM_BUDGET_TEMPLATES.find((t) => t._id.toString() === validated.templateId)
  if (!template && ObjectId.isValid(validated.templateId)) {
    template = await templatesColl.findOne({
      _id: new ObjectId(validated.templateId),
      ...getScopeFilter(scope),
    }) || undefined
  }

  if (!template) {
    return { success: false, error: "Budget template not found" }
  }

  // 2. Resolve allocations (custom overrides take precedence if provided)
  const allocations = validated.customAllocations || template.allocations
  if (!allocations || allocations.length === 0) {
    return { success: false, error: "No allocations defined in template" }
  }

  // 3. Get existing categories
  const existingCategories = await categoriesColl
    .find({
      $or: [getScopeFilter(scope), { userId: null }],
    })
    .toArray()

  const categoryNameMap = new Map<string, Category>()
  for (const cat of existingCategories) {
    categoryNameMap.set(cat.name.toLowerCase().trim(), cat)
  }

  // 4. If strategy === "fresh_start", deactivate existing active budgets
  if (validated.strategy === "fresh_start") {
    await budgetsColl.updateMany(
      { ...getScopeFilter(scope), isActive: true },
      { $set: { isActive: false, updatedAt: new Date(), updatedBy: scope.userId } }
    )
  }

  // Start date = start of current month
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)

  let appliedCount = 0

  // 5. Apply each allocation
  for (const alloc of allocations) {
    const allocNameLower = alloc.categoryName.toLowerCase().trim()
    let categoryId = alloc.categoryId

    // Check custom mappings if provided
    if (validated.categoryMappings && validated.categoryMappings[alloc.categoryName]) {
      const mapping = validated.categoryMappings[alloc.categoryName]
      if (mapping.categoryId) {
        categoryId = mapping.categoryId
      }
    }

    // If no category ID assigned yet, find existing or create new
    if (!categoryId) {
      const match = categoryNameMap.get(allocNameLower)
      if (match) {
        categoryId = match._id.toString()
      } else {
        // Auto-create category
        const newCat: Omit<Category, "_id"> = {
          userId: scope.userId,
          organizationId: scope.organizationId,
          ownerUserId: scope.userId,
          createdBy: scope.userId,
          updatedBy: scope.userId,
          name: alloc.categoryName,
          type: ["expense"],
          icon: alloc.suggestedIcon || "Tag",
          color: alloc.suggestedColor || "#6366f1",
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        }
        const insertRes = await categoriesColl.insertOne(newCat as Category)
        categoryId = insertRes.insertedId.toString()
        categoryNameMap.set(allocNameLower, { ...newCat, _id: insertRes.insertedId } as Category)
      }
    }

    // Compute amount in smallest currency unit
    const budgetAmount = Math.max(1, Math.round(validated.totalMonthlyIncome * (alloc.percentage / 100)))

    // Check if an active budget already exists for this category
    const existingBudget = await budgetsColl.findOne({
      ...getScopeFilter(scope),
      categoryId,
      isActive: true,
    })

    if (existingBudget && validated.strategy === "smart_merge") {
      // Update existing budget
      await budgetsColl.updateOne(
        { _id: existingBudget._id },
        {
          $set: {
            name: `${alloc.categoryName} Budget`,
            amount: budgetAmount,
            currency: validated.currency,
            period: validated.period,
            alertThreshold: alloc.alertThreshold || 80,
            updatedAt: new Date(),
            updatedBy: scope.userId,
          },
          $inc: { version: 1 },
        }
      )
    } else {
      // Insert new budget
      const newBudget: Omit<Budget, "_id"> = {
        userId: scope.userId,
        organizationId: scope.organizationId,
        ownerUserId: scope.userId,
        createdBy: scope.userId,
        updatedBy: scope.userId,
        name: `${alloc.categoryName} Budget`,
        categoryId,
        amount: budgetAmount,
        currency: validated.currency,
        period: validated.period,
        startDate,
        alertThreshold: alloc.alertThreshold || 80,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }
      await budgetsColl.insertOne(newBudget as Budget)
    }

    appliedCount++
  }

  // 6. Create inbox notification
  try {
    const notification: Omit<Notification, "_id"> = {
      userId: scope.userId,
      type: "budget_alert",
      title: "Budget Template Applied",
      message: `Successfully applied "${template.name}" with ${appliedCount} category budgets.`,
      link: "/budgets",
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await notificationsColl.insertOne(notification as Notification)
  } catch (err) {
    console.error("Failed to generate template applied notification:", err)
  }

  // Revalidate tags and paths
  updateTag("budgets")
  updateTag("categories")
  revalidatePath("/budgets")
  revalidatePath("/", "layout")

  return { success: true, appliedCount }
}

export async function saveCurrentBudgetsAsTemplateAction(input: SaveCurrentBudgetsInput) {
  await requireApprovedUser()
  const validated = saveCurrentBudgetsSchema.parse(input)

  const scope = await getFinancialScope()
  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized to manage budgets" }
    }
  }

  const [budgetsColl, categoriesColl, templatesColl] = await Promise.all([
    getCollection<Budget>("budgets"),
    getCollection<Category>("categories"),
    getCollection<BudgetTemplate>("budget_templates"),
  ])

  // Get active budgets
  const activeBudgets = await budgetsColl.find({ ...getScopeFilter(scope), isActive: true }).toArray()
  if (activeBudgets.length === 0) {
    return { success: false, error: "You don't have any active budgets to save as a template." }
  }

  const categories = await categoriesColl
    .find({
      $or: [getScopeFilter(scope), { userId: null }],
    })
    .toArray()
  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]))

  const totalBudgeted = activeBudgets.reduce((sum, b) => sum + b.amount, 0)
  if (totalBudgeted <= 0) {
    return { success: false, error: "Total budgeted amount must be greater than zero." }
  }

  // Calculate percentage for each category
  const allocations = activeBudgets.map((b) => {
    const cat = categoryMap.get(b.categoryId)
    const pct = Math.max(1, Math.round((b.amount / totalBudgeted) * 100))
    return {
      categoryName: cat?.name || b.name,
      categoryId: b.categoryId,
      group: "Custom" as const,
      percentage: pct,
      suggestedColor: cat?.color || "#6366f1",
      suggestedIcon: cat?.icon || "PiggyBank",
      alertThreshold: b.alertThreshold || 80,
      description: `Saved from your "${b.name}" budget.`,
    }
  })

  // Normalize percentages so they sum to 100%
  const currentSum = allocations.reduce((sum, a) => sum + a.percentage, 0)
  if (currentSum !== 100 && allocations.length > 0) {
    allocations[0].percentage += 100 - currentSum
  }

  const customTemplate: Omit<BudgetTemplate, "_id"> = {
    userId: scope.userId,
    organizationId: scope.organizationId,
    ownerUserId: scope.userId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
    name: validated.name,
    tagline: validated.tagline || `Custom budget template with ${allocations.length} categories`,
    description: validated.description || `Custom template saved from active category budgets on ${new Date().toLocaleDateString()}.`,
    category: "custom",
    methodology: "percentage",
    icon: validated.icon,
    color: validated.color,
    tags: ["Custom", "My Template"],
    allocations,
    rulesSummary: ["Personalized custom allocation based on active monthly spending limits."],
    isSystem: false,
    period: "monthly",
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  }

  const result = await templatesColl.insertOne(customTemplate as BudgetTemplate)

  updateTag("budgets")
  revalidatePath("/budgets")
  revalidatePath("/", "layout")

  return { success: true, id: result.insertedId.toString() }
}

export async function deleteCustomTemplateAction(templateId: string) {
  await requireApprovedUser()
  const scope = await getFinancialScope()

  if (scope.isOrganization) {
    const member = await db.collection("member").findOne({
      userId: scope.userId,
      organizationId: scope.organizationId,
    })
    const role = (member?.role as Role) || "member"
    if (!canManageBudgets(role)) {
      return { success: false, error: "Unauthorized" }
    }
  }

  if (!ObjectId.isValid(templateId)) {
    return { success: false, error: "System templates cannot be deleted." }
  }

  const templatesColl = await getCollection<BudgetTemplate>("budget_templates")
  const existing = await templatesColl.findOne({
    _id: new ObjectId(templateId),
    ...getScopeFilter(scope),
  })

  if (!existing) {
    return { success: false, error: "Template not found or unauthorized." }
  }

  await templatesColl.deleteOne({
    _id: new ObjectId(templateId),
    ...getScopeFilter(scope),
  })

  updateTag("budgets")
  revalidatePath("/budgets")
  revalidatePath("/", "layout")

  return { success: true }
}
