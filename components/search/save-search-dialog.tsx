"use client"

import * as React from "react"
import { toast } from "sonner"
import { Bookmark, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { saveSearchAction } from "@/lib/actions/search"
import type { SerializedSavedSearch } from "@/lib/search/types"

interface SaveSearchDialogProps {
  query: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (saved: SerializedSavedSearch) => void
}

export function SaveSearchDialog({
  query,
  open,
  onOpenChange,
  onSaved,
}: SaveSearchDialogProps) {
  const [name, setName] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName("")
    }
  }, [open])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Please enter a name for this saved search")
      return
    }

    setLoading(true)
    try {
      const res = await saveSearchAction({
        name: trimmedName,
        query: query.trim(),
      })

      if (res.success && res.id) {
        toast.success(`Saved search "${trimmedName}" created`)
        if (onSaved) {
          onSaved({
            id: res.id,
            name: trimmedName,
            query: query.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
        onOpenChange(false)
      } else {
        toast.error(res.error || "Failed to save search")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save search")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[440px] max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 border border-border/50 shadow-xl bg-card">
        <form onSubmit={handleSave} className="flex flex-col">
          <DialogHeader className="gap-1 sm:gap-1.5 text-left">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
              <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bookmark className="size-4" />
              </div>
              Save Search Query
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Save this filter combination to your workspace for instant one-click access later.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3.5 sm:py-4">
            <FieldGroup className="gap-3.5 sm:gap-4">
              <Field>
                <FieldLabel htmlFor="search-name" className="text-xs sm:text-sm font-semibold">
                  Search Name
                </FieldLabel>
                <InputGroup className="h-10 rounded-xl border-border/60 bg-muted/30">
                  <InputGroupInput
                    id="search-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dining Out Spends, Active Subscriptions"
                    disabled={loading}
                    className="text-xs sm:text-sm"
                    autoFocus
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel className="text-xs sm:text-sm font-semibold">
                  Query Syntax
                </FieldLabel>
                <div className="max-h-24 overflow-y-auto rounded-xl border border-border/50 bg-muted/40 p-2.5 font-mono text-xs text-foreground select-all break-all scrollbar-hide">
                  {query || "(empty query)"}
                </div>
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 sm:pt-4 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto rounded-xl text-xs sm:text-sm h-9 sm:h-10 font-semibold border-border/60 hover:bg-muted/50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full sm:w-auto rounded-xl text-xs sm:text-sm h-9 sm:h-10 font-semibold gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              Save Search
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
