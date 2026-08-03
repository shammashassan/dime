"use client"

import { useState } from "react"
import { recordPriceSnapshot } from "@/lib/actions/investments"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"

interface PriceUpdateDialogProps {
  holdingId: string
  currentPrice: number
  trigger?: React.ReactNode
}

export function PriceUpdateDialog({ holdingId, currentPrice, trigger }: PriceUpdateDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [price, setPrice] = useState(currentPrice)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await recordPriceSnapshot(holdingId, price)
      if (res.success) {
        toast.success("Price updated successfully")
        setOpen(false)
      } else {
        toast.error("Failed to update price")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="rounded-xl font-bold gap-2">
            <RefreshCw className="size-3.5" />
            Update Price
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-sm rounded-2xl border border-border/50 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Update Market Price</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <FieldGroup>
            <Field>
              <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Market Price per Unit</FieldLabel>
              <Input 
                type="number" 
                step="any" 
                value={price} 
                onChange={(e) => setPrice(parseFloat(e.target.value))} 
                required 
                className="rounded-xl"
              />
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold gap-2">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save Price
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
