"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  indicatorClassName,
  indicatorStyle,
  animateOnMount = true,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
  indicatorStyle?: React.CSSProperties
  animateOnMount?: boolean
}) {
  const [animatedValue, setAnimatedValue] = React.useState(0)

  React.useEffect(() => {
    if (animateOnMount) {
      const t = setTimeout(() => {
        setAnimatedValue(value || 0)
      }, 80)
      return () => clearTimeout(t)
    } else {
      setAnimatedValue(value || 0)
    }
  }, [value, animateOnMount])

  const displayValue = animateOnMount ? animatedValue : (value || 0)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-3 w-full items-center overflow-x-hidden rounded-4xl bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "size-full flex-1 bg-primary transition-all duration-1000 ease-out", 
          indicatorClassName
        )}
        style={{ 
          transform: `translateX(-${100 - displayValue}%)`,
          ...indicatorStyle
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
