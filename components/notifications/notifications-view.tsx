"use client";

import { useState, useEffect, useCallback } from "react";
import { Notification } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, ChevronRight } from "lucide-react";
import {
  markNotificationReadAction,
  getNotificationsAction,
} from "@/lib/actions/notifications";
import { EmptyMuted } from "@/components/notifications/notification-menu";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NotificationsContentProps {
  initialNotifications: Notification[];
}

function NotificationIcon({
  image,
  title,
}: {
  image?: string;
  title: string;
}) {
  if (image) {
    return (
      <ItemMedia variant="image" className="mt-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} className="rounded-sm" />
      </ItemMedia>
    );
  }
  return (
    <ItemMedia className="text-primary mt-0.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Bell className="size-4" />
      </div>
    </ItemMedia>
  );
}

export function NotificationsContent({ initialNotifications }: NotificationsContentProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [prevInitialNotifications, setPrevInitialNotifications] = useState<Notification[]>(initialNotifications);

  if (initialNotifications !== prevInitialNotifications) {
    setNotifications(initialNotifications);
    setPrevInitialNotifications(initialNotifications);
  }

  const fetchNotifications = useCallback(async () => {
    const res = await getNotificationsAction();
    if (res.success && res.data) {
      setNotifications(res.data as unknown as Notification[]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const interval = setInterval(() => {
      if (active) {
        fetchNotifications();
      }
    }, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const unread = notifications.filter((n) => !n.readAt);

  const handleNotificationClick = async (id: string) => {
    const notification = notifications.find((n) => n._id.toString() === id);
    if (!notification || notification.readAt) return;

    setNotifications((prev) =>
      prev.map((n) => (n._id.toString() === id ? { ...n, readAt: new Date() } : n))
    );
    await markNotificationReadAction(id);
    router.refresh();
  };

  const handleMarkAllAsRead = async () => {
    const unreadList = notifications.filter((n) => !n.readAt);
    if (unreadList.length === 0) return;
    await Promise.all(unreadList.map((n) => markNotificationReadAction(n._id.toString())));
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date() })));
    toast.success("All notifications marked as read");
    router.refresh();
  };

  const groupNotifications = (list: Notification[]) => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const older: Notification[] = [];
    const todayStr = new Date().toDateString();
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yStr = yDate.toDateString();
    list.forEach((n) => {
      const d = new Date(n.createdAt).toDateString();
      if (d === todayStr) today.push(n);
      else if (d === yStr) yesterday.push(n);
      else older.push(n);
    });
    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupNotifications(notifications);

  const renderSection = (title: string, list: Notification[]) => {
    if (list.length === 0) return null;
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          {title}
        </h3>
        <ItemGroup>
          {list.map((n) => {
            const hasLink = !!n.link;
            const idStr = n._id.toString();

            return (
              <Item
                key={idStr}
                variant={!n.readAt ? "muted" : "outline"}
                className="items-start md:items-center justify-between cursor-pointer rounded-2xl"
                asChild={hasLink}
                onClick={!hasLink ? () => handleNotificationClick(idStr) : undefined}
              >
                {hasLink ? (
                  <Link
                    href={n.link!}
                    className="flex w-full items-center p-3"
                    onClick={(e) => {
                      if (!n.readAt) {
                        e.preventDefault();
                        handleNotificationClick(idStr).then(() => {
                          router.push(n.link!);
                        });
                      }
                    }}
                  >
                    <NotificationIcon image={n.image} title={n.title} />

                    <ItemContent className="min-w-0 ml-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <ItemTitle>{n.title}</ItemTitle>
                        {!n.readAt && <Badge variant="secondary">New</Badge>}
                      </div>
                      <ItemDescription className="text-xs leading-relaxed mt-0.5">
                        {n.message}
                      </ItemDescription>
                      <span className="text-[10px] text-muted-foreground/60 font-medium mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()}{" "}
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </ItemContent>

                    <ItemActions className="self-end md:self-center shrink-0 mt-3 md:mt-0 ml-auto">
                      {n.readAt && <ChevronRight className="size-4" />}
                    </ItemActions>
                  </Link>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex w-full items-center p-3"
                    onKeyDown={(e) => e.key === "Enter" && handleNotificationClick(idStr)}
                    onClick={() => handleNotificationClick(idStr)}
                  >
                    <NotificationIcon image={n.image} title={n.title} />

                    <ItemContent className="min-w-0 ml-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <ItemTitle>{n.title}</ItemTitle>
                        {!n.readAt && <Badge variant="secondary">New</Badge>}
                      </div>
                      <ItemDescription className="text-xs leading-relaxed mt-0.5">
                        {n.message}
                      </ItemDescription>
                      <span className="text-[10px] text-muted-foreground/60 font-medium mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()}{" "}
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </ItemContent>

                    <ItemActions className="self-end md:self-center shrink-0 mt-3 md:mt-0 ml-auto" />
                  </div>
                )}
              </Item>
            );
          })}
        </ItemGroup>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-6 pb-12">
      {/* Header */}
      <section className="px-4 pt-8 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between max-w-7xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bell />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight md:text-4xl bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/60">
                  Notifications
                </h1>
                <Badge variant="outline" className="rounded-full">
                  {unread.length} Unread
                </Badge>
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl font-medium">
              View and manage your alerts, reminders, and activities.
            </p>
          </div>
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            className="w-full sm:w-auto shrink-0 rounded-xl"
            disabled={unread.length === 0}
          >
            Mark all as read
          </Button>
        </div>
      </section>

      <Separator />

      {/* Content */}
      {notifications.length === 0 ? (
        <section className="px-4 lg:px-6">
          <div className="max-w-7xl border border-dashed rounded-2xl">
            <EmptyMuted onRefresh={fetchNotifications} />
          </div>
        </section>
      ) : (
        <section className="px-4 lg:px-6">
          <div className="max-w-7xl flex flex-col gap-8">
            {renderSection("Today", today)}
            {renderSection("Yesterday", yesterday)}
            {renderSection("Earlier", older)}
          </div>
        </section>
      )}
    </div>
  );
}
