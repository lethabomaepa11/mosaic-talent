"use client";

import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";
import { CompanyReportsDashboard } from "@/components/company/reports-dashboard";
import { DeveloperHome } from "@/components/journey/DeveloperHome";

const AppEntryPage = () => {
  const { styles } = useStyles();
  const { tenancyName, isResolved } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);

  if (!isResolved) {
    return <div className={styles.loadingState}>Preparing dashboard...</div>;
  }

  if (!isCompanyTenant) {
    return <DeveloperHome />;
  }

  return (
    <div data-ai-page="dashboard">
      <CompanyReportsDashboard />
    </div>
  );
};

export default AppEntryPage;
