"use client"

import { useState, useEffect, useTransition } from "react"
import { Category } from "@/types"
import { getAffectedTransactionCount, mergeCategory } from "@/lib/actions/categories"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Loader2, AlertTriangle, ArrowRightLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface MergeDialogProps {
  sourceCategory: Category
  categories: Category[]
  onSuccess: () => void
}

export function MergeDialog({ sourceCategory, categories, onSuccess }: MergeDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [targetId, setTargetId] = useState<string>("")
  const [affectedCount, setAffectedCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load affected transactions count
  useEffect(() => {
    async function loadCount() {
      try {
        setLoadingCount(true)
        const count = await getAffectedTransactionCount(sourceCategory._id.toString())
        setAffectedCount(count)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCount(false)
      }
    }
    loadCount()
  }, [sourceCategory])

  // Filter available targets (cannot merge into itself)
  const targetOptions = categories.filter((c) => c._id.toString() !== sourceCategory._id.toString())

  const handleMerge = () => {
    if (!targetId) return
    setError(null)
    startTransition(async () => {
      try {
        await mergeCategory(sourceCategory._id.toString(), targetId)
        router.refresh()
        onSuccess()
      } catch (err: any) {
        setError(err.message || "Failed to merge categories.")
      }
    })
  }

  const selectedTarget = targetOptions.find((c) => c._id.toString() === targetId)

  return (
    <div className="space-y-6 pt-2">
      {error && (
        <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-lg border border-destructive/20 animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* Info warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-500 text-xs font-medium">
        <AlertTriangle className="size-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Merging is permanent!</p>
          <p>
            You are merging <span className="font-bold text-foreground">"{sourceCategory.name}"</span>. 
            This action will reassign all its current transactions to another category and permanently delete 
            "{sourceCategory.name}".
          </p>
        </div>
      </div>

      <FieldGroup>
        {/* Affected summary */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/10 flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">Affected Transactions:</span>
          {loadingCount ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <span className="font-bold text-foreground font-mono">{affectedCount} transactions</span>
          )}
        </div>

        {/* Target Category Select */}
        <Field>
          <FieldLabel>Target Category</FieldLabel>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Select destination category" />
            </SelectTrigger>
            <SelectContent>
              {targetOptions.map((c) => (
                <SelectItem key={c._id.toString()} value={c._id.toString()}>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span>{c.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase font-sans">
                      ({Array.isArray(c.type) ? c.type.join(" / ") : c.type})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      {/* Summary preview */}
      {targetId && selectedTarget && (
        <div className="flex items-center justify-center gap-4 py-3 border border-dashed border-border rounded-xl bg-muted/20 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: sourceCategory.color }} />
            {sourceCategory.name}
          </div>
          <ArrowRightLeft className="size-4 text-muted-foreground" />
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: selectedTarget.color }} />
            {selectedTarget.name}
          </div>
        </div>
      )}

      {/* Action footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
        <Button
          onClick={handleMerge}
          disabled={!targetId || isPending || loadingCount}
          className="w-full rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Merge & Delete Category
        </Button>
      </div>
    </div>
  )
}
