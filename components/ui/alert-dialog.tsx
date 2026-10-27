"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { cn } from "cn"

import { Button } from "@/components/ui/button"

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  asChild = false,
  render,
  children,
  ...props
}: AlertDialogPrimitive.Trigger.Props & { asChild?: boolean }) {
  const resolvedRender = render ?? (asChild && React.isValidElement(children) ? (children as React.ReactElement<any>) : undefined)
  const resolvedChildren = asChild && React.isValidElement(children) ? undefined : children

  return (
    <AlertDialogPrimitive.Trigger
      data-slot="alert-dialog-trigger"
      render={resolvedRender}
      {...props}
    >
      {resolvedChildren}
    </AlertDialogPrimitive.Trigger>
  )
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  size = "default",
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: "default" | "sm"
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100%-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-3xl bg-popover p-6 text-popover-foreground duration-150 outline-none sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 shadow-2xl ring-1 ring-foreground/5 data-[size=sm]:sm:max-w-sm",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn("flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  variant = "default",
  asChild = false,
  render,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { asChild?: boolean }) {
  const resolvedRender = render ?? (asChild && React.isValidElement(children) ? (children as React.ReactElement<any>) : undefined)
  const resolvedChildren = asChild && React.isValidElement(children) ? undefined : children

  return (
    <Button
      variant={variant}
      className={cn(className)}
      render={
        <AlertDialogPrimitive.Close
          data-slot="alert-dialog-action"
          render={resolvedRender}
        >
          {resolvedChildren}
        </AlertDialogPrimitive.Close>
      }
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  variant = "outline",
  asChild = false,
  render,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { asChild?: boolean }) {
  const resolvedRender = render ?? (asChild && React.isValidElement(children) ? (children as React.ReactElement<any>) : undefined)
  const resolvedChildren = asChild && React.isValidElement(children) ? undefined : children

  return (
    <Button
      variant={variant}
      className={cn(className)}
      render={
        <AlertDialogPrimitive.Close
          data-slot="alert-dialog-cancel"
          render={resolvedRender}
        >
          {resolvedChildren}
        </AlertDialogPrimitive.Close>
      }
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogMedia,
}
