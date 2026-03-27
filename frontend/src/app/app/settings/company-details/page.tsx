"use client";

import { useEffect, useState } from "react";
import { Button, Card, Empty, Input, Space, Spin, Typography, Upload } from "antd";
import { Plus } from "lucide-react";
import { toast } from "@/components/providers";
import { useCompanyAccountAction, useCompanyAccountState } from "@/providers/company-account-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { uploadFile } from "@/utils/fileUpload";
import { useStyles } from "./style";

const CompanyDetailsPage = () => {
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const { company, isPending } = useCompanyAccountState();
  const { fetchMyCompany, updateMyCompany } = useCompanyAccountAction();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    logoStoredFileId: "",
    website: "",
    email: "",
  });

  useEffect(() => {
    if (tenancyName) {
      void fetchMyCompany();
    }
  }, [tenancyName]);

  useEffect(() => {
    if (!company) {
      return;
    }

    setDraft({
      name: company.name ?? "",
      logoStoredFileId: company.logoStoredFileId ?? "",
      website: company.website ?? "",
      email: company.email ?? "",
    });
  }, [company]);

  const handleSave = async () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      toast.error("Missing fields", "Company name and email are required.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyCompany({
        name: draft.name.trim(),
        logoStoredFileId: draft.logoStoredFileId.trim(),
        website: draft.website.trim(),
        email: draft.email.trim(),
      });
      if (!updated) {
        throw new Error("Unable to update company details.");
      }
      toast.success("Saved", "Company details updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save company details.";
      toast.error("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const uploaded = await uploadFile(file, "company-logos");
      setDraft((prev) => ({ ...prev, logoStoredFileId: uploaded.url }));
      toast.success("Uploaded", "Logo uploaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload logo.";
      toast.error("Upload failed", message);
    } finally {
      setUploadingLogo(false);
    }
  };

  if (!tenancyName) {
    return <Empty description="Company details are available in company workspaces only." />;
  }

  if (isPending && !company) {
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
          Company Details
        </Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>
          Update your company profile and branding.
        </Typography.Paragraph>
      </div>

      <Card>
        <Space direction="vertical" size={12} className={styles.fullWidth}>
          <div>
            <Typography.Text type="secondary">Company Name</Typography.Text>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Company name"
            />
          </div>

          <div>
            <Typography.Text type="secondary">Company Email</Typography.Text>
            <Input
              value={draft.email}
              onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="hello@company.com"
            />
          </div>

          <div>
            <Typography.Text type="secondary">Website</Typography.Text>
            <Input
              value={draft.website}
              onChange={(event) => setDraft((prev) => ({ ...prev, website: event.target.value }))}
              placeholder="https://company.com"
            />
          </div>

          <div>
            <Typography.Text type="secondary">Logo URL</Typography.Text>
            <Input
              value={draft.logoStoredFileId}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, logoStoredFileId: event.target.value }))
              }
              placeholder="https://..."
            />
            <div className={styles.logoActions}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  void handleLogoUpload(file);
                  return false;
                }}
              >
                <Button loading={uploadingLogo} icon={<Plus size={14} />}>
                  Upload Logo
                </Button>
              </Upload>
              {draft.logoStoredFileId ? (
                <img src={draft.logoStoredFileId} alt="Company logo" className={styles.logoPreview} />
              ) : null}
            </div>
          </div>

          <Button type="primary" loading={saving} onClick={() => void handleSave()}>
            Save Company Details
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default CompanyDetailsPage;
