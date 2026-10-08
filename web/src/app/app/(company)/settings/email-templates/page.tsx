"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, Select, Space, Spin, Switch, Typography, Input } from "antd";
import { toast } from "@/components/providers";
import { useJobAction, useJobState } from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";
import {
  EMAIL_TEMPLATE_TYPE_OPTIONS,
  EmailTemplateTypeKey,
  getDefaultEmailTemplateSettings,
  parseEmailTemplateSettings,
} from "./emailTemplateSettings";

const EmailTemplatesPage = () => {
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const { publicJobsPage, isPending } = useJobState();
  const { getMyJobsPageSettings, updateMyJobsPageSettings } = useJobAction();
  const [saving, setSaving] = useState(false);
  const [activeTemplateKey, setActiveTemplateKey] =
    useState<EmailTemplateTypeKey>("applicationReceived");
  const [emailSettings, setEmailSettings] = useState(
    getDefaultEmailTemplateSettings(),
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
    () => [
      "{candidateName}",
      "{jobTitle}",
      "{companyName}",
      "{matchScore}",
      "{verdict}",
      "{assessmentLink}",
    ],
    [],
  );
  const activeTemplate = emailSettings[activeTemplateKey];
  const activeTemplateMeta = EMAIL_TEMPLATE_TYPE_OPTIONS.find(
    (item) => item.key === activeTemplateKey,
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
    <div className={styles.page} data-ai-page="settings-email-templates">
      <div>
        <Typography.Title level={2} className={styles.title}>
          Email Templates
        </Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>
          Configure communication templates per hiring stage and AI generation mode.
        </Typography.Paragraph>
      </div>

      <div className={styles.contentGrid}>
        <Card title="Email Types" className={styles.typesCard}>
          <Space direction="vertical" size={8} className={styles.fullWidth}>
            {EMAIL_TEMPLATE_TYPE_OPTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.typeButton} ${
                  activeTemplateKey === item.key ? styles.typeButtonActive : ""
                }`}
                onClick={() => setActiveTemplateKey(item.key)}
              >
                <Typography.Text strong>{item.label}</Typography.Text>
                <Typography.Text type="secondary">{item.description}</Typography.Text>
              </button>
            ))}
          </Space>
        </Card>

        <Card title={activeTemplateMeta?.label ?? "Email Template"}>
          <Space direction="vertical" size={12} className={styles.fullWidth}>
            {activeTemplateMeta ? (
              <Typography.Text type="secondary">
                {activeTemplateMeta.description}
              </Typography.Text>
            ) : null}

          <div className={styles.switchRow}>
            <Typography.Text>Enable this email type</Typography.Text>
            <Switch
              checked={activeTemplate.enabled}
              onChange={(checked) =>
                setEmailSettings((prev) => ({
                  ...prev,
                  [activeTemplateKey]: {
                    ...prev[activeTemplateKey],
                    enabled: checked,
                  },
                }))
              }
              data-ai-field="email-template-enabled"
            />
          </div>

          <div>
            <Typography.Text type="secondary">Generation Mode</Typography.Text>
            <Select
              className={styles.fullWidth}
              value={activeTemplate.mode}
              options={[
                { label: "Manual Template", value: "manual" },
                { label: "AI Generated Body", value: "ai" },
              ]}
              onChange={(value: "manual" | "ai") =>
                setEmailSettings((prev) => ({
                  ...prev,
                  [activeTemplateKey]: {
                    ...prev[activeTemplateKey],
                    mode: value,
                  },
                }))
              }
              data-ai-field="email-template-mode"
            />
          </div>

          <div>
            <Typography.Text type="secondary">Subject</Typography.Text>
            <Input
              value={activeTemplate.subject}
              onChange={(event) =>
                setEmailSettings((prev) => ({
                  ...prev,
                  [activeTemplateKey]: {
                    ...prev[activeTemplateKey],
                    subject: event.target.value,
                  },
                }))
              }
              data-ai-field="email-template-subject"
            />
          </div>

          <div>
            <Typography.Text type="secondary">Body Template</Typography.Text>
            <Input.TextArea
              rows={8}
              value={activeTemplate.body}
              onChange={(event) =>
                setEmailSettings((prev) => ({
                  ...prev,
                  [activeTemplateKey]: {
                    ...prev[activeTemplateKey],
                    body: event.target.value,
                  },
                }))
              }
              data-ai-field="email-template-body"
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

          <Button
            type="primary"
            loading={saving}
            onClick={() => void handleSave()}
            data-ai-action="save-email-templates"
          >
            Save Email Templates
          </Button>
        </Space>
        </Card>
      </div>
    </div>
  );
};

export default EmailTemplatesPage;
