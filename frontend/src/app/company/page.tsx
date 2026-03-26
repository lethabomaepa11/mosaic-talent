"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/providers/auth-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

const CompanyDashboardPage = () => {
  const router = useRouter();
  const { styles } = useStyles();
  const { isAuthenticated } = useAuthState();
  const { tenancyName } = useTenantResolutionState();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/company/login");
      return;
    }

    if (!tenancyName) {
      router.replace("/app");
      return;
    }

    router.replace("/app");
  }, [isAuthenticated, router, tenancyName]);

  if (!isAuthenticated || !tenancyName) {
    return <div className={styles.loadingState}>Preparing dashboard...</div>;
  }

  return <div className={styles.loadingState}>Redirecting to /app...</div>;
};

export default CompanyDashboardPage;
