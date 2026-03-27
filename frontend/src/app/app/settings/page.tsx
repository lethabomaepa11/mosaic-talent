"use client";

import Link from "next/link";
import { Building2, FileCog, Mail } from "lucide-react";
import { Card, Col, Empty, Row, Typography } from "antd";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

const settingsOptions = [
  {
    key: "company-details",
    title: "Company Details",
    description: "Update company name, website, contact email, and logo.",
    href: "/app/settings/company-details",
    icon: Building2,
  },
  {
    key: "page-builder",
    title: "Build Pages",
    description: "Design your public jobs page with the drag-and-drop builder.",
    href: "/app/settings/page-builder",
    icon: FileCog,
  },
  {
    key: "email-templates",
    title: "Manage Email Templates",
    description: "Configure applicant emails and choose manual or AI generation.",
    href: "/app/settings/email-templates",
    icon: Mail,
  },
];

const SettingsPage = () => {
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();

  if (!tenancyName) {
    return <Empty description="Settings options are available in company workspaces." />;
  }

  return (
    <div className={styles.page}>
      <div>
        <Typography.Title level={2} className={styles.title}>
          Settings
        </Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>
          Choose what you want to configure.
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {settingsOptions.map((option) => (
          <Col xs={24} md={12} xl={8} key={option.key}>
            <Link href={option.href} className={styles.cardLink}>
              <Card className={styles.optionCard}>
                <div className={styles.optionHeader}>
                  <option.icon size={20} />
                  <Typography.Title level={4} className={styles.optionTitle}>
                    {option.title}
                  </Typography.Title>
                </div>
                <Typography.Paragraph className={styles.optionDescription}>
                  {option.description}
                </Typography.Paragraph>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SettingsPage;
