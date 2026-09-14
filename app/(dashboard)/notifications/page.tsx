import { getNotificationsAction } from "@/lib/actions/notifications";
import { NotificationsContent } from "@/components/notifications/notifications-view";
import { Notification } from "@/types";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "View and manage your activities and alerts.",
};

import { NotificationsSkeleton } from "./loading";

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
