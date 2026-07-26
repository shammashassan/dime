"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Contact } from "@/types"
import { createContact, updateContact } from "@/lib/actions/loans"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, UserPlus, UserMinus, UserCheck, Pencil } from "lucide-react"
import { toast } from "sonner"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

type ContactFormInput = z.infer<typeof contactSchema>

interface ContactDialogProps {
  initialContact?: Contact
  trigger?: React.ReactNode
  onSuccess?: (contactId: string, contactName: string) => void
}

export function ContactDialog({
  initialContact,
  trigger,
  onSuccess,
}: ContactDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialContact

  const defaultValues: ContactFormInput = {
    name: initialContact?.name || "",
    email: initialContact?.email || "",
    phone: initialContact?.phone || "",
    notes: initialContact?.notes || "",
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  })

  // Reload defaults when opened
  useEffect(() => {
    if (open) {
      reset(defaultValues)
      setError(null)
    }
  }, [open, initialContact, reset])

  const onSubmit = async (data: ContactFormInput) => {
    setLoading(true)
    setError(null)

    // Clean empty values
    const cleanedData = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    }

    try {
      if (isEditing && initialContact) {
        const result = await updateContact(initialContact._id.toString(), cleanedData)
        if (result && !result.success) {
          setError((result as any).error || "Failed to update contact")
          return
        }
        toast.success("Contact updated successfully")
        if (onSuccess) {
          onSuccess(initialContact._id.toString(), data.name)
        }
      } else {
        const result = await createContact(cleanedData)
        if (result && !result.success) {
          setError((result as any).error || "Failed to create contact")
          return
        }
        toast.success("Contact created successfully")
        if (onSuccess && (result as any).contactId) {
          onSuccess((result as any).contactId, data.name)
        }
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="rounded-xl font-semibold">
            {isEditing ? (
              <>
                <Pencil className="size-4 mr-1.5" />
                Edit Contact
              </>
            ) : (
              <>
                <UserPlus className="size-4 mr-1.5" />
                Add Contact
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto rounded-2xl border border-border/40 p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contact" : "Add Contact"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this contact's details."
              : "Create a reusable contact for tracking loans, history, and debt repayments."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <FieldGroup className="space-y-3">
            {/* Contact Name */}
            <Field data-invalid={!!errors.name}>
              <FieldLabel>Contact Name</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  placeholder="e.g. John Doe"
                  className="rounded-xl"
                  {...register("name")}
                />
              </InputGroup>
              {errors.name && <FieldError>{(errors.name as any).message}</FieldError>}
            </Field>

            {/* Email Address */}
            <Field data-invalid={!!errors.email}>
              <FieldLabel>Email Address (Optional)</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  type="email"
                  placeholder="e.g. john@example.com"
                  className="rounded-xl"
                  {...register("email")}
                />
              </InputGroup>
              {errors.email && <FieldError>{(errors.email as any).message}</FieldError>}
            </Field>

            {/* Phone Number */}
            <Field data-invalid={!!errors.phone}>
              <FieldLabel>Phone Number (Optional)</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  placeholder="e.g. +91 98765 43210"
                  className="rounded-xl"
                  {...register("phone")}
                />
              </InputGroup>
              {errors.phone && <FieldError>{(errors.phone as any).message}</FieldError>}
            </Field>

            {/* Notes */}
            <Field data-invalid={!!errors.notes}>
              <FieldLabel>Notes (Optional)</FieldLabel>
              <textarea
                placeholder="Relationship notes, bank transfer details, etc..."
                className="flex min-h-[70px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                {...register("notes")}
              />
              {errors.notes && <FieldError>{(errors.notes as any).message}</FieldError>}
            </Field>
          </FieldGroup>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Contact"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
