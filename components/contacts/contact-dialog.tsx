"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Contact } from "@/types"
import { createContact, updateContact } from "@/lib/actions/loans"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput, InputGroupTextarea } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, UserPlus, Pencil, Users } from "lucide-react"
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
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
      setError(null)
    }
  }, [open, initialContact, reset])

  const onSubmit = async (data: ContactFormInput) => {
    setLoading(true)
    setError(null)

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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto min-w-0 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            {isEditing ? "Edit Contact" : "Add Contact"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this contact's details."
              : "Create a reusable contact for tracking loans, history, and debt repayments."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl font-semibold">
              {error}
            </div>
          )}

          <FieldGroup className="gap-4">
            {/* Contact Name */}
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="contact-name">Contact Name</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="contact-name"
                  placeholder="e.g. John Doe"
                  className="h-10 rounded-xl"
                  {...register("name")}
                />
              </InputGroup>
              {errors.name && <FieldError>{(errors.name as any).message}</FieldError>}
            </Field>

            {/* Email Address & Phone Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="contact-email">Email (Optional)</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="contact-email"
                    type="email"
                    placeholder="john@example.com"
                    className="h-10 rounded-xl"
                    {...register("email")}
                  />
                </InputGroup>
                {errors.email && <FieldError>{(errors.email as any).message}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="contact-phone">Phone (Optional)</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="contact-phone"
                    placeholder="+91 98765 43210"
                    className="h-10 rounded-xl"
                    {...register("phone")}
                  />
                </InputGroup>
                {errors.phone && <FieldError>{(errors.phone as any).message}</FieldError>}
              </Field>
            </div>

            {/* Notes */}
            <Field data-invalid={!!errors.notes}>
              <FieldLabel htmlFor="contact-notes">Notes (Optional)</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="contact-notes"
                  placeholder="Relationship notes, bank transfer details, etc..."
                  className="rounded-xl"
                  rows={3}
                  {...register("notes")}
                />
              </InputGroup>
              {errors.notes && <FieldError>{(errors.notes as any).message}</FieldError>}
            </Field>
          </FieldGroup>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-semibold"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl font-bold px-6"
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
