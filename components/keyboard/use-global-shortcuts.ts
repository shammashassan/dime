"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SHORTCUTS } from "@/lib/shortcuts-config"

interface UseGlobalShortcutsOptions {
  onOpenShortcutsHelp?: () => void
  onQuickAddTransaction?: () => void
}

export function useGlobalShortcuts({
  onOpenShortcutsHelp,
  onQuickAddTransaction,
}: UseGlobalShortcutsOptions = {}) {
  const router = useRouter()
  const [chordPrefix, setChordPrefix] = React.useState<string | null>(null)
  const chordTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore keystrokes in inputs, textareas, selects, or contenteditable
      const target = e.target as HTMLElement | null
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)

      if (isEditable) return

      // Also ignore if user is holding Meta / Ctrl / Alt (except for Shift for '?')
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // 2. If inside a dialog, only allow Escape
      const isInsideDialog = target?.closest("[role='dialog']")
      if (isInsideDialog && e.key !== "Escape") {
        return
      }

      // 3. Handle '?' for Shortcuts Help
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault()
        if (onOpenShortcutsHelp) {
          onOpenShortcutsHelp()
        } else {
          window.dispatchEvent(new CustomEvent("dime:open-shortcuts-help"))
        }
        return
      }

      // 4. Handle 'c' for Quick Add Transaction
      if (e.key === "c" && !chordPrefix) {
        e.preventDefault()
        if (onQuickAddTransaction) {
          onQuickAddTransaction()
        } else {
          window.dispatchEvent(new CustomEvent("dime:quick-add-transaction"))
        }
        return
      }

      // 5. Handle 'g' chord navigation
      if (!chordPrefix && e.key === "g") {
        setChordPrefix("g")
        if (chordTimerRef.current) clearTimeout(chordTimerRef.current)
        chordTimerRef.current = setTimeout(() => {
          setChordPrefix(null)
        }, 1000)
        return
      }

      // If chord is active (e.g. 'g' was pressed)
      if (chordPrefix === "g") {
        if (chordTimerRef.current) clearTimeout(chordTimerRef.current)
        setChordPrefix(null)

        const matched = SHORTCUTS.find(
          (s) => s.category === "Navigation" && s.keys[0] === "g" && s.keys[1] === e.key
        )

        if (matched && matched.path) {
          e.preventDefault()
          router.push(matched.path)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (chordTimerRef.current) clearTimeout(chordTimerRef.current)
    }
  }, [chordPrefix, onOpenShortcutsHelp, onQuickAddTransaction, router])

  return { chordPrefix }
}
