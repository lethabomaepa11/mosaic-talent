"use client";

import { PropsWithChildren } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { AntdProvider } from "./antd-provider";
import { AntdToastViewport } from "./antd-toast";

export { toast } from "./antd-toast";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AntdProvider>
      <AuthProvider>
        <AntdToastViewport />
        {children}
      </AuthProvider>
    </AntdProvider>
  );
}

