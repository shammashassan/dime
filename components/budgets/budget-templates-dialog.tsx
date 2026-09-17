"use client"

import React, { useState, useTransition } from "react"
import { BudgetTemplate, Category, Wallet, TemplateRecommendation } from "@/types"
import { saveCurrentBudgetsAsTemplateAction, deleteCustomTemplateAction } from "@/lib/actions/budget-templates"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { ApplyTemplateStep } from "./apply-template-step"
import { formatCurrency, cn } from "@/lib/utils"
import {
  LayoutTemplate,
  Sparkles,
  Scale,
  Target,
  Briefcase,
  TrendingDown,
  Users,
  GraduationCap,
  Compass,
  Minimize2,
  Search,
  ArrowRight,
  Trash2,
  BookmarkPlus,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BudgetTemplatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: BudgetTemplate[]
  recommendation: TemplateRecommendation
  categories: Category[]
  wallets: Wallet[]
  activeBudgetsCount: number
}

function TemplateIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "Scale":
      return <Scale className={className} />
    case "Target":
      return <Target className={className} />
    case "Briefcase":
      return <Briefcase className={className} />
    case "TrendingDown":
      return <TrendingDown className={className} />
    case "Users":
      return <Users className={className} />
    case "GraduationCap":
      return <GraduationCap className={className} />
    case "Compass":
      return <Compass className={className} />
    case "Minimize2":
      return <Minimize2 className={className} />
    default:
      return <Sparkles className={className} />
  }
}

export function BudgetTemplatesDialog({
  open,
  onOpenChange,
  templates,
  recommendation,
  categories,
  wallets,
  activeBudgetsCount,
}: BudgetTemplatesDialogProps) {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "framework" | "lifestyle" | "goals" | "custom">("all")
  const [search, setSearch] = useState("")
  const [isSavingCurrent, setIsSavingCurrent] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [isPending, startTransition] = useTransition()

  // Reset selected template when dialog opens/closes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedTemplate(null)
      setIsSavingCurrent(false)
      setSaveName("")
    }
    onOpenChange(nextOpen)
  }

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    if (activeTab === "framework" && t.category !== "framework") return false
    if (activeTab === "lifestyle" && t.category !== "lifestyle") return false
    if (activeTab === "goals" && t.category !== "goals") return false
    if (activeTab === "custom" && !t.userId) return false

    if (search.trim()) {
      const q = search.toLowerCase()
      const matchesName = t.name.toLowerCase().includes(q)
      const matchesTagline = t.tagline.toLowerCase().includes(q)
      const matchesTag = t.tags.some((tag) => tag.toLowerCase().includes(q))
      if (!matchesName && !matchesTagline && !matchesTag) return false
    }
    return true
  })

  const tabCounts = {
    all: templates.length,
    framework: templates.filter((t) => t.category === "framework").length,
    lifestyle: templates.filter((t) => t.category === "lifestyle").length,
    goals: templates.filter((t) => t.category === "goals").length,
    custom: templates.filter((t) => !t.isSystem).length,
  }

  // Handle Save Current Budget
  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!saveName.trim()) return

    const savePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await saveCurrentBudgetsAsTemplateAction({
            name: saveName.trim(),
            description: `Saved from active budgets with ${activeBudgetsCount} categories.`,
            icon: "PiggyBank",
            color: "#6366f1",
          })
          if (res && res.success) {
            setIsSavingCurrent(false)
            setSaveName("")
            router.refresh()
            resolve(res)
          } else {
            reject(new Error(res?.error || "Failed to save template"))
          }
        } catch (err) {
          reject(err)
        }
      })
    })

    toast.promise(savePromise, {
      loading: "Saving custom template...",
      success: `Saved "${saveName}" to My Templates!`,
      error: (err: unknown) => (err instanceof Error ? err.message : "Failed to save template"),
    })
  }

  // Handle Delete Custom Template
  const handleDeleteCustom = async (templateId: string, templateName: string) => {
    const deletePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const res = await deleteCustomTemplateAction(templateId)
          if (res && res.success) {
            router.refresh()
            resolve(res)
          } else {
            reject(new Error(res?.error || "Failed to delete template"))
          }
        } catch (err) {
          reject(err)
        }
      })
    })

    toast.promise(deletePromise, {
      loading: `Deleting "${templateName}"...`,
      success: "Custom template deleted",
      error: (err: unknown) => (err instanceof Error ? err.message : "Failed to delete template"),
    })
  }

  const recommendedTemplate = templates.find(
    (t) => t._id.toString() === recommendation.recommendedTemplateId
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[86vh] flex flex-col p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/50 shadow-2xl gap-0 overflow-hidden">
        <DialogHeader className="pb-3 sm:pb-4 border-b border-border/40 shrink-0 pr-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 sm:size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <LayoutTemplate className="size-4 sm:size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-extrabold tracking-tight truncate">
                Budget Templates
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-1">
                Apply a proven budgeting methodology or save your own setup as a reusable template.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable Content Area (Matches shadcn official dialog-scrollable-content pattern) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 sm:pt-4">
          {/* ── Wizard View if Template Selected ── */}
          {selectedTemplate ? (
            <div className="pt-1">
              <ApplyTemplateStep
                template={selectedTemplate}
                categories={categories}
                wallets={wallets}
                initialMonthlyAmount={recommendation.suggestedMonthlyAmount}
                primaryCurrency={recommendation.currency}
                onBack={() => setSelectedTemplate(null)}
                onSuccess={() => handleOpenChange(false)}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:gap-5 pt-1">
              {/* ── Smart Recommendation Banner ── */}
              {recommendedTemplate && (
                <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 shadow-xs">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="size-8 sm:size-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="size-3.5 sm:size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                          Recommended For You
                        </span>
                        <span className="text-xs font-black text-foreground truncate">
                          {recommendedTemplate.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">
                        {recommendation.rationale} Suggested sizing:{" "}
                        <span className="font-bold text-foreground tabular-nums whitespace-nowrap">
                          {formatCurrency(
                            recommendation.suggestedMonthlyAmount,
                            recommendation.currency
                          )}
                          /mo
                        </span>
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setSelectedTemplate(recommendedTemplate)}
                    className="rounded-xl font-bold text-xs gap-1.5 w-full sm:w-auto shrink-0 shadow-xs active:scale-95 transition-transform"
                  >
                    Quick Apply <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              )}

              {/* ── Filter Bar & Search ── */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide p-1 bg-muted/60 rounded-xl min-w-0 max-w-full">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={cn(
                      "px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                      activeTab === "all"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All ({tabCounts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("framework")}
                    className={cn(
                      "px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                      activeTab === "framework"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Frameworks ({tabCounts.framework})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("lifestyle")}
                    className={cn(
                      "px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                      activeTab === "lifestyle"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Lifestyles ({tabCounts.lifestyle})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("goals")}
                    className={cn(
                      "px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                      activeTab === "goals"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Debt & Goals ({tabCounts.goals})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("custom")}
                    className={cn(
                      "px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                      activeTab === "custom"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    My Templates ({tabCounts.custom})
                  </button>
                </div>

                <div className="flex items-center gap-2 min-w-0 shrink-0">
                  <InputGroup className="w-full sm:w-52">
                    <InputGroupAddon align="inline-start">
                      <Search className="size-3 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Search templates..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </InputGroup>
                </div>
              </div>

              {/* ── Save Current Active Budget as Template Sub-Card ── */}
              {activeBudgetsCount > 0 && !isSavingCurrent && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-dashed border-border/60 bg-muted/20 gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookmarkPlus className="size-4 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Have a budget you love? Save your current {activeBudgetsCount} active budgets as a custom template.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSavingCurrent(true)}
                    className="rounded-xl font-bold text-xs h-8 w-full sm:w-auto shrink-0"
                  >
                    Save as Template
                  </Button>
                </div>
              )}

              {isSavingCurrent && (
                <form
                  onSubmit={handleSaveCurrent}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5"
                >
                  <InputGroup className="flex-1 min-w-0">
                    <InputGroupInput
                      placeholder="Template Name (e.g. My Holiday Season Budget)"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="rounded-xl text-xs font-medium"
                      autoFocus
                    />
                  </InputGroup>
                  <div className="flex items-center gap-2 shrink-0 justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isPending || !saveName.trim()}
                      className="rounded-xl font-bold text-xs gap-1.5 h-9"
                    >
                      {isPending && <Loader2 className="size-3 animate-spin" />} Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSavingCurrent(false)}
                      className="rounded-xl text-xs h-9"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* ── Template Cards Grid ── */}
              {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
                  {filteredTemplates.map((template) => {
                    const needsPct = template.allocations
                      .filter((a) => a.group === "Needs")
                      .reduce((sum, a) => sum + a.percentage, 0)
                    const wantsPct = template.allocations
                      .filter((a) => a.group === "Wants")
                      .reduce((sum, a) => sum + a.percentage, 0)
                    const savingsPct = template.allocations
                      .filter((a) => a.group === "Savings" || a.group === "Custom")
                      .reduce((sum, a) => sum + a.percentage, 0)

                    return (
                      <Card
                        key={template._id.toString()}
                        className="group relative py-0 gap-0 overflow-hidden rounded-2xl border border-border/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-w-0 w-full"
                      >
                        {/* Top Accent Strip */}
                        <div
                          className="h-[3px] w-full shrink-0"
                          style={{ backgroundColor: template.color }}
                        />

                        <CardHeader className="p-3.5 sm:p-4 pb-2">
                          <div className="flex items-start justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className="size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                                style={{
                                  backgroundColor: template.color + "18",
                                  color: template.color,
                                }}
                              >
                                <TemplateIcon name={template.icon} className="size-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-foreground truncate">
                                  {template.name}
                                </h3>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {template.tagline}
                                </p>
                              </div>
                            </div>

                            {!template.isSystem && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteCustom(
                                    template._id.toString(),
                                    template.name
                                  )
                                }
                                className="size-7 rounded-lg text-rose-500 hover:bg-rose-500/10 shrink-0"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="p-3.5 sm:p-4 pt-1 pb-3 flex flex-col gap-3 min-w-0">
                          <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed break-words">
                            {template.description}
                          </p>

                          {/* Visual Allocation Stacked Bar */}
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="h-2 w-full rounded-full overflow-hidden flex bg-muted/60">
                              {needsPct > 0 && (
                                <div
                                  style={{ width: `${needsPct}%` }}
                                  className="h-full bg-blue-500 transition-all duration-300"
                                  title={`Needs: ${needsPct}%`}
                                />
                              )}
                              {wantsPct > 0 && (
                                <div
                                  style={{ width: `${wantsPct}%` }}
                                  className="h-full bg-amber-500 transition-all duration-300"
                                  title={`Wants: ${wantsPct}%`}
                                />
                              )}
                              {savingsPct > 0 && (
                                <div
                                  style={{ width: `${savingsPct}%` }}
                                  className="h-full bg-emerald-500 transition-all duration-300"
                                  title={`Savings/Debt: ${savingsPct}%`}
                                />
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/80 flex-wrap gap-x-2 gap-y-0.5">
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <span className="size-1.5 rounded-full bg-blue-500" />
                                Needs {needsPct}%
                              </span>
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                Wants {wantsPct}%
                              </span>
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Savings {savingsPct}%
                              </span>
                            </div>
                          </div>

                          {/* Category Allocation Pills */}
                          <div className="flex flex-wrap gap-1 mt-0.5 min-w-0">
                            {template.allocations.slice(0, 5).map((alloc) => (
                              <Badge
                                key={alloc.categoryName}
                                variant="outline"
                                className="rounded-full px-2 py-0 text-[9px] font-semibold border-border/50 text-foreground/80 gap-1 h-4.5 max-w-full"
                              >
                                <span
                                  className="size-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: alloc.suggestedColor }}
                                />
                                <span className="truncate max-w-[100px] sm:max-w-[130px]">
                                  {alloc.categoryName}
                                </span>
                                <span className="text-muted-foreground font-normal shrink-0">
                                  {alloc.percentage}%
                                </span>
                              </Badge>
                            ))}
                            {template.allocations.length > 5 && (
                              <Badge
                                variant="secondary"
                                className="rounded-full px-1.5 py-0 text-[9px] font-semibold text-muted-foreground h-4.5 shrink-0"
                              >
                                +{template.allocations.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>

                        <CardFooter className="p-3.5 sm:p-4 pt-2 border-t border-border/30 bg-muted/10 flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap min-w-0 flex-1">
                            {template.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md truncate max-w-[90px]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <Button
                            size="sm"
                            onClick={() => setSelectedTemplate(template)}
                            className="rounded-xl font-bold text-xs gap-1.5 h-8 shrink-0 shadow-xs active:scale-95 transition-transform"
                          >
                            Use Template <ArrowRight className="size-3" />
                          </Button>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/10">
                  <LayoutTemplate className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-foreground">No templates found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Try adjusting your search query or select another filter tab.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
