"use client";

import { PropsWithChildren, useEffect } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { CompanyAccountProvider } from "@/providers/company-account-provider";
import { CompanyProfileProvider } from "@/providers/company-profile-provider";
import { DeveloperProvider } from "@/providers/developer-provider";
import { ProjectProvider } from "@/providers/project-provider";
import { JobProvider } from "@/providers/job-provider";
import { ReviewProvider } from "@/providers/review-provider";
import { SimulationProvider } from "@/providers/simulation-provider";
import { AppOperatorProvider } from "@/providers/app-operator-provider";
import {
  TenantResolutionProvider,
  useTenantResolutionAction,
  useTenantResolutionState,
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

const FaviconSync = () => {
  const { tenancyName, companyLogoUrl } = useTenantResolutionState();

  useEffect(() => {
    const baseHref = tenancyName && companyLogoUrl ? companyLogoUrl : "/logo.svg";
    const href = `${baseHref}${baseHref.includes("?") ? "&" : "?"}v=${Date.now()}`;
    const rels = ["icon", "shortcut icon", "apple-touch-icon"];

    rels.forEach((rel) => {
      let link = document.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    });
  }, [tenancyName, companyLogoUrl]);

  return null;
};

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <TenantResolutionProvider>
      <TenantBootstrap>
        <FaviconSync />
        <CompanyAccountProvider>
          <AuthProvider>
            <CompanyProfileProvider>
              <DeveloperProvider>
                <ProjectProvider>
                  <JobProvider>
                    <ReviewProvider>
                      <SimulationProvider>
                        <AppOperatorProvider>
                          <AntdProvider>
                            <AntdToastViewport />
                            {children}
                          </AntdProvider>
                        </AppOperatorProvider>
                      </SimulationProvider>
                    </ReviewProvider>
                  </JobProvider>
                </ProjectProvider>
              </DeveloperProvider>
            </CompanyProfileProvider>
          </AuthProvider>
        </CompanyAccountProvider>
      </TenantBootstrap>
    </TenantResolutionProvider>
  );
}
