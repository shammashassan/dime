"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Wallet } from "@/types"
import { createWallet, updateWallet } from "@/lib/actions/wallets"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Switch } from "@/components/ui/switch"
import {
  Landmark,
  Wallet as WalletIcon,
  Coins,
  CreditCard,
  TrendingUp,
  PiggyBank,
  HandCoins,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

const clientWalletSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  type: z.enum(["bank", "cash", "credit_card", "savings", "investment", "lent"]),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code").toUpperCase(),
  balance: z.coerce.number(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  icon: z.string().min(1, "Icon is required"),
  isArchived: z.boolean().default(false),
})

type ClientWalletInput = z.infer<typeof clientWalletSchema>

const PRESETS = {
  currencies: ["USD", "INR", "EUR", "GBP", "CAD", "AUD", "JPY", "SGD"],
  types: [
    { value: "bank", label: "Bank Account" },
    { value: "cash", label: "Cash" },
    { value: "credit_card", label: "Credit Card" },
    { value: "savings", label: "Savings Account" },
    { value: "investment", label: "Investment" },
    { value: "lent", label: "Lent / Receivable" },
  ],
  colors: [
    "#3B82F6", // blue
    "#10B981", // emerald
    "#8B5CF6", // violet
    "#EF4444", // red
    "#F59E0B", // amber
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#84CC16", // lime
    "#6366F1", // indigo
    "#6B7280", // gray
  ],
  icons: [
    { value: "Landmark", label: "Bank/Institution" },
    { value: "Wallet", label: "Wallet" },
    { value: "Coins", label: "Cash/Coins" },
    { value: "CreditCard", label: "Credit Card" },
    { value: "TrendingUp", label: "Investment/Growth" },
    { value: "PiggyBank", label: "Savings" },
    { value: "HandCoins", label: "Lent / Owed" },
  ],
}

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Landmark,
  Wallet: WalletIcon,
  Coins,
  CreditCard,
  TrendingUp,
  PiggyBank,
  HandCoins,
}

interface WalletFormProps {
  initialWallet?: Wallet
  onSuccess?: () => void
}

export function WalletForm({ initialWallet, onSuccess }: WalletFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialWallet
  const isCustomColor = initialWallet?.color
    ? !PRESETS.colors.some((c) => c.toLowerCase() === initialWallet.color.toLowerCase())
    : false
  const [showCustomColor, setShowCustomColor] = useState(isCustomColor)

  const defaultValues: Partial<ClientWalletInput> = {
    name: initialWallet?.name || "",
    type: initialWallet?.type || "bank",
    currency: initialWallet?.currency || "USD",
    balance: initialWallet?.balance ? initialWallet.balance / 100 : 0,
    color: initialWallet?.color || PRESETS.colors[0],
    icon: initialWallet?.icon || "Wallet",
    isArchived: initialWallet?.isArchived || false,
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<any>({
    resolver: zodResolver(clientWalletSchema),
    defaultValues,
  })

  const selectedColor = watch("color")
  const selectedCurrency = watch("currency")

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      const balanceInCents = Math.round(data.balance * 100)
      const payload = {
        name: data.name,
        type: data.type,
        currency: data.currency,
        balance: balanceInCents,
        color: data.color,
        icon: data.icon,
        isArchived: data.isArchived,
      }

      if (isEditing && initialWallet) {
        await updateWallet(initialWallet._id.toString(), payload)
        toast.success("Wallet updated successfully")
      } else {
        await createWallet(payload)
        toast.success("Wallet created successfully")
      }

      router.refresh()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      const errMsg = err.message || "Failed to save wallet. Please try again."
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <FieldGroup>
        {/* Wallet Name */}
        <Field data-invalid={!!errors.name}>
          <FieldLabel>Wallet Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              placeholder="e.g. Chase Checkings, Cash Wallet"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </InputGroup>
          {errors.name && <FieldError>{(errors.name as any).message}</FieldError>}
        </Field>

        {/* Wallet Type */}
        <Field data-invalid={!!errors.type}>
          <FieldLabel>Wallet Type</FieldLabel>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.type} className="h-10 rounded-xl">
                  <SelectValue placeholder="Select Wallet Type" />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.types.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <FieldError>{(errors.type as any).message}</FieldError>}
        </Field>

        {/* Currency and Balance */}
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.currency}>
            <FieldLabel>Currency</FieldLabel>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.currency} className="h-10 rounded-xl">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.currencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.currency && <FieldError>{(errors.currency as any).message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.balance}>
            <FieldLabel>{isEditing ? "Adjusted Balance" : "Initial Balance"}</FieldLabel>
            <InputGroup>
              <InputGroupInput
                type="number"
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.balance}
                {...register("balance")}
              />
            </InputGroup>
            {errors.balance && <FieldError>{(errors.balance as any).message}</FieldError>}
          </Field>
        </div>

        {/* Select Icon */}
        <Field data-invalid={!!errors.icon}>
          <FieldLabel>Icon</FieldLabel>
          <Controller
            control={control}
            name="icon"
            render={({ field }) => {
              const SelectedIcon = ICON_COMPONENTS[field.value] || WalletIcon
              return (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.icon} className="h-10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <SelectValue placeholder="Select Icon" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.icons.map((ic) => {
                      const IconComp = ICON_COMPONENTS[ic.value] || WalletIcon
                      return (
                        <SelectItem key={ic.value} value={ic.value}>
                          <div className="flex items-center gap-2">
                            <IconComp className="size-4 text-muted-foreground" />
                            <span>{ic.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )
            }}
          />
          {errors.icon && <FieldError>{(errors.icon as any).message}</FieldError>}
        </Field>

        {/* Custom Theme Color */}
        <Field data-invalid={!!errors.color}>
          <div className="flex items-center justify-between w-full">
            <FieldLabel className="mb-0">Theme Color</FieldLabel>
            <div className="flex items-center gap-2">
              <label htmlFor="custom-color-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">
                Use custom HEX color
              </label>
              <Switch
                id="custom-color-toggle"
                checked={showCustomColor}
                onCheckedChange={(checked) => {
                  setShowCustomColor(checked)
                  if (!checked) {
                    const isPreset = PRESETS.colors.some(c => c.toLowerCase() === selectedColor?.toLowerCase())
                    if (!isPreset) {
                      setValue("color", PRESETS.colors[0], { shouldDirty: true })
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {!showCustomColor ? (
              <Controller
                control={control}
                name="color"
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(val) => val && field.onChange(val)}
                    variant="outline"
                    spacing={2}
                    className="flex-wrap gap-2 w-full justify-start"
                  >
                    {PRESETS.colors.map((c) => (
                      <ToggleGroupItem
                        key={c}
                        value={c}
                        className="size-7 rounded-full p-0 border border-border/60 hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: c,
                          boxShadow: selectedColor === c ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : "none",
                        }}
                      >
                        <span className="sr-only">{c}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              />
            ) : (
              <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="text-xs text-muted-foreground">Custom Color:</span>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setValue("color", e.target.value, { shouldDirty: true })}
                  className="size-6 border-0 p-0 bg-transparent cursor-pointer rounded overflow-hidden"
                />
                <InputGroup className="w-28 h-8 rounded-lg">
                  <InputGroupInput
                    value={selectedColor}
                    onChange={(e) => setValue("color", e.target.value, { shouldDirty: true })}
                    className="h-8 py-0 px-2 text-xs uppercase"
                    placeholder="#000000"
                  />
                </InputGroup>
              </div>
            )}
          </div>
          {errors.color && <FieldError>{(errors.color as any).message}</FieldError>}
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
        <Button
          type="submit"
          disabled={loading || !isDirty}
          className="w-full md:w-auto px-8 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isEditing ? "Adjust Wallet" : "Create Wallet"}
        </Button>
      </div>
    </form>
  )
}
