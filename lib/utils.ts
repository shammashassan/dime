import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amountInCents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100)
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(d)
}

export function calculateNextDueDate(current: Date, frequency: string): Date {
  const d = new Date(current)
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1)
      break
    case "weekly":
      d.setDate(d.getDate() + 7)
      break
    case "biweekly":
      d.setDate(d.getDate() + 14)
      break
    case "monthly":
      d.setMonth(d.getMonth() + 1)
      break
    case "quarterly":
      d.setMonth(d.getMonth() + 3)
      break
    case "yearly":
      d.setFullYear(d.getFullYear() + 1)
      break
  }
  return d
}

export function serializeData<T>(data: T): T {
  if (data === undefined) return undefined as any
  return JSON.parse(JSON.stringify(data))
}

