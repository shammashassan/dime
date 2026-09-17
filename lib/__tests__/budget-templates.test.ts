import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { SYSTEM_BUDGET_TEMPLATES } from "../budget-templates"
import {
  applyTemplateInputSchema,
  saveCurrentBudgetsSchema,
  createCustomTemplateSchema,
} from "../validations/budget-template.schema"

describe("Budget Templates System Presets", () => {
  it("includes exactly 8 curated system presets", () => {
    assert.equal(SYSTEM_BUDGET_TEMPLATES.length, 8)
  })

  it("ensures every system template allocations sum to exactly 100%", () => {
    for (const template of SYSTEM_BUDGET_TEMPLATES) {
      const totalPercentage = template.allocations.reduce((sum, a) => sum + a.percentage, 0)
      assert.equal(
        totalPercentage,
        100,
        `Template "${template.name}" (${template._id}) does not sum to 100%, got ${totalPercentage}%`
      )
    }
  })

  it("ensures every system template has complete metadata and valid categories", () => {
    const validCategories = ["framework", "lifestyle", "goals", "custom"]

    for (const template of SYSTEM_BUDGET_TEMPLATES) {
      assert.ok(template._id, "Missing _id")
      assert.ok(template.name.length > 0, "Missing name")
      assert.ok(template.tagline.length > 0, "Missing tagline")
      assert.ok(template.description.length > 0, "Missing description")
      assert.ok(validCategories.includes(template.category), `Invalid category ${template.category}`)
      assert.ok(template.icon.length > 0, "Missing icon")
      assert.match(template.color, /^#[0-9A-F]{6}$/i, "Invalid hex color")
      assert.ok(template.allocations.length >= 3, "Must have at least 3 allocations")
      assert.ok(template.rulesSummary.length >= 2, "Must have at least 2 rule bullet points")
      assert.equal(template.isSystem, true)
      assert.equal(template.userId, null)
    }
  })

  it("ensures all allocations have valid group, colors, and non-empty names", () => {
    const validGroups = ["Needs", "Wants", "Savings", "Custom"]

    for (const template of SYSTEM_BUDGET_TEMPLATES) {
      for (const alloc of template.allocations) {
        assert.ok(alloc.categoryName.length > 0, "Category name is empty")
        assert.ok(validGroups.includes(alloc.group), `Invalid group: ${alloc.group}`)
        assert.ok(alloc.percentage > 0, "Percentage must be positive")
        assert.match(alloc.suggestedColor, /^#[0-9A-F]{6}$/i, "Invalid allocation color")
        assert.ok(alloc.suggestedIcon.length > 0, "Missing suggestedIcon")
        assert.ok(alloc.alertThreshold >= 50 && alloc.alertThreshold <= 100, "Alert threshold out of bounds")
      }
    }
  })
})

describe("Budget Template Validations", () => {
  it("validates valid applyTemplate input", () => {
    const valid = {
      templateId: "50-30-20",
      totalMonthlyIncome: 500000,
      currency: "USD",
      strategy: "smart_merge",
    }
    const parsed = applyTemplateInputSchema.parse(valid)
    assert.equal(parsed.templateId, "50-30-20")
    assert.equal(parsed.totalMonthlyIncome, 500000)
    assert.equal(parsed.currency, "USD")
    assert.equal(parsed.strategy, "smart_merge")
    assert.equal(parsed.period, "monthly")
  })

  it("rejects invalid income or currency in applyTemplateInputSchema", () => {
    assert.throws(() => {
      applyTemplateInputSchema.parse({
        templateId: "50-30-20",
        totalMonthlyIncome: -100,
        currency: "USD",
      })
    })

    assert.throws(() => {
      applyTemplateInputSchema.parse({
        templateId: "50-30-20",
        totalMonthlyIncome: 5000,
        currency: "TOOLONG",
      })
    })
  })

  it("validates saveCurrentBudgetsSchema", () => {
    const valid = {
      name: "Holiday Season Budget",
      tagline: "Extra gifts and travel",
      description: "Saved from active budgets in December",
      icon: "Gift",
      color: "#ec4899",
    }
    const parsed = saveCurrentBudgetsSchema.parse(valid)
    assert.equal(parsed.name, "Holiday Season Budget")
    assert.equal(parsed.icon, "Gift")
  })

  it("validates createCustomTemplateSchema with allocations", () => {
    const custom = {
      name: "My Custom Framework",
      tagline: "60/20/20 Custom Rule",
      description: "Tailored for my personal obligations",
      category: "custom" as const,
      methodology: "percentage" as const,
      icon: "Sparkles",
      color: "#6366f1",
      tags: ["Custom"],
      allocations: [
        {
          categoryName: "Essentials",
          group: "Needs" as const,
          percentage: 60,
          suggestedColor: "#6366f1",
          suggestedIcon: "Home",
          alertThreshold: 85,
        },
        {
          categoryName: "Fun",
          group: "Wants" as const,
          percentage: 20,
          suggestedColor: "#f59e0b",
          suggestedIcon: "Smile",
          alertThreshold: 80,
        },
        {
          categoryName: "Investing",
          group: "Savings" as const,
          percentage: 20,
          suggestedColor: "#10b981",
          suggestedIcon: "TrendingUp",
          alertThreshold: 100,
        },
      ],
      rulesSummary: ["Live on 60% essentials, 20% fun, 20% investments."],
    }

    const parsed = createCustomTemplateSchema.parse(custom)
    assert.equal(parsed.name, "My Custom Framework")
    assert.equal(parsed.allocations.length, 3)
  })
})

describe("Budget Allocation Currency Math", () => {
  it("accurately calculates category limits without fractional loss", () => {
    const totalCents = 450000 // $4,500.00
    const template = SYSTEM_BUDGET_TEMPLATES.find((t) => t._id === "50-30-20")!

    let totalAllocatedCents = 0
    for (const alloc of template.allocations) {
      const categoryLimit = Math.round(totalCents * (alloc.percentage / 100))
      totalAllocatedCents += categoryLimit
      assert.ok(categoryLimit > 0, `${alloc.categoryName} must have positive limit`)
    }

    // Because template allocations sum to 100%, total allocated cents equals input
    assert.equal(totalAllocatedCents, totalCents)
  })
})
