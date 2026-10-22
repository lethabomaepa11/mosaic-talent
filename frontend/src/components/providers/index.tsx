"use client";

import { PropsWithChildren, useEffect } from "react";
import { AuthProvider } from "@/providers/auth-provider";
import {
  AppearanceProvider,
  useAppearanceAction,
} from "@/providers/appearance-provider";
import { CompanyAccountProvider } from "@/providers/company-account-provider";
import { CompanyProfileProvider } from "@/providers/company-profile-provider";
import { DeveloperProvider } from "@/providers/developer-provider";
import { ProjectProvider } from "@/providers/project-provider";
import { IdeatorProvider } from "@/providers/ideator-provider";
import { ProjectProgressProvider } from "@/providers/project-progress-provider";
import { JobProvider } from "@/providers/job-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { ReviewProvider } from "@/providers/review-provider";
import { AppOperatorProvider } from "@/providers/app-operator-provider";
import {
  TenantResolutionProvider,
  useTenantResolutionAction,
  useTenantResolutionState,
} from "@/providers/tenant-provider";
import { AntdProvider } from "./antd-provider";
import { AntdToastViewport } from "./antd-toast";
import { PageTransitionGate } from "@/components/page-transition";
import { ProgressProvider } from "@bprogress/next/app";

export { toast } from "./antd-toast";

const AppProgressProvider = ({ children }: PropsWithChildren) => {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return <>{children}</>;
  }

  return (
    <ProgressProvider
      height="3px"
      color="#D4AF37"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
};

const TenantBootstrap = ({ children }: PropsWithChildren) => {
  const { resolveTenant } = useTenantResolutionAction();

  useEffect(() => {
    resolveTenant();
  }, []);

  return <>{children}</>;
};

const AppearanceBootstrap = ({ children }: PropsWithChildren) => {
  const { hydrateMode } = useAppearanceAction();

  useEffect(() => {
    hydrateMode();
  }, []);

  return <>{children}</>;
};

const FaviconSync = () => {
  const { tenancyName, companyLogoUrl } = useTenantResolutionState();

  useEffect(() => {
    const baseHref =
      tenancyName && companyLogoUrl ? companyLogoUrl : "/logo.svg";
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
        <AuthProvider>
          <AppearanceProvider>
            <AppearanceBootstrap>
              <CompanyAccountProvider>
                <CompanyProfileProvider>
                  <DeveloperProvider>
                    <ProjectProvider>
                      <IdeatorProvider>
                      <ProjectProgressProvider>
                        <JobProvider>
                          <ReviewProvider>
                            <NotificationProvider>
                              <AppOperatorProvider>
                                <AppProgressProvider>
                                  <AntdProvider>
                                    <PageTransitionGate />
                                    <AntdToastViewport />
                                    {children}
                                  </AntdProvider>
                                </AppProgressProvider>
                              </AppOperatorProvider>
                            </NotificationProvider>
                          </ReviewProvider>
                        </JobProvider>
                      </ProjectProgressProvider>
                      </IdeatorProvider>
                    </ProjectProvider>
                  </DeveloperProvider>
                </CompanyProfileProvider>
              </CompanyAccountProvider>
            </AppearanceBootstrap>
          </AppearanceProvider>
        </AuthProvider>
      </TenantBootstrap>
    </TenantResolutionProvider>
  );
}
