"use client"

import { useState, useTransition } from "react"
import { Category } from "@/types"
import { deleteCategory } from "@/lib/actions/categories"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CategoryForm } from "./category-form"
import { MergeDialog } from "./merge-dialog"
import { cn } from "@/lib/utils"
import {
  Edit,
  Trash2,
  Plus,
  ArrowRightLeft,
  Lock,
  Folder,
  Loader2,
  FolderOpen,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CategoriesViewProps {
  categories: Category[]
}

export function CategoriesView({ categories }: CategoriesViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [mergingCategory, setMergingCategory] = useState<Category | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingCategoryId) return

    const deletePromise = new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          await deleteCategory(deletingCategoryId)
          setDeletingCategoryId(null)
          router.refresh()
          resolve(true)
        } catch (err) {
          reject(err)
        }
      })
    })

    toast.promise(deletePromise, {
      loading: "Deleting category...",
      success: "Category deleted",
      error: "Failed to delete category",
    })
  }

  const systemCategories = categories.filter((c) => c.userId === null)
  const customCategories = categories.filter((c) => c.userId !== null)

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
            <Folder className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Categories</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organize your spending with custom labels.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="size-4" />
          Create Category
        </Button>
      </div>

      {/* Custom Categories */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-bold text-foreground">Custom</h2>
          <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0 font-bold border-border/60">
            {customCategories.length}
          </Badge>
        </div>

        {customCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customCategories.map((c) => (
              <div
                key={c._id.toString()}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-default"
              >
                {/* Top accent */}
                <div className="h-[3px] w-full" style={{ backgroundColor: c.color }} />

                {/* Header */}
                <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: c.color + "18", color: c.color }}
                    >
                      <FolderOpen className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">{c.name}</p>
                      <Badge
                        variant="secondary"
                        className="mt-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold px-2 py-0 h-4"
                      >
                        {Array.isArray(c.type) ? c.type.join(" / ") : c.type}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Content space to balance layout height with other cards on the dashboard */}
                <div className="px-4 pb-3 flex-1 flex flex-col justify-end" />

                {/* Footer */}
                <div className="border-t border-border/30 px-2.5 py-1.5 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      onClick={() => setEditingCategory(c)}
                    >
                      <Edit className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      onClick={() => setMergingCategory(c)}
                    >
                      <ArrowRightLeft className="size-3.5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0"
                    onClick={() => setDeletingCategoryId(c._id.toString())}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-border/50 rounded-2xl p-10 text-center bg-muted/10">
            <Folder className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">No custom categories yet</p>
          </div>
        )}
      </section>

      {/* System Categories */}
      <section>
        <Separator className="mb-6 opacity-40" />
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-bold text-muted-foreground">System Defaults</h2>
          <Badge
            variant="secondary"
            className="rounded-full text-[9px] px-2 py-0 font-bold uppercase tracking-wider"
          >
            Read only
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {systemCategories.map((c) => (
            <div
              key={c._id.toString()}
              className="relative overflow-hidden rounded-2xl border border-border/30 bg-muted/10 shadow-none cursor-not-allowed opacity-70 flex flex-col"
            >
              {/* Top accent */}
              <div className="h-[3px] w-full opacity-50" style={{ backgroundColor: c.color }} />

              {/* Header */}
              <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: c.color + "0e", color: c.color + "90" }}
                  >
                    <FolderOpen className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground/70 truncate leading-tight">{c.name}</p>
                    <Badge
                      variant="secondary"
                      className="mt-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold px-2 py-0 h-4 bg-muted-foreground/10 text-muted-foreground/70"
                    >
                      {Array.isArray(c.type) ? c.type.join(" / ") : c.type}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Content space to balance layout height with other cards on the dashboard */}
              <div className="px-4 pb-3 flex-1 flex flex-col justify-end" />

              {/* Footer */}
              <div className="border-t border-border/20 px-4 py-2.5 flex items-center gap-1.5 bg-muted/5 mt-auto">
                <Lock className="size-3 text-muted-foreground/45 shrink-0" />
                <span className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-wider">
                  System Default
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Create Category</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <CategoryForm onSuccess={() => setIsCreateOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Edit Category</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {editingCategory && (
              <CategoryForm
                initialCategory={editingCategory}
                onSuccess={() => setEditingCategory(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={!!mergingCategory} onOpenChange={(open) => !open && setMergingCategory(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Merge Category</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {mergingCategory && (
              <MergeDialog
                sourceCategory={mergingCategory}
                categories={categories}
                onSuccess={() => setMergingCategory(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingCategoryId} onOpenChange={(open) => !open && setDeletingCategoryId(null)}>
        <AlertDialogContent className="rounded-2xl border border-border/50 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-rose-600 dark:text-rose-400">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Transactions in this category will become uncategorized. Use Merge to move them to another category first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white gap-1.5"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}