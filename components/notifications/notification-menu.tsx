"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell as BellIcon, RefreshCcw as RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Notification } from "@/types";
import {
  getNotificationsAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <BellIcon className="size-3.5" />
      </div>
    </ItemMedia>
  );
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="size-1.5 rounded-full bg-primary block"
    />
  );
}

export function EmptyMuted({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <Empty className="py-8 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BellIcon />
        </EmptyMedia>
        <EmptyTitle>No Notifications</EmptyTitle>
        <EmptyDescription className="max-w-[200px] text-pretty">
          You&apos;re all caught up. New notifications will appear here.
        </EmptyDescription>
      </EmptyHeader>
      {onRefresh && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRefresh} className="rounded-xl">
            <RefreshCcwIcon className="size-3 mr-1.5" />
            Refresh
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export function NotificationMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const hasNotifications = notifications.length > 0;

  const fetchNotifications = useCallback(async () => {
    const res = await getNotificationsAction();
    if (res.success && res.data) {
      setNotifications(res.data as unknown as Notification[]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        fetchNotifications();
      }
    }, 0);

    const interval = setInterval(() => {
      if (active) {
        fetchNotifications();
      }
    }, 60000);

    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.readAt);
    if (unread.length === 0) return;
    await Promise.all(
      unread.map((n) => markNotificationReadAction(n._id.toString()))
    );
    setNotifications(
      notifications.map((n) => ({ ...n, readAt: n.readAt || new Date() }))
    );
  };

  const handleNotificationClick = async (id: string) => {
    const notification = notifications.find((n) => n._id.toString() === id);
    if (!notification || notification.readAt) return;

    setNotifications(
      notifications.map((n) =>
        n._id.toString() === id ? { ...n, readAt: new Date() } : n
      )
    );
    await markNotificationReadAction(id);
    router.refresh();
  };

  const getRelativeTime = (date: Date) => {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    // eslint-disable-next-line react-hooks/purity
    const elapsed = new Date(date).getTime() - Date.now();
    const seconds = Math.round(elapsed / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    if (Math.abs(days) > 0) return rtf.format(days, "day");
    if (Math.abs(hours) > 0) return rtf.format(hours, "hour");
    if (Math.abs(minutes) > 0) return rtf.format(minutes, "minute");
    return "just now";
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open notifications"
          size="icon"
          variant="ghost"
          className="relative rounded-full"
        >
          <BellIcon aria-hidden="true" className="size-5" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-2 right-2 size-2 rounded-full bg-primary"
            />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 rounded-2xl shadow-xl border border-border/40 bg-popover z-50" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-xs text-muted-foreground font-medium hover:text-foreground hover:bg-transparent"
            disabled={unreadCount === 0}
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        </div>

        <Separator />

        {/* Body */}
        {!hasNotifications ? (
          <EmptyMuted onRefresh={fetchNotifications} />
        ) : (
          <ScrollArea className="h-[300px]">
            <DropdownMenuGroup className="py-1 pr-3">
              {notifications.slice(0, 5).map((notification) => {
                const hasLink = !!notification.link;
                const idStr = notification._id.toString();

                if (hasLink) {
                  return (
                    <DropdownMenuItem
                      key={idStr}
                      asChild
                    >
                      <Link
                        href={notification.link!}
                        onClick={(e) => {
                          if (!notification.readAt) {
                            e.preventDefault();
                            handleNotificationClick(idStr).then(() => {
                              router.push(notification.link!);
                            });
                          }
                        }}
                      >
                        <Item size="xs" className="w-full p-2 relative">
                          <NotificationIcon
                            image={notification.image}
                            title={notification.title}
                          />

                          <ItemContent className="gap-0.5">
                            <ItemTitle className={cn(!notification.readAt ? "font-semibold text-foreground" : "font-medium text-muted-foreground/80")}>
                              {notification.title}
                            </ItemTitle>
                            <ItemDescription
                              className={cn(
                                "leading-normal",
                                !notification.readAt
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/60"
                              )}
                            >
                              {notification.message}
                            </ItemDescription>
                            <span
                              className={cn(
                                "text-[10px] mt-1 block leading-none",
                                !notification.readAt
                                  ? "text-muted-foreground/60"
                                  : "text-muted-foreground/40"
                              )}
                            >
                              {getRelativeTime(notification.createdAt)}
                            </span>
                          </ItemContent>

                          {!notification.readAt && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <span className="sr-only">Unread</span>
                              <Dot />
                            </div>
                          )}
                        </Item>
                      </Link>
                    </DropdownMenuItem>
                  );
                }

                // No-link notification — click to mark read
                return (
                  <DropdownMenuItem
                    key={idStr}
                    onClick={() => handleNotificationClick(idStr)}
                  >
                    <Item size="xs" className="w-full p-2 relative">
                      <NotificationIcon
                        image={notification.image}
                        title={notification.title}
                      />

                      <ItemContent className="gap-0.5">
                        <ItemTitle className={cn(!notification.readAt ? "font-semibold text-foreground" : "font-medium text-muted-foreground/80")}>
                          {notification.title}
                        </ItemTitle>
                        <ItemDescription
                          className={cn(
                            "leading-normal",
                            !notification.readAt
                              ? "text-muted-foreground"
                              : "text-muted-foreground/60"
                          )}
                        >
                          {notification.message}
                        </ItemDescription>
                        <span
                          className={cn(
                            "text-[10px] mt-1 block leading-none",
                            !notification.readAt
                              ? "text-muted-foreground/60"
                              : "text-muted-foreground/40"
                          )}
                        >
                          {getRelativeTime(notification.createdAt)}
                        </span>
                      </ItemContent>

                      {!notification.readAt && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <span className="sr-only">Unread</span>
                          <Dot />
                        </div>
                      )}
                    </Item>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </ScrollArea>
        )}

        <Separator />

        {/* Footer */}
        <div className="p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground font-medium rounded-xl"
            onClick={() => router.push("/notifications")}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
