"use client"

import * as React from "react"
import { useGlobalShortcuts } from "./use-global-shortcuts"
import { KeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog"
import { GlobalTransactionDialog } from "./global-transaction-dialog"

export function KeyboardShortcutsProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  useGlobalShortcuts()

  return (
    <>
      {children}
      <KeyboardShortcutsDialog />
      <React.Suspense fallback={null}>
        <GlobalTransactionDialog />
      </React.Suspense>
    </>
  )
}
