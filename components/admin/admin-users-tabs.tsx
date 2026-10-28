"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AdminUsersTabsProps {
  activeTab: React.ReactNode
  bannedTab: React.ReactNode
  adminsTab: React.ReactNode
  allTab: React.ReactNode
  pendingTab?: React.ReactNode
  defaultTab?: string
}

export function AdminUsersTabs({
  activeTab,
  bannedTab,
  adminsTab,
  allTab,
  pendingTab,
  defaultTab = "active",
}: AdminUsersTabsProps) {
  const [currentTab, setCurrentTab] = useState(defaultTab)

  const tabNames: Record<string, string> = {
    active: "Active Users",
    banned: "Banned Users",
    admins: "Administrators",
    all: "All Users",
  }

  return (
    <div className="w-full">
      <Tabs
        value={currentTab}
        onValueChange={setCurrentTab}
        className="w-full space-y-4"
      >
        {/* Desktop Tabs List */}
        <TabsList className="hidden sm:inline-flex h-10 bg-muted/60 p-1 border border-border/40 rounded-xl">
          <TabsTrigger
            value="active"
            className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            Active Users
          </TabsTrigger>
          <TabsTrigger
            value="banned"
            className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            Banned Users
          </TabsTrigger>
          <TabsTrigger
            value="admins"
            className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            Administrators
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            All Users
          </TabsTrigger>
        </TabsList>

        {/* Mobile Select (visible on smaller screens) */}
        <div className="sm:hidden w-full">
          <Select value={currentTab} onValueChange={(val) => { if (val) setCurrentTab(val) }}>
            <SelectTrigger aria-label="Select user category" className="w-full border-border/40 bg-card h-10">
              <SelectValue placeholder={tabNames[currentTab] || "Active Users"} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectGroup>
                <SelectItem value="active" className="rounded-lg">
                  Active Users
                </SelectItem>
                <SelectItem value="banned" className="rounded-lg">
                  Banned Users
                </SelectItem>
                <SelectItem value="admins" className="rounded-lg">
                  Administrators
                </SelectItem>
                <SelectItem value="all" className="rounded-lg">
                  All Users
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Tab contents wrapper */}
        <div className="mt-2">
          <TabsContent value="active" className="mt-0 focus-visible:outline-none">
            {activeTab}
          </TabsContent>
          <TabsContent value="banned" className="mt-0 focus-visible:outline-none">
            {bannedTab}
          </TabsContent>
          <TabsContent value="admins" className="mt-0 focus-visible:outline-none">
            {adminsTab}
          </TabsContent>
          <TabsContent value="all" className="mt-0 focus-visible:outline-none">
            {allTab}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
