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
}

export function AdminUsersTabs({
  allTab,
  pendingTab,
  bannedTab,
  adminsTab,
}: AdminUsersTabsProps) {
  const [activeTab, setActiveTab] = useState("all")

  const tabNames: Record<string, string> = {
    all: "All Users",
    pending: "Pending Approval",
    banned: "Banned Users",
    admins: "Administrators",
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex flex-col gap-4">
        {/* Desktop TabsList (visible on sm and larger screens) */}
        <TabsList className="hidden sm:flex w-full border-b border-border/40 overflow-x-auto overflow-y-hidden scrollbar-hide">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="banned">Banned Users</TabsTrigger>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
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
