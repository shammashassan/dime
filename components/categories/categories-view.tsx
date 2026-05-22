"use client"

import { useState, useTransition } from "react"
import { Category } from "@/types"
import { deleteCategory } from "@/lib/actions/categories"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { CategoryForm } from "./category-form"
import { MergeDialog } from "./merge-dialog"
import { Edit, Trash2, Plus, ArrowRightLeft, Lock, Folder } from "lucide-react"
import { useRouter } from "next/navigation"

interface CategoriesViewProps {
  categories: Category[]
}

export function CategoriesView({ categories }: CategoriesViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [mergingCategory, setMergingCategory] = useState<Category | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingCategoryId) return
    startTransition(async () => {
      try {
        await deleteCategory(deletingCategoryId)
        setDeletingCategoryId(null)
        router.refresh()
      } catch (err) {
        console.error(err)
      }
    })
  }

  // Group categories
  const systemCategories = categories.filter((c) => c.userId === null)
  const customCategories = categories.filter((c) => c.userId !== null)

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-xs shrink-0">
            <Folder className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Categories</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage system defaults and define custom labels to organize your spending.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-lg shadow-primary/10 flex items-center gap-2"
        >
          <Plus className="size-4" />
          Create Category
        </Button>
      </div>

      {/* Custom Categories Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Custom Categories
          <Badge variant="outline" className="rounded-full text-[10px] py-0.5 px-2">
            {customCategories.length} Created
          </Badge>
        </h2>
        {customCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {customCategories.map((c) => (
              <Card
                key={c._id.toString()}
                className="border border-border/40 bg-card shadow-md flex items-center justify-between p-4 overflow-hidden relative group"
              >
                {/* Visual Color Bar */}
                <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ backgroundColor: c.color }} />

                <div className="pl-3 space-y-1">
                  <div className="font-semibold text-sm line-clamp-1">{c.name}</div>
                  <Badge variant="secondary" className="rounded-full text-[9px] uppercase py-0 px-1.5 font-bold">
                    {Array.isArray(c.type) ? c.type.join(" / ") : c.type}
                  </Badge>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg hover:bg-muted"
                    onClick={() => setEditingCategory(c)}
                  >
                    <Edit className="size-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-amber-500 hover:bg-amber-500/10"
                    onClick={() => setMergingCategory(c)}
                  >
                    <ArrowRightLeft className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-rose-500 hover:bg-rose-500/10"
                    onClick={() => setDeletingCategoryId(c._id.toString())}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-border/40 shadow-sm bg-card p-8 flex flex-col items-center justify-center text-center">
            <Folder className="size-10 text-muted-foreground/30 mb-2" />
            <div className="text-sm font-semibold text-muted-foreground">No custom categories created yet.</div>
          </Card>
        )}
      </div>

      {/* System Default Categories Section */}
      <div className="space-y-4 pt-4 border-t border-border/10">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          System Default Categories
          <Badge variant="secondary" className="rounded-full text-[10px] py-0.5 px-2">
            Read Only
          </Badge>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {systemCategories.map((c) => (
            <Card
              key={c._id.toString()}
              className="border border-border/20 bg-muted/20 flex items-center justify-between p-4 overflow-hidden relative group cursor-not-allowed"
            >
              {/* Visual Color Bar */}
              <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ backgroundColor: c.color }} />

              <div className="pl-3 space-y-1">
                <div className="font-semibold text-sm line-clamp-1">{c.name}</div>
                <Badge variant="secondary" className="rounded-full text-[9px] uppercase py-0 px-1.5 font-bold bg-muted-foreground/10 text-muted-foreground">
                  {Array.isArray(c.type) ? c.type.join(" / ") : c.type}
                </Badge>
              </div>

              <Lock className="size-3.5 text-muted-foreground/40 shrink-0 mr-1" />
            </Card>
          ))}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">Create Category</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <CategoryForm onSuccess={() => setIsCreateOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">Edit Category</DialogTitle>
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
        <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-background border border-border/40 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight">Merge Category</DialogTitle>
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
        <AlertDialogContent className="bg-background border border-border/40 rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold tracking-tight">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete this category? 
              Warning: If you have transactions in this category, deleting it will leave them uncategorized. 
              To move transactions to another category instead, use the Merge action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border/40">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/95"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
