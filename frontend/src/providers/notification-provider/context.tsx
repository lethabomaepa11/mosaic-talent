"use client";

import { createContext } from "react";

export interface INotificationItem {
  id: string;
  notificationName: string;
  message: string;
  severity: string;
  isRead: boolean;
  creationTime: string;
  data?: string;
}

export interface INotificationStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  hasLoaded: boolean;
  items: INotificationItem[];
  totalCount: number;
  unreadCount: number;
  pushSupported: boolean;
  pushPermission: NotificationPermission | "unsupported";
  isPushConfigured: boolean;
  isPushSubscribed: boolean;
  vapidPublicKey: string;
}

export interface INotificationActionContext {
  fetchNotifications: (input?: {
    skipCount?: number;
    maxResultCount?: number;
    unreadOnly?: boolean;
  }) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  initializePushChannel: () => Promise<void>;
  subscribeToPush: () => Promise<void>;
  unsubscribeFromPush: () => Promise<void>;
}

export const INITIAL_STATE: INotificationStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  hasLoaded: false,
  items: [],
  totalCount: 0,
  unreadCount: 0,
  pushSupported: false,
  pushPermission: "default",
  isPushConfigured: false,
  isPushSubscribed: false,
  vapidPublicKey: "",
};

export const NotificationStateContext =
  createContext<INotificationStateContext>(INITIAL_STATE);

export const NotificationActionContext =
  createContext<INotificationActionContext>({
    fetchNotifications: async () => undefined,
    markNotificationAsRead: async () => undefined,
    markAllNotificationsAsRead: async () => undefined,
    initializePushChannel: async () => undefined,
    subscribeToPush: async () => undefined,
    unsubscribeFromPush: async () => undefined,
  });
