import Link from "next/link"
import { FileQuestion, Home, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"

export const metadata = {
  title: "404 - Page Not Found | Dime",
  description: "The page you are looking for does not exist or has been moved.",
}

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 w-full">
      <Empty className="max-w-md w-full border border-border/50 bg-card p-8 sm:p-12 shadow-sm rounded-3xl">
        <EmptyMedia variant="icon" className="size-16 rounded-2xl bg-muted text-muted-foreground mb-2">
          <FileQuestion className="size-8" />
        </EmptyMedia>
        <EmptyHeader className="gap-2">
          <EmptyTitle className="text-2xl font-extrabold tracking-tight text-foreground">
            Page Not Found
          </EmptyTitle>
          <EmptyDescription className="text-sm text-muted-foreground leading-relaxed">
            The page or financial record you requested could not be found. It may have been moved, deleted, or never existed.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex flex-row gap-3 pt-3">
          <Button variant="default" size="sm" asChild className="rounded-xl font-bold gap-1.5">
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl font-bold gap-1.5 border-border/60">
            <Link href="/">
              <Home className="size-4" />
              Home
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
