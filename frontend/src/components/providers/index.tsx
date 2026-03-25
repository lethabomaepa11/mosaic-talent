"use client";

import { PropsWithChildren } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { DeveloperOnboardingProvider } from "@/providers/developer-onboarding-provider";
import { AntdProvider } from "./antd-provider";
import { AntdToastViewport } from "./antd-toast";

export { toast } from "./antd-toast";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <DeveloperOnboardingProvider>
        <AntdProvider>
          <AntdToastViewport />
          {children}
        </AntdProvider>
      </DeveloperOnboardingProvider>
    </AuthProvider>
  );
}
