"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { cn } from "cn"
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2, X } from "lucide-react"

export interface ToastData {
  variant?: "default" | "success" | "error" | "info" | "warning" | "loading"
  description?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export const baseToast = ToastPrimitive.createToastManager<ToastData>()

export interface ToastOptions {
  description?: React.ReactNode
  timeout?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export function toast(title: React.ReactNode, options?: ToastOptions) {
  return baseToast.add({
    title,
    description: options?.description,
    timeout: options?.timeout ?? 4000,
    data: {
      variant: "default",
      action: options?.action,
    },
  })
}

toast.message = (title: React.ReactNode, options?: ToastOptions) => {
  return toast(title, options)
}

toast.custom = (jsx: (id: string | number) => React.ReactElement, options?: ToastOptions) => {
  return toast(jsx(0), options)
}

toast.success = (title: React.ReactNode, options?: ToastOptions) => {
  return baseToast.add({
    title,
    description: options?.description,
    timeout: options?.timeout ?? 4000,
    data: {
      variant: "success",
      action: options?.action,
    },
  })
}

toast.error = (title: React.ReactNode, options?: ToastOptions) => {
  return baseToast.add({
    title,
    description: options?.description,
    timeout: options?.timeout ?? 5000,
    data: {
      variant: "error",
      action: options?.action,
    },
  })
}

toast.info = (title: React.ReactNode, options?: ToastOptions) => {
  return baseToast.add({
    title,
    description: options?.description,
    timeout: options?.timeout ?? 4000,
    data: {
      variant: "info",
      action: options?.action,
    },
  })
}

toast.warning = (title: React.ReactNode, options?: ToastOptions) => {
  return baseToast.add({
    title,
    description: options?.description,
    timeout: options?.timeout ?? 5000,
    data: {
      variant: "warning",
      action: options?.action,
    },
  })
}

toast.loading = (title: React.ReactNode, options?: ToastOptions) => {
  return baseToast.add({
    title,
    description: options?.description,
    timeout: 0,
    data: {
      variant: "loading",
      action: options?.action,
    },
  })
}

toast.dismiss = (id?: string) => {
  baseToast.close(id)
}

toast.promise = <T,>(
  promise: Promise<T> | (() => Promise<T>),
  options: {
    loading: React.ReactNode
    success: React.ReactNode | ((data: T) => React.ReactNode)
    error: React.ReactNode | ((err: any) => React.ReactNode)
    description?: React.ReactNode
  }
): Promise<T> => {
  const p = typeof promise === "function" ? promise() : promise
  const id = toast.loading(options.loading, { description: options.description })

  p.then((data) => {
    const successTitle =
      typeof options.success === "function" ? options.success(data) : options.success
    baseToast.update(id, {
      title: successTitle,
      timeout: 4000,
      data: { variant: "success" },
    })
    return data
  }).catch((err) => {
    const errorTitle =
      typeof options.error === "function" ? options.error(err) : options.error
    baseToast.update(id, {
      title: errorTitle,
      timeout: 5000,
      data: { variant: "error" },
    })
  })

  return p
}

export function ToastProvider({
  children,
  ...props
}: ToastPrimitive.Provider.Props) {
  return (
    <ToastPrimitive.Provider toastManager={baseToast} {...props}>
      {children}
    </ToastPrimitive.Provider>
  )
}

function ToasterViewport({
  position = "bottom-right",
}: {
  position?:
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center"
}) {
  const { toasts } = ToastPrimitive.useToastManager<ToastData>()

  const positionClasses = {
    "top-left": "top-4 left-4 items-start",
    "top-right": "top-4 right-4 items-end",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-left": "bottom-4 left-4 items-start",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  }[position]

  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport
        data-slot="toast-viewport"
        className={cn(
          "fixed z-100 flex max-h-screen w-full max-w-[420px] flex-col-reverse gap-2 p-4 pointer-events-none",
          positionClasses
        )}
      >
        {toasts.map((toastItem) => {
          const variant = toastItem.data?.variant || "default"
          return (
            <ToastPrimitive.Root
              key={toastItem.id}
              toast={toastItem}
              data-slot="toast"
              data-variant={variant}
              className={cn(
                "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border p-4 shadow-xl transition-all duration-200 outline-none backdrop-blur-md",
                "bg-card/95 text-card-foreground border-border/60",
                variant === "default" && "border-border/60",
                variant === "success" &&
                "border-emerald-500/30 bg-emerald-500/[0.04] dark:bg-emerald-950/20 text-foreground",
                variant === "error" &&
                "border-destructive/30 bg-destructive/[0.04] dark:bg-destructive/10 text-foreground",
                variant === "warning" &&
                "border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-950/20 text-foreground",
                variant === "info" &&
                "border-sky-500/30 bg-sky-500/[0.04] dark:bg-sky-950/20 text-foreground",
                variant === "loading" &&
                "border-primary/30 bg-primary/[0.04] text-foreground"
              )}
            >
              <div className="shrink-0 pt-0.5">
                {variant === "success" && (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                )}
                {variant === "error" && (
                  <AlertCircle className="size-4 text-destructive" />
                )}
                {variant === "warning" && (
                  <AlertTriangle className="size-4 text-amber-500" />
                )}
                {variant === "info" && <Info className="size-4 text-sky-500" />}
                {variant === "loading" && (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
                {variant === "default" && (
                  <Info className="size-4 text-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                {toastItem.title && (
                  <ToastPrimitive.Title
                    data-slot="toast-title"
                    className="text-sm font-semibold tracking-tight leading-snug"
                  >
                    {toastItem.title}
                  </ToastPrimitive.Title>
                )}
                {toastItem.description && (
                  <ToastPrimitive.Description
                    data-slot="toast-description"
                    className="text-xs text-muted-foreground leading-relaxed"
                  >
                    {toastItem.description}
                  </ToastPrimitive.Description>
                )}
                {toastItem.data?.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toastItem.data?.action?.onClick()
                      baseToast.close(toastItem.id)
                    }}
                    className="mt-2 text-xs font-semibold text-primary hover:underline self-start"
                  >
                    {toastItem.data.action.label}
                  </button>
                )}
              </div>

              <ToastPrimitive.Close
                render={
                  <button
                    type="button"
                    className="shrink-0 rounded-lg p-1 text-muted-foreground/60 transition-colors hover:text-foreground hover:bg-muted/50 focus:outline-hidden"
                  >
                    <X className="size-3.5" />
                    <span className="sr-only">Close</span>
                  </button>
                }
              />
            </ToastPrimitive.Root>
          )
        })}
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  )
}

export function Toaster({
  position = "bottom-right",
}: {
  position?:
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "bottom-center"
}) {
  return (
    <ToastPrimitive.Provider toastManager={baseToast} limit={5}>
      <ToasterViewport position={position} />
    </ToastPrimitive.Provider>
  )
}

export default toast

