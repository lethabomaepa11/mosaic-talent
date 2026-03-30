"use client";

import { Typography } from "antd";
import { Globe, Mail } from "lucide-react";
import { useStyles } from "./styles";

interface ICompanyPublicHeaderProps {
  companyName: string;
  companyLogoUrl?: string;
  companyWebsiteUrl?: string;
  companyEmail?: string;
  primaryColor?: string;
}

export const CompanyPublicHeader = ({
  companyName,
  companyLogoUrl,
  companyWebsiteUrl,
  companyEmail,
  primaryColor,
}: ICompanyPublicHeaderProps) => {
  const { styles } = useStyles();

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {companyLogoUrl ? (
          <img src={companyLogoUrl} alt={`${companyName} logo`} className={styles.logo} />
        ) : null}
        <Typography.Title level={5} className={styles.companyName}>
          {companyName}
        </Typography.Title>
      </div>
      <div className={styles.meta}>
        <span className={styles.metaLink}>
          <Globe size={14} />
          {companyWebsiteUrl || "Website not configured"}
        </span>
        <span className={styles.metaLink}>
          <Mail size={14} />
          {companyEmail || "Email not configured"}
        </span>
        <a
          href={companyEmail ? `mailto:${companyEmail}` : "#"}
          className={styles.contactButton}
          style={{
            backgroundColor: primaryColor || "#D4AF37",
            color: "#121212",
            pointerEvents: companyEmail ? "auto" : "none",
            opacity: companyEmail ? 1 : 0.7,
          }}
        >
          <Mail size={14} />
          Contact
        </a>
      </div>
    </header>
  );
};
