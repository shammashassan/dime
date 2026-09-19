"use client"

import { useEffect, useState } from "react"

export function CurrentYear({ fallback = 2026 }: { fallback?: number }) {
  const [year, setYear] = useState<number>(fallback)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return <>{year}</>
}
