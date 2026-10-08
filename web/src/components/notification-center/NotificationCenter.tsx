"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Divider, Drawer, Empty, List, Tag, Typography } from "antd";
import { Bell, BellOff, CheckCheck, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/providers/antd-toast";
import { useAuthState } from "@/providers/auth-provider";
import {
  readApiError,
  useNotificationAction,
  useNotificationState,
} from "@/providers/notification-provider";
import { useStyles } from "./styles";

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type INotificationCenterProps = {
  buttonAriaLabel: string;
};

const formatDate = (isoValue: string) => {
  const value = new Date(isoValue);
  if (!Number.isFinite(value.getTime())) {
    return "Unknown date";
  }

  return value.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const severityColor = (severity: string) => {
  const normalized = severity.trim().toLowerCase();
  switch (normalized) {
    case "success":
      return "green";
    case "warn":
    case "warning":
      return "gold";
    case "error":
      return "red";
    default:
      return "blue";
  }
};

const detectStandalone = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );

  return mediaStandalone || navigatorStandalone;
};

const toErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return readApiError(error, fallback);
};

const getNotificationUrl = (jsonData?: string) => {
  if (!jsonData || !jsonData.trim()) {
    return "";
  }

  const readUrlValue = (value: unknown) => {
    if (typeof value !== "string") {
      return "";
    }
    return value.trim();
  };

  try {
    const parsed = JSON.parse(jsonData) as Record<string, unknown>;
    const directUrl = readUrlValue(parsed.url) || readUrlValue(parsed.Url);
    if (directUrl) {
      return directUrl;
    }

    const nested = parsed.properties;
    if (nested && typeof nested === "object") {
      const nestedRecord = nested as Record<string, unknown>;
      return readUrlValue(nestedRecord.url) || readUrlValue(nestedRecord.Url);
    }

    return "";
  } catch {
    return "";
  }
};

export const NotificationCenter = ({ buttonAriaLabel }: INotificationCenterProps) => {
  const router = useRouter();
  const { styles } = useStyles();
  const { isAuthenticated } = useAuthState();
  const state = useNotificationState();
  const {
    fetchNotifications,
    initializePushChannel,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    subscribeToPush,
    unsubscribeFromPush,
  } = useNotificationAction();

  const [open, setOpen] = useState(false);
  const [isPushBusy, setIsPushBusy] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  const unread = state.unreadCount;
  const canInstall = Boolean(deferredPrompt) && !isStandalone;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void initializePushChannel().catch(() => undefined);
    void fetchNotifications({ skipCount: 0, maxResultCount: 20 }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setIsStandalone(detectStandalone());

    const ua = window.navigator.userAgent ?? "";
    setIsIos(/iPad|iPhone|iPod/i.test(ua));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      toast.success("App installed", "Mosaic Talent is now installed on this device.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const pushButton = useMemo(() => {
    if (!state.pushSupported) {
      return {
        label: "Push unsupported",
        disabled: true,
        icon: <BellOff size={14} />,
      };
    }

    if (!state.isPushConfigured) {
      return {
        label: "Push unavailable",
        disabled: true,
        icon: <BellOff size={14} />,
      };
    }

    if (state.isPushSubscribed) {
      return {
        label: "Disable push",
        disabled: false,
        icon: <BellOff size={14} />,
      };
    }

    return {
      label: "Enable push",
      disabled: false,
      icon: <Bell size={14} />,
    };
  }, [state.isPushConfigured, state.isPushSubscribed, state.pushSupported]);

  const openDrawer = () => {
    setOpen(true);
    if (isAuthenticated) {
      void fetchNotifications({ skipCount: 0, maxResultCount: 20 }).catch(() => undefined);
    }
  };

  const handlePushToggle = async () => {
    if (isPushBusy || !isAuthenticated || pushButton.disabled) {
      return;
    }

    setIsPushBusy(true);
    try {
      if (state.isPushSubscribed) {
        await unsubscribeFromPush();
        toast.info("Push disabled", "You will no longer receive browser push alerts.");
      } else {
        await subscribeToPush();
        toast.success("Push enabled", "You will now receive browser push alerts.");
      }
    } catch (error) {
      toast.error(toErrorMessage(error, "Unable to update push notification preference."));
    } finally {
      setIsPushBusy(false);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt || isStandalone) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      toast.error(toErrorMessage(error, "Unable to mark all notifications as read."));
    }
  };

  const handleOpenNotification = async (notificationId: string, isRead: boolean, url: string) => {
    if (!url) {
      return;
    }

    try {
      if (!isRead) {
        await markNotificationAsRead(notificationId);
      }
    } catch (error) {
      toast.error(toErrorMessage(error, "Unable to open notification."));
      return;
    }

    setOpen(false);
    if (url.startsWith("/")) {
      router.push(url);
      return;
    }

    window.location.assign(url);
  };

  const renderContent = () => {
    if (!state.hasLoaded && state.isPending) {
      return <Typography.Paragraph className={styles.hintText}>Loading notifications...</Typography.Paragraph>;
    }

    if (state.items.length === 0) {
      return <Empty description="No notifications yet." />;
    }

    return (
      <List
        dataSource={state.items}
        renderItem={(item) => {
          const url = getNotificationUrl(item.data);
          return (
            <List.Item
              key={item.id}
              actions={[
                !item.isRead ? (
                  <Button
                    key={`read-${item.id}`}
                    type="link"
                    size="small"
                    onClick={async () => {
                      try {
                        await markNotificationAsRead(item.id);
                      } catch (error) {
                        toast.error(toErrorMessage(error, "Unable to mark notification as read."));
                      }
                    }}
                  >
                    Mark read
                  </Button>
                ) : null,
                url ? (
                  <Button
                    key={`open-${item.id}`}
                    type="link"
                    size="small"
                    onClick={() => {
                      void handleOpenNotification(item.id, item.isRead, url);
                    }}
                  >
                    Open
                  </Button>
                ) : null,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <Typography.Paragraph className={styles.itemMessage}>
                    {item.message}
                  </Typography.Paragraph>
                }
                description={
                  <div className={styles.itemActions}>
                    <Tag className={styles.severityTag} color={severityColor(item.severity)}>
                      {item.severity}
                    </Tag>
                    <Typography.Paragraph className={styles.itemMeta}>
                      {formatDate(item.creationTime)}
                    </Typography.Paragraph>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    );
  };

  return (
    <>
      <Badge count={unread} size="small">
        <Button
          type="text"
          shape="circle"
          icon={<Bell size={18} />}
          className={styles.triggerButton}
          aria-label={buttonAriaLabel}
          onClick={openDrawer}
        />
      </Badge>
      <Drawer
        title="Notifications & Channels"
        placement="right"
        width={420}
        onClose={() => setOpen(false)}
        open={open}
        extra={
          <Button
            size="small"
            icon={<CheckCheck size={14} />}
            disabled={state.unreadCount === 0}
            onClick={() => {
              void handleMarkAll();
            }}
          >
            Mark all
          </Button>
        }
      >
        <div className={styles.drawerBody}>
          <div className={styles.topActions}>
            <Button
              icon={pushButton.icon}
              loading={isPushBusy}
              disabled={pushButton.disabled || !isAuthenticated}
              onClick={() => {
                void handlePushToggle();
              }}
            >
              {pushButton.label}
            </Button>
            <Button
              icon={<Download size={14} />}
              disabled={!canInstall}
              onClick={() => {
                void handleInstall();
              }}
            >
              Install app
            </Button>
            <Button
              icon={<Download size={14} />}
              onClick={() => {
                window.open("/mosaictalent.apk", "_blank");
              }}
            >
              Install mobile app
            </Button>
          </div>

          {!canInstall && !isStandalone && isIos ? (
            <Typography.Paragraph className={styles.hintText}>
              On iOS, open Safari share menu and choose Add to Home Screen.
            </Typography.Paragraph>
          ) : null}

          {state.pushSupported && state.isPushConfigured && state.pushPermission !== "granted" ? (
            <Typography.Paragraph className={styles.hintText}>
              Enable browser notification permission to receive push alerts.
            </Typography.Paragraph>
          ) : null}

          <Divider />
          {renderContent()}
        </div>
      </Drawer>
    </>
  );
};
