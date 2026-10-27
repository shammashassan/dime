import { getNotificationsAction } from "@/lib/actions/notifications";
import { NotificationsContent } from "@/components/notifications/notifications-view";
import { Notification } from "@/types";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "View and manage your activities and alerts.",
};


export default async function NotificationsPage() {
  const res = await getNotificationsAction();
  const initialNotifications = res.success && res.data ? res.data : [];
  return <NotificationsContent initialNotifications={initialNotifications as unknown as Notification[]} />;
}
