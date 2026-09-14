"use client";

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
import {
  Bell,
  ChevronRight,
  AlertTriangle,
  Calendar,
  Target,
  Trophy,
  Users,
  Clock,
} from "lucide-react";
import { useNotifications } from "./notifications-provider";
import { EmptyMuted } from "@/components/notifications/notification-menu";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NotificationsContentProps {
  initialNotifications: Notification[];
}

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

  let Icon = Bell;
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
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", bgClass, colorClass)}>
        <Icon className={cn("size-4", colorClass, "[&_*]:!text-inherit [&_*]:!stroke-current")} />
      </div>
    </ItemMedia>
  );
}

export function NotificationsContent({ initialNotifications }: NotificationsContentProps) {
  const router = useRouter();
  const {
    notifications: contextNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Fall back to initialNotifications if context has not populated yet
  const notifications = contextNotifications.length > 0 ? contextNotifications : initialNotifications;
  const unread = notifications.filter((n) => !n.readAt);

  const handleNotificationClick = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    const unreadList = notifications.filter((n) => !n.readAt);
    if (unreadList.length === 0) return;
    await markAllAsRead();
    toast.success("All notifications marked as read");
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
                    <NotificationIcon image={n.image} title={n.title} type={n.type} />

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
                    <NotificationIcon image={n.image} title={n.title} type={n.type} />

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
    <div className="flex flex-col gap-7 w-full">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
            <Bell className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-0.5">View and manage your alerts and activities.</p>
          </div>
        </div>
        <Button
          onClick={handleMarkAllAsRead}
          variant="outline"
          className="rounded-xl font-bold gap-2 shadow-sm active:scale-95 transition-transform w-full md:w-auto"
          disabled={unread.length === 0}
        >
          Mark all as read
        </Button>
      </div>

      <Separator />

      {/* Content */}
      {notifications.length === 0 ? (
        <div className="border border-dashed rounded-2xl">
          <EmptyMuted onRefresh={fetchNotifications} />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {renderSection("Today", today)}
          {renderSection("Yesterday", yesterday)}
          {renderSection("Earlier", older)}
        </div>
      )}
    </div>
  );
}
