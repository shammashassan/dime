"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Notification } from "@/types";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/actions/notifications";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  hasNotifications: boolean;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const NOTIFICATIONS_REFRESH_EVENT = "dime:refresh-notifications";

/**
 * Dispatches an in-app event to trigger an immediate notification fetch
 * across all mounted components in the current tab and other open tabs.
 */
export function refreshNotifications() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT));
    try {
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("dime_notifications");
        channel.postMessage({ type: "REFRESH" });
        channel.close();
      }
    } catch {
      // Ignore broadcast errors in unsupported environments
    }
  }
}

export function NotificationsProvider({
  children,
  initialNotifications = [],
}: {
  children: React.ReactNode;
  initialNotifications?: Notification[];
}) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getNotificationsAction();
      if (res.success && res.data) {
        setNotifications(res.data as unknown as Notification[]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // 1. Optimistic update in memory immediately (0ms latency for UI)
    const now = new Date();
    setNotifications((prev) =>
      prev.map((n) =>
        n._id.toString() === id ? { ...n, readAt: n.readAt || now } : n
      )
    );

    // 2. Broadcast to other open browser tabs
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("dime_notifications");
        channel.postMessage({ type: "MARK_READ", id, readAt: now.toISOString() });
        channel.close();
      }
    } catch {
      // Ignore broadcast errors
    }

    // 3. Persist to MongoDB
    await markNotificationReadAction(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    // 1. Optimistic update in memory immediately
    const now = new Date();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || now }))
    );

    // 2. Broadcast to other open browser tabs
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("dime_notifications");
        channel.postMessage({ type: "MARK_ALL_READ", readAt: now.toISOString() });
        channel.close();
      }
    } catch {
      // Ignore broadcast errors
    }

    // 3. Persist to MongoDB
    await markAllNotificationsReadAction();
  }, []);

  useEffect(() => {
    let active = true;

    // Fetch on initial mount
    fetchNotifications();

    // Single 60-second polling loop for background events (cron, loans, invites)
    const interval = setInterval(() => {
      if (active) {
        fetchNotifications();
      }
    }, 60000);

    // Immediate re-sync when user returns to this browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // In-app refresh event (fired immediately after user actions like expense creation, settlements, etc.)
    const handleRefreshEvent = () => {
      fetchNotifications();
    };
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefreshEvent);

    // Cross-tab broadcast receiver
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        broadcastChannel = new BroadcastChannel("dime_notifications");
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === "REFRESH" || event.data?.type === "MARK_ALL_READ") {
            fetchNotifications();
          } else if (event.data?.type === "MARK_READ" && event.data.id) {
            const readDate = event.data.readAt ? new Date(event.data.readAt) : new Date();
            setNotifications((prev) =>
              prev.map((n) =>
                n._id.toString() === event.data.id
                  ? { ...n, readAt: n.readAt || readDate }
                  : n
              )
            );
          }
        };
      }
    } catch {
      // Ignore broadcast channel errors
    }

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefreshEvent);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const hasNotifications = notifications.length > 0;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        hasNotifications,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
