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
  defaultTab = "all",
}: AdminUsersTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const tabNames: Record<string, string> = {
    all: "All Users",
    pending: "Pending Approval",
    banned: "Banned Users",
    admins: "Administrators",
  }

  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-4"
      >
        {/* Desktop Tabs List */}
        <TabsList className="hidden sm:inline-flex h-10 bg-muted/60 p-1 border border-border/40 rounded-xl">
          <TabsTrigger
            value="all"
            className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            All Users
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
          >
            Pending Approval
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
        </TabsList>

        {/* Mobile Select (visible on smaller screens) */}
        <div className="sm:hidden w-full">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger aria-label="Select user category" className="w-full border-border/40 bg-card h-10">
              <SelectValue placeholder={tabNames[activeTab]} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/40 rounded-xl">
              <SelectGroup>
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
              </SelectGroup>
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
      </Tabs>
    </div>
  )
}
