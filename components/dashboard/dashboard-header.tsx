import { format } from "date-fns"
import { Calendar } from "lucide-react"

export interface DashboardHeaderProps {
  userName: string
  scopeName?: string
  isOrganization?: boolean
}

export function DashboardHeader({ userName, scopeName, isOrganization }: DashboardHeaderProps) {
  const todayFormatted = format(new Date(), "EEEE, MMMM d, yyyy")

  return (
    <header className="flex flex-col gap-2 border-b border-border/60 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            dime financial workspace
          </p>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-medium text-primary border border-primary/20">
            {isOrganization && scopeName ? scopeName : "Personal"}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Welcome back,{" "}
          <span className="bg-linear-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent font-extrabold">
            {userName}
          </span>
        </h1>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="size-3.5 text-muted-foreground/70" />
        <span>{todayFormatted}</span>
      </div>
    </header>
  )
}
