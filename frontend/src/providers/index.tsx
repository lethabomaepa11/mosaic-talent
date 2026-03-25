"use client";

import { PropsWithChildren } from "react";
import { AuthProvider } from "./auth-provider";
import { AntdProvider } from "./antd-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AntdProvider>
      <AuthProvider>{children}</AuthProvider>
    </AntdProvider>
  );
}
