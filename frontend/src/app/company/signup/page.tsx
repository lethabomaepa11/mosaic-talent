"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppOperatorPanel } from "@/components/app-operator";
import { Button, Divider, Input, Upload } from "antd";
import { toast } from "@/components/providers";
import {
  useCompanyAccountAction,
  useCompanyAccountState,
} from "@/providers/company-account-provider";
import { uploadPublicFile } from "@/utils/fileUpload";
import { buildCompanyLoginUrl } from "./buildCompanyLoginUrl";
import { useStyles } from "./style";

const CompanySignupPage = () => {
  const [companyName, setCompanyName] = useState("");
  const [companyLogoStoredFileId, setCompanyLogoStoredFileId] = useState("");
  const [companyLogoPreviewUrl, setCompanyLogoPreviewUrl] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerSurname, setOwnerSurname] = useState("");
  const [ownerUserName, setOwnerUserName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const { styles } = useStyles();
  const { createCompanyAccount } = useCompanyAccountAction();
  const { isError, isSuccess, isPending, tenancyName } = useCompanyAccountState();

  useEffect(() => {
    if (isSuccess && tenancyName) {
      toast.success("Company account created", "Use your tenant subdomain to sign in.");
    }
  }, [isSuccess, tenancyName]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !companyName ||
      !companyEmail ||
      !ownerName ||
      !ownerSurname ||
      !ownerUserName ||
      !ownerEmail ||
      !ownerPassword
    ) {
      toast.error("Missing fields", "Complete all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCompanyAccount({
        name: companyName,
        logoStoredFileId: companyLogoStoredFileId || undefined,
        website: companyWebsite || undefined,
        email: companyEmail,
        accountOwnerName: ownerName,
        accountOwnerSurname: ownerSurname,
        accountOwnerUserName: ownerUserName,
        accountOwnerEmailAddress: ownerEmail,
        accountOwnerPassword: ownerPassword,
      });
      const resolvedTenancyName = result?.tenancyName;

      if (resolvedTenancyName) {
        window.location.href = buildCompanyLoginUrl({
          tenancyName: resolvedTenancyName,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          port: window.location.port,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompanyLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);

    try {
      const uploaded = await uploadPublicFile(file, "company-logos");
      setCompanyLogoStoredFileId(uploaded.url);
      setCompanyLogoPreviewUrl(uploaded.url);
      toast.success("Logo uploaded", "Logo is ready for registration.");
    } catch {
      toast.error("Upload failed", "Unable to upload company logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Create Company Account</h1>
          <p className={styles.subtitle}>
            Register your company tenant and create the first Admin account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.sectionTitle}>Company details</h2>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="companyName" className={styles.label}>
                  Company Name
                </label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className={styles.input}
                  placeholder="Acme Labs"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="companyEmail" className={styles.label}>
                  Company Email
                </label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyEmail}
                  onChange={(event) => setCompanyEmail(event.target.value)}
                  className={styles.input}
                  placeholder="hello@acmelabs.com"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="companyWebsite" className={styles.label}>
                  Website
                </label>
                <Input
                  id="companyWebsite"
                  value={companyWebsite}
                  onChange={(event) => setCompanyWebsite(event.target.value)}
                  className={styles.input}
                  placeholder="https://acmelabs.com"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="companyLogoStoredFileId" className={styles.label}>
                  Company Logo
                </label>
                <div className={styles.uploadActions}>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleCompanyLogoUpload(file);
                      return false;
                    }}
                  >
                    <Button loading={isUploadingLogo} block>
                      Upload Logo
                    </Button>
                  </Upload>
                  {companyLogoPreviewUrl ? (
                    <img
                      src={companyLogoPreviewUrl}
                      alt="Company logo preview"
                      className={styles.logoPreview}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <Divider />

            <h2 className={styles.sectionTitle}>Account owner</h2>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="ownerName" className={styles.label}>
                  Name
                </label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  className={styles.input}
                  placeholder="For example, Lerato"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="ownerSurname" className={styles.label}>
                  Surname
                </label>
                <Input
                  id="ownerSurname"
                  value={ownerSurname}
                  onChange={(event) => setOwnerSurname(event.target.value)}
                  className={styles.input}
                  placeholder="For example, Dlamini"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="ownerUserName" className={styles.label}>
                  Username
                </label>
                <Input
                  id="ownerUserName"
                  value={ownerUserName}
                  onChange={(event) => setOwnerUserName(event.target.value)}
                  className={styles.input}
                  autoComplete="username"
                  placeholder="For example, lerato.dlamini"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="ownerEmail" className={styles.label}>
                  Email
                </label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  className={styles.input}
                  autoComplete="email"
                  placeholder="lerato@acmelabs.com"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="ownerPassword" className={styles.label}>
                Password
              </label>
              <Input.Password
                id="ownerPassword"
                value={ownerPassword}
                onChange={(event) => setOwnerPassword(event.target.value)}
                className={styles.input}
                autoComplete="new-password"
                placeholder="Choose a strong password"
              />
            </div>

            {isError ? (
              <div className={styles.statusError}>
                Unable to create company account. Tenancy name may already exist.
              </div>
            ) : null}

            {isSuccess && tenancyName ? (
              <div className={styles.statusSuccess}>
                Tenant created: <strong>{tenancyName}</strong>
              </div>
            ) : null}

            <div className={styles.actions}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting || isPending}
                block
              >
                Create Company Account
                <ArrowRight size={16} className={styles.buttonIconEnd} />
              </Button>
              <div className={styles.helper}>
                Already have a company account? <Link href="/company/login">Sign in</Link>
              </div>
              <div className={styles.helper}>
                Personal account? <Link href="/login">Go to developer sign in</Link>
              </div>
            </div>
        </form>
      </div>
      <AppOperatorPanel />
    </div>
  );
};

export default CompanySignupPage;
