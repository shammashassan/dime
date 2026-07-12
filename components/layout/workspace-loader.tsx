"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

export function WorkspaceLoader() {
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const handleStart = () => setLoading(true)
    window.addEventListener("workspace-switch-start", handleStart)
    return () => window.removeEventListener("workspace-switch-start", handleStart)
  }, [])

  if (!loading) return null

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Switching workspace...</p>
      </div>
    </div>
  )
}
