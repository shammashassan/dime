import { getNotificationsAction } from "@/lib/actions/notifications";
import { NotificationsContent } from "@/components/notifications/notifications-view";
import { Notification } from "@/types";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications - Dime",
  description: "View and manage your activities and alerts.",
};

function NotificationsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 pb-12">
      {/* Header section */}
      <section className="px-4 pt-8 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between max-w-7xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-48 md:h-10" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-5 w-80 max-w-full mt-2" />
          </div>
        </div>
      </section>

      {/* Content skeleton */}
      <section className="px-4 lg:px-6">
        <div className="max-w-7xl space-y-4">
          <Skeleton className="h-6 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}

async function NotificationsContentWrapper() {
  const res = await getNotificationsAction();
  const initialNotifications = res.success && res.data ? res.data : [];
  return <NotificationsContent initialNotifications={initialNotifications as unknown as Notification[]} />;
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsContentWrapper />
    </Suspense>
  );
}
