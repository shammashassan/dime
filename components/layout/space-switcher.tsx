"use client"

import * as React from "react"
import { authClient } from "@/lib/auth-client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronsUpDown, Plus, User, Building } from "lucide-react"
import { toast } from "sonner"

export function SpaceSwitcher() {
  const { data: orgs } = authClient.useListOrganizations()
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const [open, setOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [newOrgName, setNewOrgName] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const activeOrgId = session?.session?.activeOrganizationId || null
  const activeOrg = orgs?.find((o) => o.id === activeOrgId)

  const handleSwitchSpace = async (orgId: string | null) => {
    if (orgId === activeOrgId) return

    window.dispatchEvent(new Event("workspace-switch-start"))
    setOpen(false)

    try {
      await authClient.organization.setActive({
        organizationId: orgId,
      })
      window.location.reload()
    } catch {
      toast.error("Failed to switch workspace")
    }
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return

    setIsSubmitting(true)
    try {
      const { data, error } = await authClient.organization.create({
        name: newOrgName.trim(),
        slug: newOrgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      })

      if (error) {
        toast.error(error.message || "Failed to create space")
      } else if (data) {
        toast.success("Space created successfully")
        setDialogOpen(false)
        setNewOrgName("")
        // Trigger switch and reload
        window.dispatchEvent(new Event("workspace-switch-start"))
        await authClient.organization.setActive({
          organizationId: data.id,
        })
        window.location.reload()
      }
    } catch {
      toast.error("An error occurred while creating space")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sessionLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="h-12 animate-pulse bg-muted/40" />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="h-12 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                  {activeOrg ? (
                    <Building className="size-5" />
                  ) : (
                    <User className="size-5" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeOrg ? activeOrg.name : "Personal Space"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeOrg ? "Shared Workspace" : "Personal Workspace"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Spaces
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => handleSwitchSpace(null)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <User className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-xs">
                  <span className="font-medium">Personal Space</span>
                  <span className="text-muted-foreground">Private ledger</span>
                </div>
                {!activeOrgId && <span className="ml-auto text-xs font-bold text-primary">✓</span>}
              </DropdownMenuItem>
              {orgs && orgs.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {orgs.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        className="gap-2 p-2 cursor-pointer"
                        onClick={() => handleSwitchSpace(org.id)}
                      >
                        <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                          <Building className="size-4" />
                        </div>
                        <div className="grid flex-1 text-left text-xs">
                          <span className="font-medium">{org.name}</span>
                          <span className="text-muted-foreground">Shared workspace</span>
                        </div>
                        {activeOrgId === org.id && (
                          <span className="ml-auto text-xs font-bold text-primary">✓</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}
              <DropdownMenuSeparator />
              <DialogTrigger asChild>
                <DropdownMenuItem className="gap-2 p-2 cursor-pointer text-primary">
                  <div className="flex size-6 items-center justify-center rounded-md border border-primary/20 bg-primary/5">
                    <Plus className="size-4" />
                  </div>
                  <span className="font-medium">Create Space</span>
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </SidebarMenuItem>
        </SidebarMenu>
      </DropdownMenu>

      <DialogContent>
        <form onSubmit={handleCreateOrg}>
          <DialogHeader>
            <DialogTitle>Create Shared Space</DialogTitle>
            <DialogDescription>
              Create a shared financial space for couples, families, or business teams.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Space Name</Label>
              <Input
                id="name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="e.g. Couples Budget, Family Workspace"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !newOrgName.trim()}>
              {isSubmitting ? "Creating..." : "Create Space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
