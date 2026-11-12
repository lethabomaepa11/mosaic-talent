"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Divider, Drawer, Typography } from "antd";
import { Bell, CheckCheck, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/providers/antd-toast";
import { useAuthState } from "@/providers/auth-provider";
import {
  useNotificationAction,
  useNotificationState,
} from "@/providers/notification-provider";
import { useStyles } from "./styles";
import { NotificationList } from "./NotificationList";
import { detectStandalone, getPushButton, toErrorMessage } from "./helpers";

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
      toast.success("App installed", "mosaic.talent is now installed on this device.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const pushButton = getPushButton(state);

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
          <NotificationList onOpen={handleOpenNotification}/>
        </div>
      </Drawer>
    </>
  );
};
