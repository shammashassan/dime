"use client"

import { useState } from "react"
import { recordPriceSnapshot } from "@/lib/actions/investments"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shared/responsive-dialog"
import { Button } from "@/components/ui/button"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { Loader2, RefreshCw } from "lucide-react"

interface PriceUpdateDialogProps {
  holdingId: string
  currentPrice: number
  trigger?: React.ReactElement | null
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
        toast.add({ title: "Price updated successfully", type: "success" })
        setOpen(false)
      } else {
        toast.add({ title: "Failed to update price", type: "error" })
      }
    } catch (e) {
      toast.add({ title: "An error occurred", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button size="sm" variant="outline" className="rounded-xl font-bold gap-2">
            <RefreshCw className="size-3.5" />
            Update Price
          </Button>} />
      )}
      <DialogContent className="max-w-sm rounded-2xl border border-border/50 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Update Market Price</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="market-price-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Market Price per Unit</FieldLabel>
              <Input 
                id="market-price-input"
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
