"use client";

import { PropsWithChildren, useEffect } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { CompanyAccountProvider } from "@/providers/company-account-provider";
import { CompanyProfileProvider } from "@/providers/company-profile-provider";
import { DeveloperProvider } from "@/providers/developer-provider";
import { ProjectProvider } from "@/providers/project-provider";
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
            <CompanyProfileProvider>
              <DeveloperProvider>
                <ProjectProvider>
                  <AntdProvider>
                    <AntdToastViewport />
                    {children}
                  </AntdProvider>
                </ProjectProvider>
              </DeveloperProvider>
            </CompanyProfileProvider>
          </AuthProvider>
        </CompanyAccountProvider>
      </TenantBootstrap>
    </TenantResolutionProvider>
  );
}
