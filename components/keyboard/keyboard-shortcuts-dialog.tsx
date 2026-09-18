"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Command, Keyboard } from "lucide-react"
import { SHORTCUTS, ShortcutItem } from "@/lib/shortcuts-config"

interface KeyboardShortcutsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function KeyboardShortcutsDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: KeyboardShortcutsDialogProps = {}) {
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (val: boolean) => {
    if (isControlled && setControlledOpen) {
      setControlledOpen(val)
    } else {
      setInternalOpen(val)
    }
  }

  // Listen to custom open event
  React.useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("dime:open-shortcuts-help", handleOpen)
    return () => window.removeEventListener("dime:open-shortcuts-help", handleOpen)
  }, [])

  const categories = ["All", "Navigation", "Global Actions", "Transactions Table"] as const
  const [activeTab, setActiveTab] = React.useState<string>("All")

  const filteredShortcuts = React.useMemo(() => {
    if (activeTab === "All") return SHORTCUTS
    return SHORTCUTS.filter((s) => s.category === activeTab)
  }, [activeTab])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl gap-0">
        <DialogHeader className="p-5 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Keyboard className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Speed through Dime with keyboard-first navigation and productivity chords.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-border/30 bg-muted/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-8 p-1 bg-muted/60 rounded-xl gap-1 w-full flex">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="text-xs flex-1 h-6 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs font-medium cursor-pointer"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-5 py-3 divide-y divide-border/30">
          {filteredShortcuts.map((item) => (
            <div
              key={item.id}
              className="py-2.5 flex items-center justify-between gap-4 text-xs group hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-foreground">{item.label}</span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {item.description}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && item.keys.length > 1 && item.category === "Navigation" && (
                      <span className="text-[10px] text-muted-foreground/60 px-0.5 font-mono">
                        then
                      </span>
                    )}
                    <Kbd className="text-[11px] font-mono px-2 py-0.5 min-w-6 text-center shadow-xs border-border/60">
                      {key}
                    </Kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info note */}
        <div className="p-3 px-5 bg-muted/30 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Shortcuts are inactive while typing in text inputs</span>
          <span className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/40">
            Esc to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
