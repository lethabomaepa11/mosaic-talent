"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect } from "react";
import { notification } from "antd";

type ToastInput = {
  message: ReactNode;
  description?: ReactNode;
  duration?: number;
};

type ToastLevel = "success" | "info" | "warning" | "error";

type NotificationApi = ReturnType<typeof notification.useNotification>[0];

let toastApi: NotificationApi | null = null;

const toastStyle: CSSProperties = {
  background: "rgba(240,237,230,0.04)",
  border: "1px solid rgba(240,237,230,0.1)",
  color: "#F0EDE6",
  backdropFilter: "blur(8px)",
};

function notify(type: ToastLevel, input: ToastInput) {
  if (!toastApi) {
    return;
  }

  toastApi[type]({
    message: input.message,
    description: input.description,
    duration: input.duration ?? 4,
    placement: "bottomRight",
    style: toastStyle,
  });
}

export const toast = {
  success: (message: ReactNode, description?: ReactNode, duration?: number) =>
    notify("success", { message, description, duration }),
  info: (message: ReactNode, description?: ReactNode, duration?: number) =>
    notify("info", { message, description, duration }),
  warning: (message: ReactNode, description?: ReactNode, duration?: number) =>
    notify("warning", { message, description, duration }),
  error: (message: ReactNode, description?: ReactNode, duration?: number) =>
    notify("error", { message, description, duration }),
};

export function AntdToastViewport() {
  const [api, contextHolder] = notification.useNotification({
    placement: "bottomRight",
    maxCount: 4,
    stack: { threshold: 4 },
  });

  useEffect(() => {
    toastApi = api;

    return () => {
      toastApi = null;
    };
  }, [api]);

  return contextHolder;
}

