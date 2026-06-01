import { requireApprovedUser } from "@/lib/auth-guard"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ImpersonationBanner } from "@/components/layout/impersonation-banner"
import { SiteFooter } from "@/components/layout/site-footer"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireApprovedUser()

  return (
    <div className="[--header-height:calc(--spacing(14))] flex min-h-screen w-full">
      <SidebarProvider className="flex flex-col">
        <DashboardHeader />
        <div className="flex flex-1">
          <DashboardSidebar />
          <SidebarInset className="bg-background overflow-hidden">
            <ImpersonationBanner />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto h-full scrollbar-hide">
              {children}
            </div>
          </SidebarInset>
        </div>
        <SiteFooter />
      </SidebarProvider>
    </div>
  )
}
