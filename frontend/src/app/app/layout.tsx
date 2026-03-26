"use client";

import { PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuthState } from "@/providers/auth-provider";
import { useDeveloperAction } from "@/providers/developer-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { getAuthToken } from "@/utils/axiosInstance";
import { useStyles } from "./style";

const DeveloperLayout = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const { styles } = useStyles();
  const { isAuthenticated } = useAuthState();
  const { tenancyName } = useTenantResolutionState();
  const { fetchCurrentUser, fetchMyProfile } = useDeveloperAction();
  const hasToken = Boolean(getAuthToken());

  useEffect(() => {
    if (!isAuthenticated && !hasToken) {
      router.push("/login");
    }
  }, [hasToken, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && tenancyName) {
      router.replace("/company");
    }
  }, [isAuthenticated, router, tenancyName]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    fetchCurrentUser();
    fetchMyProfile();
  }, [isAuthenticated]);

  if (!isAuthenticated && hasToken) {
    return (
      <div className={styles.loadingState}>
        Restoring your session...
      </div>
    );
  }

  if (isAuthenticated && tenancyName) {
    return (
      <div className={styles.loadingState}>
        Redirecting to company dashboard...
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <AppSidebar />
      <div className={styles.main}>
        <AppHeader />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
};

export default DeveloperLayout;
