"use client";

import { AxiosError } from "axios";
import { PropsWithChildren, useContext, useReducer } from "react";
import { getAxiosInstance } from "@/utils/axiosInstance";
import {
  fetchNotificationsError,
  fetchNotificationsPending,
  fetchNotificationsSuccess,
  markNotificationsError,
  markNotificationsPending,
  markNotificationsSuccess,
  setPushState,
} from "./actions";
import {
  INITIAL_STATE,
  INotificationItem,
  NotificationActionContext,
  NotificationStateContext,
} from "./context";
import { NotificationReducer } from "./reducer";

const ENDPOINT = "/api/services/app/NotificationChannel";

type INotificationFeedResponse = {
  items?: Array<Partial<INotificationItem>>;
  totalCount?: number;
  unreadCount?: number;
};

type IPushPreferences = {
  isConfigured: boolean;
  isSubscribed: boolean;
  vapidPublicKey: string;
};

let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

const readApiError = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    return (error.response?.data?.error?.message as string | undefined) || fallback;
  }
  return fallback;
};

const normalizeNotification = (
  input: Partial<INotificationItem>,
): INotificationItem => ({
  id: String(input.id ?? ""),
  notificationName: input.notificationName ?? "notification",
  message: input.message ?? "You have a new notification.",
  severity: input.severity ?? "info",
  isRead: Boolean(input.isRead),
  creationTime: input.creationTime ?? new Date().toISOString(),
  data: input.data ?? "",
});

const normalizeFeed = (
  input: INotificationFeedResponse | undefined,
): {
  items: INotificationItem[];
  totalCount: number;
  unreadCount: number;
} => {
  const items = Array.isArray(input?.items)
    ? input!.items!.map((item) => normalizeNotification(item))
    : [];

  return {
    items,
    totalCount: Number(input?.totalCount ?? items.length),
    unreadCount: Number(input?.unreadCount ?? items.filter((item) => !item.isRead).length),
  };
};

const normalizePushPreferences = (
  input: Partial<IPushPreferences> | undefined,
): IPushPreferences => ({
  isConfigured: Boolean(input?.isConfigured),
  isSubscribed: Boolean(input?.isSubscribed),
  vapidPublicKey: input?.vapidPublicKey ?? "",
});

const toApplicationServerKey = (base64String: string): ArrayBuffer => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return buffer;
};

const getOrRegisterServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!("serviceWorker" in navigator)) {
    return null;
  }

  if (!serviceWorkerRegistrationPromise) {
    serviceWorkerRegistrationPromise = navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .catch(() => null);
  }

  return serviceWorkerRegistrationPromise;
};

const parseSubscription = (subscription: PushSubscription) => {
  const json = subscription.toJSON();
  const keys = (json.keys ?? {}) as {
    p256dh?: string;
    auth?: string;
  };

  return {
    endpoint: json.endpoint ?? "",
    p256dh: keys.p256dh ?? "",
    auth: keys.auth ?? "",
  };
};

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(NotificationReducer, INITIAL_STATE);

  const fetchPushPreferences = async (): Promise<IPushPreferences> => {
    const response = await instance.get(`${ENDPOINT}/GetPushPreferences`);
    return normalizePushPreferences(response.data?.result as Partial<IPushPreferences>);
  };

  const upsertPushSubscription = async (subscription: PushSubscription) => {
    const payload = parseSubscription(subscription);
    await instance.post(`${ENDPOINT}/UpsertPushSubscription`, {
      endpoint: payload.endpoint,
      p256DH: payload.p256dh,
      auth: payload.auth,
      deviceName: typeof navigator === "undefined" ? "" : navigator.platform,
      userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    });
  };

  const fetchNotifications = async (input?: {
    skipCount?: number;
    maxResultCount?: number;
    unreadOnly?: boolean;
  }) => {
    dispatch(fetchNotificationsPending());

    try {
      const response = await instance.get(`${ENDPOINT}/GetMyNotifications`, {
        params: {
          skipCount: input?.skipCount ?? 0,
          maxResultCount: input?.maxResultCount ?? 20,
          unreadOnly: input?.unreadOnly ?? false,
        },
      });
      const feed = normalizeFeed(response.data?.result as INotificationFeedResponse);
      dispatch(fetchNotificationsSuccess(feed));
    } catch (error) {
      dispatch(fetchNotificationsError());
      throw new Error(readApiError(error, "Failed to load notifications."));
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    dispatch(markNotificationsPending());
    try {
      await instance.post(`${ENDPOINT}/MarkNotificationAsRead`, { notificationId });
      const response = await instance.get(`${ENDPOINT}/GetMyNotifications`, {
        params: { skipCount: 0, maxResultCount: 20, unreadOnly: false },
      });
      const feed = normalizeFeed(response.data?.result as INotificationFeedResponse);
      dispatch(markNotificationsSuccess(feed));
    } catch (error) {
      dispatch(markNotificationsError());
      throw new Error(readApiError(error, "Failed to mark notification as read."));
    }
  };

  const markAllNotificationsAsRead = async () => {
    dispatch(markNotificationsPending());
    try {
      await instance.post(`${ENDPOINT}/MarkAllNotificationsAsRead`);
      const response = await instance.get(`${ENDPOINT}/GetMyNotifications`, {
        params: { skipCount: 0, maxResultCount: 20, unreadOnly: false },
      });
      const feed = normalizeFeed(response.data?.result as INotificationFeedResponse);
      dispatch(markNotificationsSuccess(feed));
    } catch (error) {
      dispatch(markNotificationsError());
      throw new Error(readApiError(error, "Failed to mark all notifications as read."));
    }
  };

  const initializePushChannel = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const pushSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (!pushSupported) {
      dispatch(
        setPushState({
          pushSupported: false,
          pushPermission: "unsupported",
          isPushConfigured: false,
          isPushSubscribed: false,
          vapidPublicKey: "",
        }),
      );
      return;
    }

    try {
      const registration = await getOrRegisterServiceWorker();
      const preferences = await fetchPushPreferences();
      const permission = Notification.permission;

      const currentSubscription = await registration?.pushManager.getSubscription();
      if (currentSubscription && preferences.isConfigured) {
        try {
          await upsertPushSubscription(currentSubscription);
        } catch {
          // Keep UX non-blocking if sync fails.
        }
      }

      const refreshedPreferences = await fetchPushPreferences();
      dispatch(
        setPushState({
          pushSupported: true,
          pushPermission: permission,
          isPushConfigured: refreshedPreferences.isConfigured,
          isPushSubscribed: refreshedPreferences.isSubscribed,
          vapidPublicKey: refreshedPreferences.vapidPublicKey,
        }),
      );
    } catch {
      dispatch(
        setPushState({
          pushSupported: true,
          pushPermission: Notification.permission,
          isPushConfigured: false,
          isPushSubscribed: false,
          vapidPublicKey: "",
        }),
      );
    }
  };

  const subscribeToPush = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const registration = await getOrRegisterServiceWorker();
    if (!registration) {
      throw new Error("Service worker is not available.");
    }

    const preferences = await fetchPushPreferences();
    if (!preferences.isConfigured || !preferences.vapidPublicKey) {
      throw new Error("Push notifications are not configured on the server.");
    }

    let permission = Notification.permission;
    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      dispatch(
        setPushState({
          pushSupported: true,
          pushPermission: permission,
          isPushConfigured: preferences.isConfigured,
          isPushSubscribed: false,
          vapidPublicKey: preferences.vapidPublicKey,
        }),
      );
      throw new Error("Push notification permission was not granted.");
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toApplicationServerKey(preferences.vapidPublicKey),
      });
    }

    await upsertPushSubscription(subscription);
    const refreshedPreferences = await fetchPushPreferences();
    dispatch(
      setPushState({
        pushSupported: true,
        pushPermission: permission,
        isPushConfigured: refreshedPreferences.isConfigured,
        isPushSubscribed: refreshedPreferences.isSubscribed,
        vapidPublicKey: refreshedPreferences.vapidPublicKey,
      }),
    );
  };

  const unsubscribeFromPush = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const registration = await getOrRegisterServiceWorker();
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
      const payload = parseSubscription(subscription);
      try {
        await subscription.unsubscribe();
      } catch {
        // Ignore browser unsubscribe failures and still clear server record.
      }

      await instance.post(`${ENDPOINT}/RemovePushSubscription`, {
        endpoint: payload.endpoint,
      });
    }

    const refreshedPreferences = await fetchPushPreferences();
    dispatch(
      setPushState({
        pushSupported: true,
        pushPermission:
          typeof Notification === "undefined" ? "default" : Notification.permission,
        isPushConfigured: refreshedPreferences.isConfigured,
        isPushSubscribed: refreshedPreferences.isSubscribed,
        vapidPublicKey: refreshedPreferences.vapidPublicKey,
      }),
    );
  };

  return (
    <NotificationStateContext.Provider value={state}>
      <NotificationActionContext.Provider
        value={{
          fetchNotifications,
          markNotificationAsRead,
          markAllNotificationsAsRead,
          initializePushChannel,
          subscribeToPush,
          unsubscribeFromPush,
        }}
      >
        {children}
      </NotificationActionContext.Provider>
    </NotificationStateContext.Provider>
  );
};

export const useNotificationState = () => {
  return useContext(NotificationStateContext);
};

export const useNotificationAction = () => {
  return useContext(NotificationActionContext);
};

export { readApiError };
