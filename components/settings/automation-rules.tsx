"use client"

import React, { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import {
  Zap, Plus, Trash2, Play, Check, AlertCircle, ArrowRight,
  HelpCircle, Edit2, Loader2, Sparkles, CheckSquare, X, Edit, Eye
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel, FieldGroup, FieldDescription } from "@/components/ui/field"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AUTOMATION_TEMPLATES } from "@/lib/automation-templates"
import { cn } from "@/lib/utils"
import {
  createAutomationRuleAction,
  updateAutomationRuleAction,
  deleteAutomationRuleAction,
  toggleAutomationRuleAction,
  installTemplateAction,
  previewRetroactiveRulesAction,
  startRetroactiveJobAction,
  getJobStatusAction,
  getAutomationRulesAction
} from "@/lib/actions/automation-rules"
import { AutomationRule, Wallet, Category, Budget, RuleTrigger, ConditionField, ConditionOperator, RuleAction } from "@/types"

interface AutomationRulesSettingsProps {
  userId: string
  wallets: Wallet[]
  categories: Category[]
  budgets: Budget[]
}

export function AutomationRulesSettings({ userId, wallets, categories, budgets }: AutomationRulesSettingsProps) {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [isLoadingRules, setIsLoadingRules] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Dialog controls
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)

  // Rule Form State
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState(0)
  const [stopProcessing, setStopProcessing] = useState(false)
  const [triggers, setTriggers] = useState<RuleTrigger[]>(["manual", "receipt", "csv_import"])
  const [conditionOperator, setConditionOperator] = useState<"and" | "or">("and")
  const [conditions, setConditions] = useState<{ field: ConditionField; operator: ConditionOperator; value: any }[]>([
    { field: "description", operator: "contains", value: "" }
  ])
  const [actions, setActions] = useState<RuleAction[]>([
    { type: "assign_category", categoryId: categories[0]?._id.toString() || "" }
  ])

  // Dry-run preview controls
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewMatches, setPreviewMatches] = useState<any[]>([])
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewRuleData, setPreviewRuleData] = useState<any>(null)

  // Background Job controls
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<any>(null)
  const [isJobProgressModalOpen, setIsJobProgressModalOpen] = useState(false)

  // Map category ID to Name
  const categoryMap = React.useMemo(() => {
    return new Map(categories.map(c => [c._id.toString(), c.name]))
  }, [categories])

  // Map wallet ID to Name
  const walletMap = React.useMemo(() => {
    return new Map(wallets.map(w => [w._id.toString(), w.name]))
  }, [wallets])

  // Map budget ID to Name
  const budgetMap = React.useMemo(() => {
    return new Map(budgets.map(b => [b._id.toString(), b.name]))
  }, [budgets])

  // Load rules on mount
  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    setIsLoadingRules(true)
    try {
      const res = await getAutomationRulesAction()
      if (res.success) {
        setRules(res.rules as any || [])
      } else {
        toast.error("Failed to load automation rules.")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred loading rules.")
    } finally {
      setIsLoadingRules(false)
    }
  }

  // Job polling
  useEffect(() => {
    if (!activeJobId) return

    const interval = setInterval(async () => {
      try {
        const res = await getJobStatusAction(activeJobId)
        if (res.success) {
          setJobStatus(res)
          if (res.status === "completed") {
            toast.success("Retroactive application job completed successfully!")
            clearInterval(interval)
            setActiveJobId(null)
            loadRules() // Reload counts
          } else if (res.status === "failed") {
            toast.error(`Retroactive job failed: ${res.error}`)
            clearInterval(interval)
            setActiveJobId(null)
          }
        }
      } catch (err) {
        console.error(err)
        clearInterval(interval)
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [activeJobId])

  // Reset form
  const resetForm = () => {
    setEditingRule(null)
    setName("")
    setDescription("")
    setPriority(0)
    setStopProcessing(false)
    setTriggers(["manual", "receipt", "csv_import"])
    setConditionOperator("and")
    setConditions([{ field: "description", operator: "contains", value: "" }])
    setActions([{ type: "assign_category", categoryId: categories[0]?._id.toString() || "" }])
  }

  const handleOpenCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (rule: AutomationRule) => {
    setEditingRule(rule)
    setName(rule.name)
    setDescription(rule.description || "")
    setPriority(rule.priority || 0)
    setStopProcessing(rule.stopProcessing || false)
    setTriggers(rule.triggers)
    setConditionOperator(rule.conditionOperator)
    setConditions(rule.conditions.map(c => ({
      field: c.field,
      operator: c.operator,
      value: c.field === "amount" ? Number(c.value) / 100 : c.value // UI shows decimal amounts
    })))
    setActions(rule.actions)
    setIsDialogOpen(true)
  }

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (conditions.length === 0 || actions.length === 0) {
      toast.error("Rules must contain at least one condition and one action.")
      return
    }

    // Convert decimal amounts back to paise/cents before saving
    const formattedConditions = conditions.map(c => ({
      field: c.field,
      operator: c.operator,
      value: c.field === "amount" ? Math.round(Number(c.value) * 100) : c.value
    }))

    const ruleData = {
      name,
      description,
      priority,
      stopProcessing,
      triggers,
      conditionOperator,
      conditions: formattedConditions,
      actions,
      status: editingRule ? editingRule.status : "active"
    }

    startTransition(async () => {
      try {
        let res
        if (editingRule) {
          res = await updateAutomationRuleAction(editingRule._id.toString(), ruleData)
        } else {
          res = await createAutomationRuleAction(ruleData)
        }

        if (res.success) {
          toast.success(editingRule ? "Rule updated successfully!" : "Rule created successfully!")
          setIsDialogOpen(false)
          resetForm()
          loadRules()
        } else {
          toast.error("Failed to save rule.")
        }
      } catch (err: any) {
        console.error(err)
        toast.error(err.message || "An error occurred.")
      }
    })
  }

  const handleExecuteDeleteRule = async () => {
    if (!deletingRuleId) return
    try {
      const res = await deleteAutomationRuleAction(deletingRuleId)
      if (res.success) {
        toast.success("Rule deleted successfully.")
        loadRules()
      } else {
        toast.error("Failed to delete rule.")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred.")
    } finally {
      setDeletingRuleId(null)
    }
  }

  const handleToggleRule = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active"
    try {
      const res = await toggleAutomationRuleAction(id, newStatus)
      if (res.success) {
        toast.success(`Rule ${newStatus === "active" ? "enabled" : "disabled"} successfully.`)
        loadRules()
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to toggle rule status.")
    }
  }

  const handleInstallTemplate = async (key: string) => {
    try {
      const res = await installTemplateAction(key)
      if (res.success) {
        toast.success("Rule template installed successfully!")
        loadRules()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to install template.")
    }
  }

  // Previews retroactive matching
  const handlePreviewRetroactive = async (ruleId: string | null) => {
    setIsPreviewLoading(true)
    setPreviewMatches([])
    setPreviewRuleData(null)
    setIsPreviewOpen(true)

    try {
      let res
      if (ruleId) {
        res = await previewRetroactiveRulesAction(ruleId)
      } else {
        // Previewing the form rules
        const formattedConditions = conditions.map(c => ({
          field: c.field,
          operator: c.operator,
          value: c.field === "amount" ? Math.round(Number(c.value) * 100) : c.value
        }))
        const tempConfig = {
          name: name || "Unsaved Rule",
          priority,
          stopProcessing,
          triggers,
          conditionOperator,
          conditions: formattedConditions,
          actions
        }
        setPreviewRuleData(tempConfig)
        res = await previewRetroactiveRulesAction(null, tempConfig)
      }

      if (res.success) {
        setPreviewMatches(res.matches || [])
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load dry-run preview.")
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleRunRetroactive = async (ruleId: string) => {
    try {
      const res = await startRetroactiveJobAction(ruleId)
      if (res.success) {
        setActiveJobId(res.jobId)
        setJobStatus({ status: "pending", total: 0, processed: 0, matched: 0 })
        setIsJobProgressModalOpen(true)
        setIsPreviewOpen(false)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to start retroactive job.")
    }
  }

  // Condition builder helpers
  const handleAddCondition = () => {
    setConditions([...conditions, { field: "description", operator: "contains", value: "" }])
  }

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, idx) => idx !== index))
  }

  const handleConditionFieldChange = (index: number, val: ConditionField) => {
    const defaultOps: Record<ConditionField, ConditionOperator> = {
      description: "contains",
      amount: "gt",
      walletId: "equals",
      walletType: "equals",
      currency: "equals",
      tags: "contains_tag"
    }

    const updated = [...conditions]
    updated[index].field = val
    updated[index].operator = defaultOps[val]
    updated[index].value = val === "amount" ? 0 : ""
    setConditions(updated)
  }

  const handleConditionOperatorChange = (index: number, val: ConditionOperator) => {
    const updated = [...conditions]
    updated[index].operator = val
    setConditions(updated)
  }

  const handleConditionValueChange = (index: number, val: any) => {
    const updated = [...conditions]
    updated[index].value = val
    setConditions(updated)
  }

  // Actions builder helpers
  const handleAddAction = () => {
    setActions([...actions, { type: "assign_category", categoryId: categories[0]?._id.toString() || "" }])
  }

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, idx) => idx !== index))
  }

  const handleActionTypeChange = (index: number, val: any) => {
    const updated = [...actions]
    let newAction: RuleAction

    if (val === "assign_category") {
      newAction = { type: "assign_category", categoryId: categories[0]?._id.toString() || "" }
    } else if (val === "assign_tags") {
      newAction = { type: "assign_tags", tags: [] }
    } else if (val === "assign_budget") {
      newAction = { type: "assign_budget", budgetId: budgets[0]?._id.toString() || "" }
    } else if (val === "set_notes") {
      newAction = { type: "set_notes", notes: "" }
    } else if (val === "mark_recurring") {
      newAction = { type: "mark_recurring", isRecurring: true }
    } else if (val === "flag_transaction") {
      newAction = { type: "flag_transaction", isFlagged: true, needsReview: true }
    } else if (val === "auto_split") {
      newAction = { type: "auto_split", splits: [{ categoryId: categories[0]?._id.toString() || "", amount: 0 }] }
    } else {
      newAction = { type: "move_to_wallet", walletId: wallets[0]?._id.toString() || "" }
    }

    updated[index] = newAction
    setActions(updated)
  }

  const handleActionValueChange = (index: number, key: string, val: any) => {
    const updated = [...actions]
    const action = { ...updated[index] } as any
    action[key] = val
    updated[index] = action as RuleAction
    setActions(updated)
  }

  const toggleTrigger = (trig: RuleTrigger) => {
    if (triggers.includes(trig)) {
      if (triggers.length > 1) {
        setTriggers(triggers.filter(t => t !== trig))
      } else {
        toast.warning("At least one trigger context is required.")
      }
    } else {
      setTriggers([...triggers, trig])
    }
  }

  // Human-readable rule details
  const renderRuleConditionSummary = (conds: any[], op: "and" | "or") => {
    const separator = op === "and" ? " AND " : " OR "
    return conds.map((c, idx) => {
      let fieldLabel = c.field === "description" ? "Merchant" : c.field
      let val = c.value

      if (c.field === "walletId") {
        val = walletMap.get(c.value) || c.value
      } else if (c.field === "amount") {
        val = `${(Number(c.value) / 100).toFixed(2)}`
      }

      return `${fieldLabel} ${c.operator.replace("_", " ")} "${val}"`
    }).join(separator)
  }

  const renderRuleActionSummary = (acts: RuleAction[]) => {
    return acts.map((action, idx) => {
      switch (action.type) {
        case "assign_category":
          return `Category = ${categoryMap.get(action.categoryId) || "Unknown"}`
        case "assign_tags":
          return `Tags = [${action.tags.join(", ")}]`
        case "assign_budget":
          return `Budget = ${budgetMap.get(action.budgetId) || "Unknown"}`
        case "set_notes":
          return `Notes = "${action.notes}"`
        case "mark_recurring":
          return `Mark Recurring = ${action.isRecurring ? "Yes" : "No"}`
        case "flag_transaction":
          return `Flagged: ${action.isFlagged ? "Yes" : "No"}, Review: ${action.needsReview ? "Yes" : "No"}`
        case "auto_split":
          return `Auto Split into ${action.splits.length} categories`
        case "move_to_wallet":
          return `Wallet = ${walletMap.get(action.walletId) || "Unknown"}`
      }
    }).join(", ")
  }

  // Get accent color for a rule
  const getRuleThemeColor = (rule: AutomationRule) => {
    const catAction = rule.actions.find(a => a.type === "assign_category")
    if (catAction && catAction.type === "assign_category") {
      const catColor = categories.find(c => c._id.toString() === catAction.categoryId)?.color
      if (catColor) return catColor
    }
    const walletAction = rule.actions.find(a => a.type === "move_to_wallet")
    if (walletAction && walletAction.type === "move_to_wallet") {
      const walColor = wallets.find(w => w._id.toString() === walletAction.walletId)?.color
      if (walColor) return walColor
    }
    return "var(--primary)"
  }

  return (
    <TooltipProvider>
      <Card className="border border-border/40 bg-card shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 pb-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="size-5 text-primary fill-primary/10" />
              Automation Rules
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5 font-medium">
              Configure triggers, conditions, and actions to automatically categorize, route, and flag transactions.
            </CardDescription>
          </div>
          <Button onClick={handleOpenCreateDialog} size="sm" className="shadow-md bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold">
            <Plus className="size-4 mr-1" />
            Create Rule
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* 1. Live Job Progress Overlay */}
          {isJobProgressModalOpen && jobStatus && (
            <Alert className="border border-primary/20 bg-primary/5 shadow-md rounded-2xl p-5 mb-4 animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3 w-full">
                {jobStatus.status === "completed" ? (
                  <Check className="size-5 text-emerald-500 shrink-0 mt-0.5 font-bold" />
                ) : jobStatus.status === "failed" ? (
                  <AlertCircle className="size-5 text-rose-500 shrink-0 mt-0.5" />
                ) : (
                  <Loader2 className="size-5 text-primary animate-spin shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <AlertTitle className="flex justify-between items-center text-sm font-bold leading-none mb-1">
                    <span>Retroactive Application Status: {jobStatus.status.toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {jobStatus.processed} / {jobStatus.total} ({jobStatus.total > 0 ? Math.round((jobStatus.processed / jobStatus.total) * 100) : 0}%)
                    </span>
                  </AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <Progress 
                      value={jobStatus.total > 0 ? (jobStatus.processed / jobStatus.total) * 100 : 0} 
                      className="h-2 bg-muted/60"
                    />
                    <p className="text-xs text-muted-foreground font-semibold leading-normal">
                      {jobStatus.status === "completed" 
                        ? `Successfully scanned all ${jobStatus.processed} transactions and updated ${jobStatus.matched} matches!`
                        : jobStatus.status === "failed"
                        ? `Failed to apply rules: ${jobStatus.error}`
                        : `Matched & updated ${jobStatus.matched} transactions so far. Please keep the window open.`
                      }
                    </p>
                  </AlertDescription>
                </div>
                {(jobStatus.status === "completed" || jobStatus.status === "failed") && (
                  <Button size="sm" variant="ghost" className="rounded-xl size-8 p-0 shrink-0 -mt-1 -mr-1" onClick={() => setIsJobProgressModalOpen(false)}>
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </Alert>
          )}

          {/* 2. Empty State with Templates */}
          {rules.length === 0 && !isLoadingRules ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border/60 bg-card/50 rounded-2xl text-center">
                <Zap className="size-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-bold text-base">No Automation Rules Configured</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1 font-semibold">
                  Rules execute automatically on manual inputs, receipt scans, recurring payments, and CSV imports.
                </p>
                <Button size="sm" variant="outline" className="mt-4 rounded-xl shadow-sm font-bold" onClick={handleOpenCreateDialog}>
                  <Plus className="size-4 mr-1" />
                  Build a Custom Rule
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5 mb-3">
                  <Sparkles className="size-4 text-primary fill-primary/10" />
                  Install Common Presets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AUTOMATION_TEMPLATES.map(template => (
                    <Card key={template.key} className="border border-border/40 bg-card hover:border-border/80 transition-all rounded-2xl shadow-sm flex flex-col justify-between">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-sm font-bold leading-tight">{template.name}</CardTitle>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0">
                            Priority {template.priority}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-1 leading-normal font-semibold">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 pt-2 border-t border-border/20 mt-3 flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground flex gap-1 font-semibold">
                          Triggers: {template.triggers.slice(0, 2).join(", ")}
                        </span>
                        <Button size="xs" className="rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold" onClick={() => handleInstallTemplate(template.key)}>
                          Install Preset
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* 3. Active Rules Grid (Redesigned matching budgets/wallets layouts) */}
          {rules.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <CheckSquare className="size-4 text-primary" />
                  Active Automations ({rules.length})
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">Executed in descending priority order</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.map(rule => {
                  const ruleColor = getRuleThemeColor(rule)
                  const isThemeColor = ruleColor === "var(--primary)"

                  return (
                    <div
                      key={rule._id.toString()}
                      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[220px]"
                    >
                      {/* Top Accent Line */}
                      <div
                        className={cn("h-[3.5px] w-full shrink-0", isThemeColor && "bg-primary")}
                        style={!isThemeColor ? { backgroundColor: ruleColor } : undefined}
                      />

                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={cn(
                              "size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
                              isThemeColor && "bg-primary/10 text-primary"
                            )}
                            style={!isThemeColor ? { backgroundColor: ruleColor + "18", color: ruleColor } : undefined}
                          >
                            <Zap className="size-4.5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                              {rule.name}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4">
                                Priority {rule.priority}
                              </Badge>
                              <Badge
                                variant={rule.status === "active" ? "default" : "secondary"}
                                className={cn(
                                  "rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider h-4",
                                  rule.status === "active" && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/10 dark:text-emerald-400"
                                )}
                              >
                                {rule.status}
                              </Badge>
                              {rule.stopProcessing && (
                                <Badge variant="destructive" className="rounded-full px-2 py-0 text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10 h-4">
                                  Terminating
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Inline actions - fade in on hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pt-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg hover:bg-muted/70"
                                onClick={() => handleOpenEditDialog(rule)}
                              >
                                <Edit className="size-3.5 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="rounded-xl font-semibold">
                              Edit automation
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                                onClick={() => setDeletingRuleId(rule._id.toString())}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="rounded-xl font-semibold">
                              Delete rule
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Description if present */}
                      {rule.description && (
                        <p className="px-4 pb-2 text-[11px] text-muted-foreground font-semibold line-clamp-2">
                          {rule.description}
                        </p>
                      )}

                      {/* Redesigned Card Body (Rule matching pipeline) */}
                      <div className="px-4 pb-3 flex-1 flex flex-col gap-3 justify-center">
                        {/* Conditions */}
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Conditions (IF)</p>
                          <div className="flex flex-wrap gap-1">
                            {rule.conditions.map((c, idx) => {
                              let fieldLabel = c.field === "description" ? "Merchant" : c.field
                              let val = c.value
                              if (c.field === "walletId") {
                                val = walletMap.get(String(c.value)) || c.value
                              } else if (c.field === "amount") {
                                val = `${(Number(c.value) / 100).toFixed(2)}`
                              }
                              return (
                                <Badge key={idx} variant="outline" className="text-[10px] py-0 px-2.5 rounded-lg bg-muted/30 font-semibold border-border/40 text-foreground">
                                  <span className="text-primary font-bold mr-1">{fieldLabel}</span>
                                  {c.operator.replace("_", " ")}
                                  <span className="ml-1 text-foreground font-bold">"{val}"</span>
                                </Badge>
                              )
                            })}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Actions (THEN)</p>
                          <div className="space-y-0.5">
                            {rule.actions.map((action, idx) => {
                              let text = ""
                              switch (action.type) {
                                case "assign_category":
                                  text = `Set Category to ${categoryMap.get(action.categoryId) || "Unknown"}`
                                  break
                                case "assign_tags":
                                  text = `Tag as [${action.tags.join(", ")}]`
                                  break
                                case "assign_budget":
                                  text = `Assign to Budget ${budgetMap.get(action.budgetId) || "Unknown"}`
                                  break
                                case "set_notes":
                                  text = `Set Notes: "${action.notes}"`
                                  break
                                case "mark_recurring":
                                  text = `Mark Recurring: ${action.isRecurring ? "Yes" : "No"}`
                                  break
                                case "flag_transaction":
                                  text = `Flag: ${action.isFlagged ? "Yes" : "No"}, Review: ${action.needsReview ? "Yes" : "No"}`
                                  break
                                case "move_to_wallet":
                                  text = `Route to ${walletMap.get(action.walletId) || "Unknown"}`
                                  break
                              }
                              return (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                                  <ArrowRight className="size-3 text-emerald-500 shrink-0" />
                                  <span>{text}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-border/20 px-4 py-2.5 flex items-center justify-between bg-muted/10 mt-auto shrink-0">
                        <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-2">
                          <span>Matches: <strong className="text-foreground">{rule.executionCount || 0}</strong></span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-6 py-0 px-2 rounded-md text-[10px] text-primary font-bold hover:bg-primary/5 hover:text-primary gap-1"
                            onClick={() => handlePreviewRetroactive(rule._id.toString())}
                          >
                            <Play className="size-2.5" /> Retroactive
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="h-6 py-0 px-2 rounded-md text-[10px] font-semibold"
                            onClick={() => handleToggleRule(rule._id.toString(), rule.status)}
                          >
                            {rule.status === "active" ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quick presets footer */}
              <div className="pt-4 border-t border-border/40">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Rule Presets</h4>
                <div className="flex flex-wrap gap-2">
                  {AUTOMATION_TEMPLATES.map(t => (
                    <Button key={t.key} size="xs" variant="outline" className="rounded-lg shadow-sm border-border/50 text-[10px] hover:bg-muted" onClick={() => handleInstallTemplate(t.key)}>
                      + Preset: {t.name.split(" ")[0]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>

        {/* 4. Create / Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit Automation Rule" : "Create Automation Rule"}</DialogTitle>
              <DialogDescription>
                Define conditions that, when met, execute deterministic updates on transaction records.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveRule} className="space-y-5">
              <FieldGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="rule-name">Rule Name</FieldLabel>
                    <Input
                      id="rule-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Starbucks Route"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="rule-priority">Priority</FieldLabel>
                    <Input
                      id="rule-priority"
                      type="number"
                      min={0}
                      max={1000}
                      value={priority}
                      onChange={e => setPriority(Number(e.target.value))}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="rule-desc">Description</FieldLabel>
                  <Input
                    id="rule-desc"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </Field>

                <Field>
                  <FieldLabel>Triggers (contexts this rule applies to)</FieldLabel>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {(["manual", "receipt", "csv_import", "recurring"] as RuleTrigger[]).map(t => (
                      <div key={t} className="flex items-center gap-2 bg-muted/40 border border-border/20 px-3 py-1.5 rounded-xl hover:bg-muted transition-colors">
                        <Checkbox
                          id={`trigger-${t}`}
                          checked={triggers.includes(t)}
                          onCheckedChange={() => toggleTrigger(t)}
                        />
                        <label htmlFor={`trigger-${t}`} className="text-xs font-semibold capitalize cursor-pointer select-none">
                          {t.replace("_", " ")}
                        </label>
                      </div>
                    ))}
                  </div>
                </Field>

                <div className="flex items-center gap-2 mt-2 bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl">
                  <Checkbox
                    id="rule-stop"
                    checked={stopProcessing}
                    onCheckedChange={(checked) => setStopProcessing(!!checked)}
                  />
                  <div className="grid gap-0.5">
                    <label htmlFor="rule-stop" className="text-xs font-bold leading-none cursor-pointer">
                      Stop executing subsequent rules on match
                    </label>
                    <span className="text-[10px] text-muted-foreground leading-normal">
                      Check this if you want this rule to be terminal. Rules of lower priority will be skipped.
                    </span>
                  </div>
                </div>
              </FieldGroup>

              <div className="border-t border-border/30 pt-4 space-y-4">
                {/* CONDITIONS BUILDER */}
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Conditions (IF)</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">Operator:</span>
                    <Select value={conditionOperator} onValueChange={(val: any) => setConditionOperator(val)}>
                      <SelectTrigger className="h-7 w-20 text-[10px] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="and">AND</SelectItem>
                        <SelectItem value="or">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  {conditions.map((cond, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 border border-border/20 bg-muted/10 p-3 rounded-2xl relative group">
                      {/* Field Select */}
                      <div className="w-32 shrink-0">
                        <Select value={cond.field} onValueChange={(val) => handleConditionFieldChange(idx, val as ConditionField)}>
                          <SelectTrigger className="h-8 text-xs rounded-xl">
                            <SelectValue placeholder="Field" />
                          </SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="description">Merchant</SelectItem>
                            <SelectItem value="amount">Amount</SelectItem>
                            <SelectItem value="walletId">Wallet</SelectItem>
                            <SelectItem value="walletType">Wallet Type</SelectItem>
                            <SelectItem value="currency">Currency</SelectItem>
                            <SelectItem value="tags">Tags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Operator Select */}
                      <div className="w-36 shrink-0">
                        <Select value={cond.operator} onValueChange={(val) => handleConditionOperatorChange(idx, val as ConditionOperator)}>
                          <SelectTrigger className="h-8 text-xs rounded-xl">
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {cond.field === "amount" ? (
                              <>
                                <SelectItem value="gt">&gt; (Greater than)</SelectItem>
                                <SelectItem value="lt">&lt; (Less than)</SelectItem>
                                <SelectItem value="eq">== (Equals)</SelectItem>
                                <SelectItem value="gte">&gt;=</SelectItem>
                                <SelectItem value="lte">&lt;=</SelectItem>
                              </>
                            ) : cond.field === "tags" ? (
                              <SelectItem value="contains_tag">Has tag</SelectItem>
                            ) : (
                              <>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="starts_with">Starts with</SelectItem>
                                <SelectItem value="ends_with">Ends with</SelectItem>
                                <SelectItem value="regex">Regex</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value Input */}
                      <div className="flex-1 min-w-[150px]">
                        {cond.field === "walletId" ? (
                          <Select value={cond.value} onValueChange={(val) => handleConditionValueChange(idx, val)}>
                            <SelectTrigger className="h-8 text-xs rounded-xl">
                              <SelectValue placeholder="Select wallet" />
                            </SelectTrigger>
                            <SelectContent>
                              {wallets.map(w => (
                                <SelectItem key={w._id.toString()} value={w._id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full" style={{ backgroundColor: w.color }} />
                                    <span>{w.name} ({w.currency})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : cond.field === "walletType" ? (
                          <Select value={cond.value} onValueChange={(val) => handleConditionValueChange(idx, val)}>
                            <SelectTrigger className="h-8 text-xs rounded-xl">
                              <SelectValue placeholder="Select wallet type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank">Bank / Checking</SelectItem>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="cash">Cash Wallet</SelectItem>
                              <SelectItem value="savings">Savings Account</SelectItem>
                              <SelectItem value="investment">Investment Account</SelectItem>
                              <SelectItem value="lent">Personal Loan / Lent</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : cond.field === "amount" ? (
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="h-8 text-xs rounded-xl"
                            value={cond.value}
                            onChange={e => handleConditionValueChange(idx, e.target.value)}
                          />
                        ) : (
                          <Input
                            placeholder="Value..."
                            className="h-8 text-xs rounded-xl"
                            value={cond.value}
                            onChange={e => handleConditionValueChange(idx, e.target.value)}
                          />
                        )}
                      </div>

                      {conditions.length > 1 && (
                        <Button type="button" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-rose-500" onClick={() => handleRemoveCondition(idx)}>
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button type="button" variant="ghost" size="sm" className="text-xs text-primary font-bold hover:bg-primary/5 rounded-xl" onClick={handleAddCondition}>
                  + Add Condition
                </Button>
              </div>

              <div className="border-t border-border/30 pt-4 space-y-4">
                {/* ACTIONS BUILDER */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Actions (THEN)</h4>

                <div className="space-y-3">
                  {actions.map((action, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 border border-border/20 bg-muted/10 p-3 rounded-2xl relative group">
                      {/* Action Type Select */}
                      <div className="w-40 shrink-0">
                        <Select value={action.type} onValueChange={(val) => handleActionTypeChange(idx, val)}>
                          <SelectTrigger className="h-8 text-xs rounded-xl">
                            <SelectValue placeholder="Action Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assign_category">Assign Category</SelectItem>
                            <SelectItem value="assign_tags">Assign Tags</SelectItem>
                            <SelectItem value="assign_budget">Assign Budget</SelectItem>
                            <SelectItem value="set_notes">Set Notes</SelectItem>
                            <SelectItem value="mark_recurring">Mark as Recurring</SelectItem>
                            <SelectItem value="flag_transaction">Flag Transaction</SelectItem>
                            <SelectItem value="move_to_wallet">Move to Wallet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action Value Input */}
                      <div className="flex-1 min-w-[150px]">
                        {action.type === "assign_category" && (
                          <Select value={action.categoryId} onValueChange={(val) => handleActionValueChange(idx, "categoryId", val)}>
                            <SelectTrigger className="h-8 text-xs rounded-xl">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(c => (
                                <SelectItem key={c._id.toString()} value={c._id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                                    <span>{c.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {action.type === "assign_budget" && (
                          <Select value={action.budgetId} onValueChange={(val) => handleActionValueChange(idx, "budgetId", val)}>
                            <SelectTrigger className="h-8 text-xs rounded-xl">
                              <SelectValue placeholder="Select Budget" />
                            </SelectTrigger>
                            <SelectContent>
                              {budgets.length > 0 ? budgets.map(b => (
                                <SelectItem key={b._id.toString()} value={b._id.toString()}>{b.name}</SelectItem>
                              )) : (
                                <SelectItem value="empty" disabled>No active budgets found</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}

                        {action.type === "move_to_wallet" && (
                          <Select value={action.walletId} onValueChange={(val) => handleActionValueChange(idx, "walletId", val)}>
                            <SelectTrigger className="h-8 text-xs rounded-xl">
                              <SelectValue placeholder="Select Wallet" />
                            </SelectTrigger>
                            <SelectContent>
                              {wallets.map(w => (
                                <SelectItem key={w._id.toString()} value={w._id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full" style={{ backgroundColor: w.color }} />
                                    <span>{w.name} ({w.currency})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {action.type === "assign_tags" && (
                          <Input
                            placeholder="Comma-separated tags (e.g. business, taxi)"
                            className="h-8 text-xs rounded-xl"
                            value={action.tags?.join(", ") || ""}
                            onChange={e => handleActionValueChange(idx, "tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                          />
                        )}

                        {action.type === "set_notes" && (
                          <Input
                            placeholder="Notes text..."
                            className="h-8 text-xs rounded-xl"
                            value={action.notes || ""}
                            onChange={e => handleActionValueChange(idx, "notes", e.target.value)}
                          />
                        )}

                        {action.type === "mark_recurring" && (
                          <Select value={String(action.isRecurring)} onValueChange={(val) => handleActionValueChange(idx, "isRecurring", val === "true")}>
                            <SelectTrigger className="h-8 text-xs rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Mark as Recurring</SelectItem>
                              <SelectItem value="false">Mark as Non-Recurring</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {action.type === "flag_transaction" && (
                          <div className="flex items-center gap-4 py-1">
                            <label className="flex items-center gap-1.5 text-xs select-none">
                              <Checkbox
                                checked={action.isFlagged}
                                onCheckedChange={(checked) => handleActionValueChange(idx, "isFlagged", !!checked)}
                              />
                              Flagged
                            </label>
                            <label className="flex items-center gap-1.5 text-xs select-none">
                              <Checkbox
                                checked={action.needsReview}
                                onCheckedChange={(checked) => handleActionValueChange(idx, "needsReview", !!checked)}
                              />
                              Needs Review
                            </label>
                          </div>
                        )}
                      </div>

                      {actions.length > 1 && (
                        <Button type="button" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-rose-500" onClick={() => handleRemoveAction(idx)}>
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button type="button" variant="ghost" size="sm" className="text-xs text-emerald-500 font-bold hover:bg-emerald-500/5 rounded-xl" onClick={handleAddAction}>
                  + Add Action
                </Button>
              </div>

              <DialogFooter className="border-t border-border/30 pt-4 flex gap-2 justify-end">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => handlePreviewRetroactive(null)}>
                  Test Run (Dry Run)
                </Button>
                <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold">
                  {isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  {editingRule ? "Save Changes" : "Create Rule"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 5. Dry Run Retroactive Preview Modal */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle>Retroactive Rule Test (Dry Run)</DialogTitle>
              <DialogDescription>
                Evaluating rule against existing transaction history. No updates have been written to the database.
              </DialogDescription>
            </DialogHeader>

            {isPreviewLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="size-8 text-primary animate-spin" />
                <p className="text-xs font-semibold">Scanning transactions in scope...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-muted/40 p-3 rounded-2xl">
                  <span className="text-xs font-semibold">
                    Rule Evaluation Results: <strong className="text-primary">{previewMatches.length} matching transactions</strong>
                  </span>
                  {previewMatches.length > 0 && editingRule ? (
                    <Button size="xs" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm font-bold" onClick={() => handleRunRetroactive(editingRule._id.toString())}>
                      Apply Changes Permanently
                    </Button>
                  ) : null}
                </div>

                {previewMatches.length === 0 ? (
                  <div className="py-12 border border-dashed border-border/40 text-center rounded-2xl">
                    <HelpCircle className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-muted-foreground">No existing transactions matched this rule's conditions.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {previewMatches.map((m, idx) => (
                      <div key={idx} className="border border-border/40 p-4 rounded-2xl bg-card text-xs space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="font-bold text-sm leading-tight text-foreground">{m.description}</strong>
                            <span className="text-muted-foreground ml-2">({new Date(m.date).toLocaleDateString()})</span>
                          </div>
                          <span className="font-bold text-foreground">
                            {m.currency} {(m.amount / 100).toFixed(2)}
                          </span>
                        </div>

                        {/* Display the diff */}
                        <div className="bg-muted/30 p-2.5 rounded-xl border border-border/10 space-y-1 mt-2">
                          {m.changes.map((ch: any, cIdx: number) => (
                            <div key={cIdx} className="flex flex-wrap items-center gap-1.5 leading-relaxed">
                              <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">{ch.field}:</span>
                              <span className="text-rose-500 line-through">{ch.from}</span>
                              <ArrowRight className="size-3 text-muted-foreground" />
                              <span className="text-emerald-500 font-semibold">{ch.to}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 6. Rule Deletion Confirmation Dialog */}
        <AlertDialog open={!!deletingRuleId} onOpenChange={(open) => !open && setDeletingRuleId(null)}>
          <AlertDialogContent className="rounded-3xl p-6">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Automation Rule?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete this automation rule? Any future transactions matching these conditions will no longer be automated. Existing transactions will remain unaffected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 justify-end">
              <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold" onClick={handleExecuteDeleteRule}>
                Delete Rule
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </TooltipProvider>
  )
}
