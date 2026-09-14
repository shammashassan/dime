"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AdminUsersTabsProps {
  allTab: React.ReactNode
  pendingTab: React.ReactNode
  bannedTab: React.ReactNode
  adminsTab: React.ReactNode
  defaultTab?: string
}

export function AdminUsersTabs({
  allTab,
  pendingTab,
  bannedTab,
  adminsTab,
  defaultTab,
}: AdminUsersTabsProps) {
  const tabNames: Record<string, string> = {
    all: "All Users",
    pending: "Pending Approval",
    banned: "Banned Users",
    admins: "Administrators",
  }

  const initialTab = defaultTab && tabNames[defaultTab] ? defaultTab : "all"
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex flex-col gap-4">
        {/* Desktop TabsList (visible on sm and larger screens) */}
        <TabsList className="hidden sm:inline-flex rounded-xl bg-muted/80 p-1 self-start items-center gap-1 max-w-full overflow-x-auto scrollbar-hide h-auto border-0">
          <TabsTrigger
            value="all"
            className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer whitespace-nowrap"
          >
            All Users
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer whitespace-nowrap"
          >
            Pending Approval
          </TabsTrigger>
          <TabsTrigger
            value="banned"
            className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer whitespace-nowrap"
          >
            Banned Users
          </TabsTrigger>
          <TabsTrigger
            value="admins"
            className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer whitespace-nowrap"
          >
            Administrators
          </TabsTrigger>
        </TabsList>

        {/* Mobile Select (visible on smaller screens) */}
        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full border-border/40 bg-card h-10">
              <SelectValue placeholder={tabNames[activeTab]} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All Users
              </SelectItem>
              <SelectItem value="pending" className="rounded-lg">
                Pending Approval
              </SelectItem>
              <SelectItem value="banned" className="rounded-lg">
                Banned Users
              </SelectItem>
              <SelectItem value="admins" className="rounded-lg">
                Administrators
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tab contents wrapper */}
        <div className="mt-2">
          <TabsContent value="all" className="mt-0 focus-visible:outline-none">
            {allTab}
          </TabsContent>
          <TabsContent value="pending" className="mt-0 focus-visible:outline-none">
            {pendingTab}
          </TabsContent>
          <TabsContent value="banned" className="mt-0 focus-visible:outline-none">
            {bannedTab}
          </TabsContent>
          <TabsContent value="admins" className="mt-0 focus-visible:outline-none">
            {adminsTab}
          </TabsContent>
        </div>
      </div>
    </Tabs>
  )
}
