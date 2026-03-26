"use client";

import { PropsWithChildren, useEffect } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { CompanyAccountProvider } from "@/providers/company-account-provider";
import { DeveloperOnboardingProvider } from "@/providers/developer-onboarding-provider";
import {
  TenantResolutionProvider,
  useTenantResolutionAction,
} from "@/providers/tenant-provider";
import { AntdProvider } from "./antd-provider";
import { AntdToastViewport } from "./antd-toast";

export { toast } from "./antd-toast";

const TenantBootstrap = ({ children }: PropsWithChildren) => {
  const { resolveTenant } = useTenantResolutionAction();

  useEffect(() => {
    resolveTenant();
  }, []);

  return <>{children}</>;
};

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <TenantResolutionProvider>
      <TenantBootstrap>
        <CompanyAccountProvider>
          <AuthProvider>
            <DeveloperOnboardingProvider>
              <AntdProvider>
                <AntdToastViewport />
                {children}
              </AntdProvider>
            </DeveloperOnboardingProvider>
          </AuthProvider>
        </CompanyAccountProvider>
      </TenantBootstrap>
    </TenantResolutionProvider>
  );
}
