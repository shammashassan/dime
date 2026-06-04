"use client"

import React, { useState } from "react"
import { Wallet } from "@/types"
import { shareWalletAction, unshareWalletAction } from "@/lib/actions/wallets"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FieldGroup, 
  Field, 
  FieldLabel 
} from "@/components/ui/field"
import { Users, UserPlus, Trash2, ShieldCheck, Mail } from "lucide-react"
import { useRouter } from "next/navigation"

interface ShareWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet: Wallet | null
}

export function ShareWalletDialog({
  open,
  onOpenChange,
  wallet,
}: ShareWalletDialogProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!wallet) return null

  const sharedEmails = wallet.sharedWith || []

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    
    if (!cleanEmail) {
      setError("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await shareWalletAction(wallet._id.toString(), cleanEmail)
      if (res.success) {
        toast.success(`Wallet shared with ${cleanEmail}`)
        setEmail("")
        router.refresh()
      } else {
        toast.error("Failed to share wallet")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An error occurred while sharing the wallet")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnshare = async (collaboratorEmail: string) => {
    if (!confirm(`Revoke wallet access for ${collaboratorEmail}?`)) return

    try {
      const res = await unshareWalletAction(wallet._id.toString(), collaboratorEmail)
      if (res.success) {
        toast.success(`Revoked access for ${collaboratorEmail}`)
        router.refresh()
      } else {
        toast.error("Failed to revoke access")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred while revoking access")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-left">
            <Users className="size-5 text-primary" />
            Wallet Collaboration
          </DialogTitle>
          <DialogDescription className="text-xs text-left">
            Share access to "{wallet.name}" with collaborators by email.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-2">
          {error && (
            <div className="bg-destructive/10 text-destructive text-xs rounded-xl p-3 border border-destructive/20 text-left font-medium">
              {error}
            </div>
          )}

          {/* Share Form */}
          <form onSubmit={handleShare} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="collab-email">Invite Collaborator Email</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="collab-email"
                    type="email"
                    placeholder="partner@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError(null)
                    }}
                    className="rounded-xl flex-1 h-10"
                    disabled={isSubmitting}
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !email} 
                    className="rounded-xl h-10 px-4 shrink-0 font-semibold cursor-pointer"
                  >
                    <UserPlus className="size-4 mr-1.5" /> Invite
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </form>

          {/* Shared members list */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">Active Collaborators</div>
            
            {sharedEmails.length === 0 ? (
              <div className="text-xs text-muted-foreground border border-dashed rounded-xl p-6 text-center bg-muted/10">
                This wallet is private. Only you can access it.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto border rounded-2xl p-2 bg-muted/10">
                {sharedEmails.map((emailAddr) => (
                  <div 
                    key={emailAddr}
                    className="flex justify-between items-center bg-background border border-border/40 rounded-xl px-3 py-2 text-sm text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium text-foreground">{emailAddr}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-7 rounded-lg text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                      onClick={() => handleUnshare(emailAddr)}
                      title="Revoke access"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl font-semibold cursor-pointer"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
