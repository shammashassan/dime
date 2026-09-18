"use client"

import * as React from "react"
import {
  FolderInput,
  Wallet as WalletIcon,
  Tag,
  Trash2,
  X,
  Check,
  Plus,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  bulkDeleteTransactions,
  bulkUpdateTransactionCategory,
  bulkUpdateTransactionWallet,
  bulkAddTransactionTags,
} from "@/lib/actions/transactions"
import type { Category, Wallet } from "@/types"

interface BulkActionsToolbarProps {
  selectedIds: string[]
  categories: Category[]
  wallets: Wallet[]
  onClearSelection: () => void
  onSuccess: () => void
}

export function BulkActionsToolbar({
  selectedIds,
  categories,
  wallets,
  onClearSelection,
  onSuccess,
}: BulkActionsToolbarProps) {
  const [categoryOpen, setCategoryOpen] = React.useState(false)
  const [walletOpen, setWalletOpen] = React.useState(false)
  const [tagsOpen, setTagsOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  // Tags state
  const [tagInput, setTagInput] = React.useState("")
  const [pendingTags, setPendingTags] = React.useState<string[]>([])

  if (selectedIds.length === 0) return null

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !pendingTags.includes(trimmed)) {
      setPendingTags((prev) => [...prev, trimmed])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setPendingTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleApplyTags = () => {
    if (pendingTags.length === 0) return

    startTransition(async () => {
      try {
        const res = await bulkAddTransactionTags(selectedIds, pendingTags)
        if (res.success) {
          toast.success(`Tags added to ${res.count} transactions`)
          setTagsOpen(false)
          setPendingTags([])
          onSuccess()
        } else {
          toast.error(res.error || "Failed to add tags")
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to add tags")
      }
    })
  }

  const handleCategorySelect = (categoryId: string) => {
    startTransition(async () => {
      try {
        const res = await bulkUpdateTransactionCategory(selectedIds, categoryId)
        if (res.success) {
          toast.success(`Category updated for ${res.count} transactions`)
          setCategoryOpen(false)
          onSuccess()
        } else {
          toast.error(res.error || "Failed to update category")
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to update category")
      }
    })
  }

  const handleWalletSelect = (walletId: string) => {
    startTransition(async () => {
      try {
        const res = await bulkUpdateTransactionWallet(selectedIds, walletId)
        if (res.success) {
          toast.success(`Moved ${res.count} transactions to wallet`)
          setWalletOpen(false)
          onSuccess()
        } else {
          toast.error(res.error || "Failed to move transactions")
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to move transactions")
      }
    })
  }

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      try {
        const res = await bulkDeleteTransactions(selectedIds)
        if (res.success) {
          toast.success(`Deleted ${res.count} transactions`)
          setDeleteDialogOpen(false)
          onClearSelection()
          onSuccess()
        } else {
          toast.error(res.error || "Failed to delete transactions")
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to delete transactions")
      }
    })
  }

  return (
    <>
      <div className="fixed bottom-6 inset-x-0 mx-auto w-fit max-w-[95vw] z-40 animate-in fade-in-50 slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 px-2.5 sm:px-3.5 bg-card/95 backdrop-blur-md border border-border/60 shadow-2xl rounded-2xl">
          {/* Selected count badge */}
          <Badge
            variant="secondary"
            className="font-bold text-xs py-1 px-2.5 rounded-xl shrink-0 bg-primary/10 text-primary border-transparent"
          >
            {selectedIds.length} selected
          </Badge>

          <Separator orientation="vertical" className="h-4 mx-0.5 hidden sm:block" />

          {/* Change Category Popover */}
          <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                className="h-8 px-2.5 gap-1.5 text-xs font-medium rounded-xl hover:bg-muted/80 cursor-pointer"
              >
                <FolderInput className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Category</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="center" side="top" sideOffset={12}>
              <Command>
                <CommandInput placeholder="Search category..." className="h-9 text-xs" />
                <CommandList>
                  <CommandEmpty className="text-xs p-2 text-center text-muted-foreground">
                    No categories found.
                  </CommandEmpty>
                  <CommandGroup>
                    {categories.map((cat) => (
                      <CommandItem
                        key={cat._id.toString()}
                        value={cat.name}
                        onSelect={() => handleCategorySelect(cat._id.toString())}
                        className="text-xs flex items-center gap-2 cursor-pointer"
                      >
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || "gray" }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Move Wallet Popover */}
          <Popover open={walletOpen} onOpenChange={setWalletOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                className="h-8 px-2.5 gap-1.5 text-xs font-medium rounded-xl hover:bg-muted/80 cursor-pointer"
              >
                <WalletIcon className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Move Wallet</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="center" side="top" sideOffset={12}>
              <Command>
                <CommandInput placeholder="Search wallet..." className="h-9 text-xs" />
                <CommandList>
                  <CommandEmpty className="text-xs p-2 text-center text-muted-foreground">
                    No wallets found.
                  </CommandEmpty>
                  <CommandGroup>
                    {wallets.map((w) => (
                      <CommandItem
                        key={w._id.toString()}
                        value={w.name}
                        onSelect={() => handleWalletSelect(w._id.toString())}
                        className="text-xs flex items-center gap-2 cursor-pointer"
                      >
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: w.color || "gray" }}
                        />
                        <span className="truncate">{w.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto uppercase">
                          {w.currency}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Add Tags Popover */}
          <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                className="h-8 px-2.5 gap-1.5 text-xs font-medium rounded-xl hover:bg-muted/80 cursor-pointer"
              >
                <Tag className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Add Tags</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="center" side="top" sideOffset={12}>
              <div className="flex flex-col gap-2.5">
                <div className="text-xs font-semibold text-foreground">Add Tags</div>
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="Type a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddTag}
                    className="h-8 px-2.5 text-xs shrink-0"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                {pendingTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto py-1">
                    {pendingTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] py-0 px-2 gap-1 rounded-md"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={handleApplyTags}
                  disabled={pendingTags.length === 0 || isPending}
                  className="h-8 text-xs font-medium w-full mt-1"
                >
                  {isPending ? (
                    <Loader2 className="size-3 animate-spin mr-1" />
                  ) : (
                    <Check className="size-3 mr-1" />
                  )}
                  Apply Tags
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => setDeleteDialogOpen(true)}
            className="h-8 px-2.5 gap-1.5 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </Button>

          {/* Clear selection button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="size-8 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
            title="Deselect all (Esc)"
          >
            <X className="size-3.5" />
            <span className="sr-only">Clear selection</span>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {selectedIds.length} transactions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected transactions and revert their impact on
              your wallet balances. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={handleDeleteConfirm}
            >
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Delete {selectedIds.length} Transactions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
