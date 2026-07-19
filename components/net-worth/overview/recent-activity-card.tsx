"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { NetWorthOverviewViewModel } from "@/types"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { History } from "lucide-react"

export function RecentActivityCard({ viewModel }: { viewModel: NetWorthOverviewViewModel }) {
  const { recentActivity } = viewModel

  return (
    <Card className="rounded-2xl border border-border/40 shadow-sm p-0 overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="border-b py-4 px-6 [.border-b]:pb-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-1.5">
            <History className="size-4.5 text-primary" />
            Recent Financial Activity
          </CardTitle>
          <CardDescription className="text-xs">Latest log activity feed</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-1">
        {recentActivity.length > 0 ? (
          <div className="relative pl-4 space-y-4 border-l border-border/30">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="relative group flex flex-col gap-0.5">
                {/* Bullet */}
                <div className="absolute -left-[21px] top-1 size-2 rounded-full border border-primary bg-background group-hover:scale-125 transition-transform" />
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  {activity.href ? (
                    <Link href={activity.href} className="font-semibold text-foreground hover:underline text-xs">
                      {activity.title}
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground text-xs">{activity.title}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{activity.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-16 text-center">No recent financial logs.</div>
        )}
      </CardContent>
    </Card>
  )
}
