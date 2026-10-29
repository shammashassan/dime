"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog as UIDialog,
  DialogClose as UIDialogClose,
  DialogContent as UIDialogContent,
  DialogDescription as UIDialogDescription,
  DialogFooter as UIDialogFooter,
  DialogHeader as UIDialogHeader,
  DialogTitle as UIDialogTitle,
  DialogTrigger as UIDialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer as UIDrawer,
  DrawerClose as UIDrawerClose,
  DrawerContent as UIDrawerContent,
  DrawerDescription as UIDrawerDescription,
  DrawerFooter as UIDrawerFooter,
  DrawerHeader as UIDrawerHeader,
  DrawerTitle as UIDrawerTitle,
  DrawerTrigger as UIDrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "cn"

const ResponsiveDialogContext = React.createContext<{ isMobile: boolean }>({
  isMobile: false,
})

export function useResponsiveDialog() {
  return React.useContext(ResponsiveDialogContext)
}

export function ResponsiveDialog({
  children,
  open,
  onOpenChange,
  showSwipeHandle = true,
  ...props
}: {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean, details?: any) => void
  showSwipeHandle?: boolean
  [key: string]: any
}) {
  const isMobile = useMediaQuery("(max-width: 767px)")

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile }}>
      {isMobile ? (
        <UIDrawer open={open} onOpenChange={onOpenChange} showSwipeHandle={showSwipeHandle} {...props}>
          {children}
        </UIDrawer>
      ) : (
        <UIDialog open={open} onOpenChange={onOpenChange} {...props}>
          {children}
        </UIDialog>
      )}
    </ResponsiveDialogContext.Provider>
  )
}

export function ResponsiveDialogTrigger({
  className,
  children,
  render,
  ...props
}: any) {
  const { isMobile } = useResponsiveDialog()
  return isMobile ? (
    <UIDrawerTrigger className={className} render={render} {...props}>
      {children}
    </UIDrawerTrigger>
  ) : (
    <UIDialogTrigger className={className} render={render} {...props}>
      {children}
    </UIDialogTrigger>
  )
}

export function ResponsiveDialogClose({
  className,
  children,
  render,
  ...props
}: any) {
  const { isMobile } = useResponsiveDialog()
  return isMobile ? (
    <UIDrawerClose className={className} render={render} {...props}>
      {children}
    </UIDrawerClose>
  ) : (
    <UIDialogClose className={className} render={render} {...props}>
      {children}
    </UIDialogClose>
  )
}

export function ResponsiveDialogContent({
  className,
  children,
  ...props
}: any) {
  const { isMobile } = useResponsiveDialog()

  if (isMobile) {
    const isP0 = className?.includes("p-0")
    // Filter out desktop max-width/max-height classes
    const cleanClassName = className
      ? className
          .replace(/\boverflow-y-auto\b/g, "")
          .replace(/\boverflow-auto\b/g, "")
          .replace(/\bmax-h-[^\s]+\b/g, "")
          .replace(/\bsm:max-w-[^\s]+\b/g, "")
          .replace(/\bmax-w-[^\s]+\b/g, "")
      : ""

    return (
      <UIDrawerContent
        className={cn(
          "max-h-[88dvh] overflow-hidden flex flex-col",
          cleanClassName
        )}
        {...props}
      >
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain",
            isP0 ? "p-0" : "px-4 pb-6 pt-1"
          )}
        >
          {children}
        </div>
      </UIDrawerContent>
    )
  }

  return (
    <UIDialogContent className={className} {...props}>
      {children}
    </UIDialogContent>
  )
}

export function ResponsiveDialogHeader({
  className,
  children,
  ...props
}: any) {
  const { isMobile } = useResponsiveDialog()
  return isMobile ? (
    <UIDrawerHeader className={cn("text-left px-0 pt-1 pb-3", className)} {...props}>
      {children}
    </UIDrawerHeader>
  ) : (
    <UIDialogHeader className={className} {...props}>
      {children}
    </UIDialogHeader>
  )
}

export function ResponsiveDialogTitle({
  className,
  children,
  ...props
}: any) {
  const { isMobile } = useResponsiveDialog()
  return isMobile ? (
    <UIDrawerTitle className={className} {...props}>
      {children}
    </UIDrawerTitle>
  ) : (
    <UIDialogTitle className={className} {...props}>
      {children}
    </UIDialogTitle>
  )
}

export function ResponsiveDialogDescription({
  className,
  children,
  ...props
}: any) {
  const { isMobile } = useResponsiveDialog()
  return isMobile ? (
    <UIDrawerDescription className={className} {...props}>
      {children}
    </UIDrawerDescription>
  ) : (
    <UIDialogDescription className={className} {...props}>
      {children}
    </UIDialogDescription>
  )
}

export function ResponsiveDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("py-2 overflow-y-auto max-h-[60vh] no-scrollbar", className)}
      {...props}
    />
  )
}

export function ResponsiveDialogFooter({
  className,
  children,
  ...props
}: any) {
  const { isMobile } = useResponsiveDialog()
  return isMobile ? (
    <UIDrawerFooter className={cn("px-0 pt-3 mt-auto", className)} {...props}>
      {children}
    </UIDrawerFooter>
  ) : (
    <UIDialogFooter className={className} {...props}>
      {children}
    </UIDialogFooter>
  )
}

// Backwards-compatible convenience wrapper
export interface ResponsiveModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
  showCloseButton?: boolean
}

export function ResponsiveModal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  showCloseButton = true,
}: ResponsiveModalProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <ResponsiveDialogTrigger>{trigger}</ResponsiveDialogTrigger>}
      <ResponsiveDialogContent
        showCloseButton={showCloseButton}
        className={cn(className, contentClassName)}
      >
        {(title || description) && (
          <ResponsiveDialogHeader>
            {title && <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>}
            {description && (
              <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
            )}
          </ResponsiveDialogHeader>
        )}
        <ResponsiveDialogBody>{children}</ResponsiveDialogBody>
        {footer && <ResponsiveDialogFooter>{footer}</ResponsiveDialogFooter>}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export {
  ResponsiveDialog as Dialog,
  ResponsiveDialogTrigger as DialogTrigger,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogClose as DialogClose,
  ResponsiveDialogClose as ResponsiveModalClose,
  ResponsiveDialogFooter as ResponsiveModalFooter,
  ResponsiveDialogHeader as ResponsiveModalHeader,
  ResponsiveDialogTitle as ResponsiveModalTitle,
  ResponsiveDialogDescription as ResponsiveModalDescription,
}
