"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

interface ModeToggleProps {
    variant?: "ghost" | "outline"
    className?: string
}

export function ModeToggle({ variant = "ghost", className }: ModeToggleProps = {}) {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = mounted && resolvedTheme === "dark"

    return (
        <Button
            variant={variant}
            size="icon"
            disabled={!mounted}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            {isDark ? <Moon /> : <Sun />}
        </Button>
    )
}
