"use client";

import { Typography } from "antd";
import { useStyles } from "./styles";

interface IJobsPageFooterProps {
  companyName: string;
  companyWebsiteUrl?: string;
  companyEmail?: string;
}

export const JobsPageFooter = ({
  companyName,
  companyWebsiteUrl,
  companyEmail,
}: IJobsPageFooterProps) => {
  const { styles } = useStyles();

  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        {companyWebsiteUrl ? (
          <a href={companyWebsiteUrl} target="_blank" rel="noreferrer" className={styles.link}>
            {companyWebsiteUrl}
          </a>
        ) : null}
        {companyEmail ? (
          <a href={`mailto:${companyEmail}`} className={styles.link}>
            {companyEmail}
          </a>
        ) : null}
      </div>
      <Typography.Paragraph className={styles.note}>
        © {new Date().getFullYear()} {companyName}. All rights reserved.
      </Typography.Paragraph>
    </footer>
  );
};

