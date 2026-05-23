"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Category } from "@/types"
import { createCategory, updateCategory } from "@/lib/actions/categories"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Loader2, Check, ShoppingBag, Coffee, Car, Home, Film, Heart, Gift, Briefcase,
  DollarSign, Activity, Globe, TrendingUp, Utensils, Book, Music, HelpCircle,
  ArrowLeftRight, Shirt, Plane, Zap, Baby, Dog, Dumbbell, Smartphone, CreditCard,
  Building, Leaf, Star, ShoppingCart, Pizza, Beer, Bus, Train, Bike, Wifi,
  Gamepad2, GraduationCap, Stethoscope, Wrench, Hammer, Camera, HandCoins, type LucideIcon
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(30, "Name must be 30 characters or less"),
  type: z.array(z.enum(["income", "expense", "transfer"])).min(1, "At least one type is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
})

type CategoryFormInput = z.infer<typeof categoryFormSchema>

interface CategoryFormProps {
  initialCategory?: Category
  onSuccess?: () => void
}

const PREMIUM_COLORS = [
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#64748b", // Slate
]

// Icon map: name -> Lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Film,
  Heart,
  Gift,
  Briefcase,
  DollarSign,
  Activity,
  Globe,
  TrendingUp,
  Utensils,
  Book,
  Music,
  HelpCircle,
  ArrowLeftRight,
  Shirt,
  Plane,
  Zap,
  Baby,
  Dog,
  Dumbbell,
  Smartphone,
  CreditCard,
  Building,
  Leaf,
  Star,
  ShoppingCart,
  Pizza,
  Beer,
  Bus,
  Train,
  Bike,
  Wifi,
  Gamepad2,
  GraduationCap,
  Stethoscope,
  Wrench,
  Hammer,
  Camera,
  HandCoins,
}

const ICON_OPTIONS = Object.keys(ICON_MAP)

export function CategoryForm({ initialCategory, onSuccess }: CategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initialCategory

  // Normalize legacy string types to array format
  let initialType: ("income" | "expense" | "transfer")[] = ["expense"]
  if (initialCategory?.type) {
    if (Array.isArray(initialCategory.type)) {
      initialType = initialCategory.type as any
    } else if (typeof initialCategory.type === "string") {
      if (initialCategory.type === "both") {
        initialType = ["income", "expense"]
      } else if (initialCategory.type === "income" || initialCategory.type === "expense" || initialCategory.type === "transfer") {
        initialType = [initialCategory.type as any]
      }
    }
  }

  const defaultValues: CategoryFormInput = {
    name: initialCategory?.name || "",
    type: initialType,
    icon: initialCategory?.icon || "HelpCircle",
    color: initialCategory?.color || PREMIUM_COLORS[0],
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  })

  const selectedColor = watch("color")
  const selectedIcon = watch("icon")

  const onSubmit = async (data: CategoryFormInput) => {
    setLoading(true)
    setError(null)

    const savePromise = new Promise(async (resolve, reject) => {
      try {
        if (isEditing && initialCategory) {
          await updateCategory(initialCategory._id.toString(), data)
        } else {
          await createCategory(data)
        }
        router.refresh()
        if (onSuccess) onSuccess()
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })

    toast.promise(savePromise, {
      loading: isEditing ? "Saving changes..." : "Creating category...",
      success: isEditing ? "Category updated successfully" : "Category created successfully",
      error: (err: any) => {
        const errMsg = err.message || "Failed to save category. Please try again."
        setError(errMsg)
        return errMsg
      },
    })

    try {
      await savePromise
    } catch (err) {
      console.error("Category save error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-lg border border-destructive/20 animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <FieldGroup>
        {/* Name */}
        <Field data-invalid={!!errors.name}>
          <FieldLabel>Category Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              placeholder="e.g. Dining Out, Freelance, Groceries"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </InputGroup>
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>

        {/* Type ToggleGroup */}
        <Field data-invalid={!!errors.type}>
          <FieldLabel>Category Type</FieldLabel>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <ToggleGroup
                type="multiple"
                value={field.value}
                onValueChange={(val) => field.onChange(val)}
                variant="outline"
                spacing={0}
                className="w-full flex border border-border/30 rounded-3xl overflow-hidden"
              >
                <ToggleGroupItem value="expense" className="flex-1 rounded-none rounded-l-3xl py-2 text-xs font-semibold">
                  Expense
                </ToggleGroupItem>
                <ToggleGroupItem value="income" className="flex-1 rounded-none py-2 text-xs font-semibold">
                  Income
                </ToggleGroupItem>
                <ToggleGroupItem value="transfer" className="flex-1 rounded-none rounded-r-3xl py-2 text-xs font-semibold">
                  Transfer
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          />
          {errors.type && <FieldError>{errors.type.message}</FieldError>}
        </Field>

        {/* Color Palette Selector */}
        <Field data-invalid={!!errors.color}>
          <FieldLabel>Theme Color</FieldLabel>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {PREMIUM_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setValue("color", hex, { shouldDirty: true })}
                className="size-8 rounded-full border border-border/20 relative flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                style={{ backgroundColor: hex }}
              >
                {selectedColor.toLowerCase() === hex.toLowerCase() && (
                  <Check className="size-4 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
          {errors.color && <FieldError>{errors.color.message}</FieldError>}
        </Field>

        {/* Icon Grid Selector - Shows actual Lucide icons */}
        <Field data-invalid={!!errors.icon}>
          <FieldLabel>Category Icon</FieldLabel>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 pt-1">
            {ICON_OPTIONS.map((iconName) => {
              const IconComp = ICON_MAP[iconName]
              const isSelected = selectedIcon === iconName
              return (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  onClick={() => setValue("icon", iconName, { shouldDirty: true })}
                  className={cn(
                    "h-10 w-10 rounded-xl border flex items-center justify-center transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground hover:border-border/70"
                  )}
                >
                  <IconComp
                    className="size-4"
                    style={{ color: isSelected ? selectedColor : undefined }}
                  />
                </button>
              )
            })}
          </div>
          {errors.icon && <FieldError>{errors.icon.message}</FieldError>}
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
        <Button
          type="submit"
          disabled={loading || !isDirty}
          className="w-full md:w-auto px-8 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isEditing ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  )
}
