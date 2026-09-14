"use client";

import {
  Bell as BellIcon,
  BellDot,
  RefreshCcw as RefreshCcwIcon,
  AlertTriangle,
  Calendar,
  Target,
  Trophy,
  Users,
  Clock,
} from "lucide-react";
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
import { useNotifications } from "./notifications-provider";
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
  type,
}: {
  image?: string;
  title: string;
  type?: string;
}) {
  if (image) {
    return (
      <ItemMedia variant="image" className="mt-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} className="rounded-sm" />
      </ItemMedia>
    );
  }

  let Icon = BellIcon;
  let bgClass = "bg-primary/10";
  let colorClass = "!text-primary";

  if (type === "budget_alert" || type?.includes("overdue")) {
    Icon = AlertTriangle;
    bgClass = "bg-destructive/10";
    colorClass = "!text-destructive";
  } else if (type?.startsWith("loan")) {
    Icon = Clock;
    bgClass = "bg-amber-500/10";
    colorClass = "!text-amber-500";
  } else if (type?.startsWith("subscription") || type?.startsWith("bill")) {
    Icon = Calendar;
    bgClass = "bg-blue-500/10";
    colorClass = "!text-blue-500";
  } else if (type?.startsWith("goal")) {
    Icon = type === "goal_achieved" ? Trophy : Target;
    bgClass = "bg-emerald-500/10";
    colorClass = "!text-emerald-500";
  } else if (type === "workspace" || type?.startsWith("shared")) {
    Icon = Users;
    bgClass = "bg-indigo-500/10";
    colorClass = "!text-indigo-500";
  }

  return (
    <ItemMedia className="mt-0.5">
      <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", bgClass, colorClass)}>
        <Icon className={cn("size-3.5", colorClass, "[&_*]:!text-inherit [&_*]:!stroke-current")} />
      </div>
    </ItemMedia>
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
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    hasNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = async (id: string) => {
    await markAsRead(id);
  };

  const getRelativeTime = (date: Date | string) => {
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
          aria-label={unreadCount > 0 ? `Open notifications (${unreadCount} unread)` : "Open notifications"}
          size="icon"
          variant="ghost"
          className="rounded-full"
        >
          {unreadCount > 0 ? (
            <BellDot className="size-4.5 text-foreground" aria-hidden="true" />
          ) : (
            <BellIcon className="size-4.5 text-muted-foreground" aria-hidden="true" />
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
            <DropdownMenuGroup className="p-1 flex flex-col gap-1">
              {notifications.slice(0, 5).map((notification) => {
                const hasLink = !!notification.link;
                const idStr = notification._id.toString();

                if (hasLink) {
                  return (
                    <DropdownMenuItem
                      key={idStr}
                      asChild
                      className={cn(
                        "cursor-pointer rounded-xl transition-colors",
                        !notification.readAt ? "bg-muted/80 hover:bg-muted" : "hover:bg-muted/50"
                      )}
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
                        <Item size="xs" className="w-full">
                          <NotificationIcon
                            image={notification.image}
                            title={notification.title}
                            type={notification.type}
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
                        </Item>
                      </Link>
                    </DropdownMenuItem>
                  );
                }

                // No-link notification — click to mark read
                return (
                  <DropdownMenuItem
                    key={idStr}
                    className={cn(
                      "cursor-pointer rounded-xl transition-colors",
                      !notification.readAt ? "bg-muted/80 hover:bg-muted" : "hover:bg-muted/50"
                    )}
                    onClick={() => handleNotificationClick(idStr)}
                  >
                    <Item size="xs" className="w-full">
                      <NotificationIcon
                        image={notification.image}
                        title={notification.title}
                        type={notification.type}
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
