"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Col, Row, Statistic, Typography } from "antd";
import { CompanyHeader, CompanySidebar } from "@/components/company";
import { useAuthState } from "@/providers/auth-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

const CompanyDashboardPage = () => {
  const router = useRouter();
  const { styles } = useStyles();
  const { isAuthenticated } = useAuthState();
  const { tenancyName, companyName } = useTenantResolutionState();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/company/login");
      return;
    }

    if (!tenancyName) {
      router.replace("/app");
    }
  }, [isAuthenticated, router, tenancyName]);

  if (!isAuthenticated || !tenancyName) {
    return <div className={styles.loadingState}>Preparing company dashboard...</div>;
  }

  return (
    <div className={styles.shell}>
      <CompanySidebar />
      <div className={styles.main}>
        <CompanyHeader />
        <div className={styles.content}>
          <Typography.Title level={3} className={styles.pageTitle}>
            {companyName || tenancyName} Dashboard
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            Company workspace loaded via tenant subdomain.
          </Typography.Paragraph>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic title="Open Jobs" value={0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic title="Active Candidates" value={0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic title="Pending Reviews" value={0} />
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboardPage;
