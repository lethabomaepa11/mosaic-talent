"use client";

import { Card, Col, Row, Statistic, Typography } from "antd";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";
import { useRouter } from "next/navigation";

const AppEntryPage = () => {
  const { styles } = useStyles();
  const { tenancyName, companyName, isResolved } = useTenantResolutionState();
  const router = useRouter();
  const isCompanyTenant = Boolean(tenancyName);

  if (!isResolved) {
    return <div className={styles.loadingState}>Preparing dashboard...</div>;
  }

  if (!isCompanyTenant) {
    router.push("/app/projects/open");
    return null;
  }

  return (
    <div className={styles.content} data-ai-page="dashboard">
      <Typography.Title level={3} className={styles.pageTitle}>
        {isCompanyTenant
          ? `${companyName || tenancyName} Dashboard`
          : "Developer Dashboard"}
      </Typography.Title>
      <Typography.Paragraph className={styles.subtitle}>
        {isCompanyTenant
          ? "Company workspace loaded via tenant subdomain."
          : "Developer workspace loaded for the default tenant."}
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={isCompanyTenant ? "Open Jobs" : "Active Projects"}
              value={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={isCompanyTenant ? "Active Candidates" : "Pending Reviews"}
              value={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={isCompanyTenant ? "Pending Reviews" : "AI Simulations"}
              value={0}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AppEntryPage;
