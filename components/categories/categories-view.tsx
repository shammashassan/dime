"use client"

import { useState, useTransition } from "react"
import { Category } from "@/types"
import { deleteCategory } from "@/lib/actions/categories"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { CategoryForm } from "./category-form"
import { MergeDialog } from "./merge-dialog"
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
        } catch (err) { reject(err) }
      })
    })
    toast.promise(deletePromise, {
      loading: "Deleting...",
      success: "Category deleted",
      error: "Failed to delete category",
    })
  }

  const systemCategories = categories.filter((c) => c.userId === null)
  const customCategories  = categories.filter((c) => c.userId !== null)
  const typeList = (c: Category) => Array.isArray(c.type) ? c.type : [c.type]

  return (
    <div className="flex flex-col gap-7 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
            <Folder className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Categories</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Organize your spending with custom labels.</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform">
          <Plus className="size-4" />Create Category
        </Button>
      </div>

      {/* ── Custom Categories ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-foreground">Custom</h2>
          <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0 font-bold border-border/60 h-4">
            {customCategories.length}
          </Badge>
        </div>

        {customCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {customCategories.map((c) => (
              <div
                key={c._id.toString()}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                {/* Left colour strip */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: c.color }} />

                {/* Top row: icon + name + action buttons in their own fixed row */}
                <div className="flex items-center pl-4 pr-2 pt-3 pb-1 gap-2.5">
                  <div
                    className="size-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: c.color + "18", color: c.color }}
                  >
                    <FolderOpen className="size-3.5" />
                  </div>

                  {/* Name — truncates, never fights with buttons */}
                  <p className="text-[13px] font-bold text-foreground truncate leading-tight flex-1 min-w-0">
                    {c.name}
                  </p>

                  {/* Buttons — size-8, icon size-3.5, always visible width reserved */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost" size="icon"
                      className="size-8 rounded-lg hover:bg-muted/70"
                      onClick={() => setEditingCategory(c)}
                    >
                      <Edit className="size-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="size-8 rounded-lg text-amber-500 hover:bg-amber-500/10"
                      onClick={() => setMergingCategory(c)}
                    >
                      <ArrowRightLeft className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                      onClick={() => setDeletingCategoryId(c._id.toString())}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Type badges — own row, indented past the icon, free to wrap */}
                <div className="flex flex-wrap gap-1 pl-[54px] pr-3 pb-3 pt-0.5">
                  {typeList(c).map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="rounded-full text-[8px] uppercase py-0 px-1.5 font-bold tracking-wider h-[14px]"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-border/50 rounded-2xl p-10 text-center bg-muted/10">
            <Folder className="size-8 text-muted-foreground/25 mb-2.5" />
            <p className="text-sm font-semibold text-muted-foreground">No custom categories yet</p>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)} className="mt-3 rounded-lg font-semibold h-8">
              Create one
            </Button>
          </div>
        )}
      </section>

      {/* ── System Categories ── */}
      <section>
        <Separator className="mb-5 opacity-40" />
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-muted-foreground">System Defaults</h2>
          <Badge variant="secondary" className="rounded-full text-[9px] px-2 py-0 font-bold uppercase tracking-wider h-4">
            Read only
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {systemCategories.map((c) => (
            <div
              key={c._id.toString()}
              className="relative overflow-hidden rounded-xl border border-border/30 bg-muted/20 flex flex-col cursor-not-allowed opacity-60"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] opacity-40" style={{ backgroundColor: c.color }} />

              <div className="flex items-center pl-4 pr-3 pt-3 pb-1 gap-2.5">
                <div
                  className="size-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: c.color + "0d", color: c.color + "80" }}
                >
                  <FolderOpen className="size-3.5" />
                </div>
                <p className="text-[13px] font-semibold text-foreground/70 truncate leading-tight flex-1 min-w-0">
                  {c.name}
                </p>
                <Lock className="size-3.5 text-muted-foreground/30 shrink-0" />
              </div>

              <div className="flex flex-wrap gap-1 pl-[54px] pr-3 pb-3 pt-0.5">
                {typeList(c).map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="rounded-full text-[8px] uppercase py-0 px-1.5 font-bold tracking-wider h-[14px] bg-muted-foreground/10 text-muted-foreground/70"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dialogs ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Create Category</DialogTitle></DialogHeader>
          <div className="py-2"><CategoryForm onSuccess={() => setIsCreateOpen(false)} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Edit Category</DialogTitle></DialogHeader>
          <div className="py-2">
            {editingCategory && <CategoryForm initialCategory={editingCategory} onSuccess={() => setEditingCategory(null)} />}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mergingCategory} onOpenChange={(open) => !open && setMergingCategory(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 shadow-xl">
          <DialogHeader><DialogTitle className="text-xl font-extrabold">Merge Category</DialogTitle></DialogHeader>
          <div className="py-2">
            {mergingCategory && (
              <MergeDialog sourceCategory={mergingCategory} categories={categories} onSuccess={() => setMergingCategory(null)} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCategoryId} onOpenChange={(open) => !open && setDeletingCategoryId(null)}>
        <AlertDialogContent className="rounded-2xl border border-border/50 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-rose-600 dark:text-rose-400">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Transactions in this category will become uncategorized. Use <span className="font-semibold">Merge</span> to move them first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}
              className="rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white gap-1.5">
              {isPending && <Loader2 className="size-3.5 animate-spin" />}Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}