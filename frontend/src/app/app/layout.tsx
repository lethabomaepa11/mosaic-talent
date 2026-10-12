"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "antd";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { CompanyHeader, CompanySidebar } from "@/components/company";
import { MobileDeveloperNav } from "@/components/mobile-developer-nav";
import { AppOperatorPanel } from "@/components/app-operator";
import { useAuthState } from "@/providers/auth-provider";
import { useCompanyProfileAction } from "@/providers/company-profile-provider";
import { useDeveloperAction } from "@/providers/developer-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { getAuthToken } from "@/utils/axiosInstance";
import { useStyles } from "./style";

const DeveloperLayout = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const { styles } = useStyles();
  const { isAuthenticated, isPending } = useAuthState();
  const { fetchMyEmployeeProfile } = useCompanyProfileAction();
  const { tenancyName } = useTenantResolutionState();
  const { fetchCurrentUser, fetchMyProfile } = useDeveloperAction();
  const hasToken = Boolean(getAuthToken());
  const hasOAuthBootstrap =
    typeof window !== "undefined" &&
    window.location.hash.includes("oauthAccessToken=");
  const isCompanyTenant = Boolean(tenancyName);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !hasToken && !hasOAuthBootstrap && !isPending) {
      router.push("/login");
    }
  }, [hasOAuthBootstrap, hasToken, isAuthenticated, isPending, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (isCompanyTenant) {
      fetchMyEmployeeProfile();
      return;
    }

    fetchCurrentUser();
    fetchMyProfile();
  }, [isAuthenticated, isCompanyTenant]);

  if (!isAuthenticated && (hasToken || hasOAuthBootstrap || isPending)) {
    return (
      <div className={styles.loadingState}>
        Restoring your session...
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.desktopSidebar}>
        {isCompanyTenant ? (
          <CompanySidebar collapsed={isSidebarCollapsed} onCollapseToggle={() => setIsSidebarCollapsed((value) => !value)} />
        ) : (
          <AppSidebar collapsed={isSidebarCollapsed} onCollapseToggle={() => setIsSidebarCollapsed((value) => !value)} />
        )}
      </div>
      <div className={styles.main}>
        {isCompanyTenant ? (
          <CompanyHeader onMenuClick={() => setIsMenuOpen(true)} />
        ) : (
          <AppHeader onMenuClick={() => setIsMenuOpen(true)} />
        )}
        <main className={styles.content}>{children}</main>
        {!isCompanyTenant ? <MobileDeveloperNav /> : null}
      </div>
      <AppOperatorPanel />
      <Drawer
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        placement="left"
        width={280}
        className={styles.mobileDrawer}
      >
        {isCompanyTenant ? <CompanySidebar /> : <AppSidebar />}
      </Drawer>
    </div>
  );
};

export default DeveloperLayout;
