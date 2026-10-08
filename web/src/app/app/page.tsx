"use client";

import { useEffect } from "react";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";
import { useRouter } from "next/navigation";
import { CompanyReportsDashboard } from "@/components/company/reports-dashboard";

const AppEntryPage = () => {
  const { styles } = useStyles();
  const { tenancyName, isResolved } = useTenantResolutionState();
  const router = useRouter();
  const isCompanyTenant = Boolean(tenancyName);

  useEffect(() => {
    if (!isResolved || isCompanyTenant) {
      return;
    }

    router.replace("/app/projects/open");
  }, [isResolved, isCompanyTenant]);

  if (!isResolved) {
    return <div className={styles.loadingState}>Preparing dashboard...</div>;
  }

  if (!isCompanyTenant) {
    return null;
  }

  return (
    <div data-ai-page="dashboard">
      <CompanyReportsDashboard />
    </div>
  );
};

export default AppEntryPage;
