"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, Select, Space, Spin, Switch, Typography, Input } from "antd";
import { toast } from "@/components/providers";
import { useJobAction, useJobState } from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

interface IEmailTemplateSettings {
  applicationReceived: {
    enabled: boolean;
    mode: "manual" | "ai";
    subject: string;
    body: string;
  };
}

const parseEmailTemplateSettings = (json?: string): IEmailTemplateSettings => {
  const fallback: IEmailTemplateSettings = {
    applicationReceived: {
      enabled: true,
      mode: "manual",
      subject: "Application received for {jobTitle}",
      body: "Hi {candidateName},\n\nThanks for applying to {companyName} for {jobTitle}. We received your application and our team will review it soon.\n\nRegards,\n{companyName} Team",
    },
  };
  if (!json) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(json) as Partial<IEmailTemplateSettings>;
    const item = parsed.applicationReceived;
    if (!item) {
      return fallback;
    }
    return {
      applicationReceived: {
        enabled: item.enabled ?? fallback.applicationReceived.enabled,
        mode: item.mode === "ai" ? "ai" : "manual",
        subject: item.subject || fallback.applicationReceived.subject,
        body: item.body || fallback.applicationReceived.body,
      },
    };
  } catch {
    return fallback;
  }
};

const EmailTemplatesPage = () => {
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const { publicJobsPage, isPending } = useJobState();
  const { getMyJobsPageSettings, updateMyJobsPageSettings } = useJobAction();
  const [saving, setSaving] = useState(false);
  const [emailSettings, setEmailSettings] = useState<IEmailTemplateSettings>(
    parseEmailTemplateSettings(),
  );

  useEffect(() => {
    if (tenancyName) {
      void getMyJobsPageSettings();
    }
  }, [tenancyName]);

  useEffect(() => {
    if (!publicJobsPage) {
      return;
    }
    setEmailSettings(parseEmailTemplateSettings(publicJobsPage.emailTemplateSettingsJson));
  }, [publicJobsPage?.emailTemplateSettingsJson]);

  const tokens = useMemo(
    () => ["{candidateName}", "{jobTitle}", "{companyName}", "{matchScore}", "{verdict}"],
    [],
  );

  const handleSave = async () => {
    if (!publicJobsPage) {
      return;
    }

    setSaving(true);
    try {
      await updateMyJobsPageSettings({
        heroTitle: publicJobsPage.heroTitle,
        heroSubtitle: publicJobsPage.heroSubtitle,
        heroImageUrl: publicJobsPage.heroImageUrl,
        primaryColor: publicJobsPage.primaryColor,
        layoutJson: publicJobsPage.layoutJson,
        applicationFormJson: publicJobsPage.applicationFormJson,
        emailTemplateSettingsJson: JSON.stringify(emailSettings),
      });
      toast.success("Saved", "Email templates updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update email templates.";
      toast.error("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  if (!tenancyName) {
    return <Empty description="Email templates are available in company workspaces only." />;
  }

  if (isPending && !publicJobsPage) {
    return (
      <div className={styles.loaderWrap}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div>
        <Typography.Title level={2} className={styles.title}>
          Email Templates
        </Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>
          Configure applicant communication templates and AI generation mode.
        </Typography.Paragraph>
      </div>

      <Card title="Application Received Email">
        <Space direction="vertical" size={12} className={styles.fullWidth}>
          <div className={styles.switchRow}>
            <Typography.Text>Enable this email type</Typography.Text>
            <Switch
              checked={emailSettings.applicationReceived.enabled}
              onChange={(checked) =>
                setEmailSettings((prev) => ({
                  ...prev,
                  applicationReceived: { ...prev.applicationReceived, enabled: checked },
                }))
              }
            />
          </div>

          <div>
            <Typography.Text type="secondary">Generation Mode</Typography.Text>
            <Select
              className={styles.fullWidth}
              value={emailSettings.applicationReceived.mode}
              options={[
                { label: "Manual Template", value: "manual" },
                { label: "AI Generated Body", value: "ai" },
              ]}
              onChange={(value: "manual" | "ai") =>
                setEmailSettings((prev) => ({
                  ...prev,
                  applicationReceived: { ...prev.applicationReceived, mode: value },
                }))
              }
            />
          </div>

          <div>
            <Typography.Text type="secondary">Subject</Typography.Text>
            <Input
              value={emailSettings.applicationReceived.subject}
              onChange={(event) =>
                setEmailSettings((prev) => ({
                  ...prev,
                  applicationReceived: { ...prev.applicationReceived, subject: event.target.value },
                }))
              }
            />
          </div>

          <div>
            <Typography.Text type="secondary">Body Template</Typography.Text>
            <Input.TextArea
              rows={8}
              value={emailSettings.applicationReceived.body}
              onChange={(event) =>
                setEmailSettings((prev) => ({
                  ...prev,
                  applicationReceived: { ...prev.applicationReceived, body: event.target.value },
                }))
              }
            />
          </div>

          <div>
            <Typography.Text type="secondary">Supported tokens:</Typography.Text>
            <div className={styles.tokenWrap}>
              {tokens.map((token) => (
                <code key={token} className={styles.token}>
                  {token}
                </code>
              ))}
            </div>
          </div>

          <Button type="primary" loading={saving} onClick={() => void handleSave()}>
            Save Email Templates
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default EmailTemplatesPage;
