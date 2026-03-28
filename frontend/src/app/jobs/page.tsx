"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Space, Spin, Tag, Typography } from "antd";
import { ArrowRight, Briefcase, MapPin } from "lucide-react";
import { CompanyPublicHeader, JobsPageFooter } from "@/components/public-jobs";
import { useJobAction, useJobState } from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

interface IBuilderBlock {
  id?: string;
  type?: string;
  props?: Record<string, string>;
}

const JobsPage = () => {
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const { jobs, isPending, publicJobsPage } = useJobState();
  const { fetchOpenJobs, fetchPublicJobsPage } = useJobAction();
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([fetchOpenJobs(), fetchPublicJobsPage()]).finally(() => {
      setIsPageLoading(false);
    });
  }, []);

  const companyLabel = useMemo(() => {
    return tenancyName ? `${tenancyName} workspace` : "developer workspace";
  }, [tenancyName]);

  const layoutComponents = useMemo(() => {
    if (!publicJobsPage?.layoutJson) {
      return ["hero", "job-list", "cta"];
    }

    try {
      const parsed = JSON.parse(publicJobsPage.layoutJson) as {
        components?: string[];
        blocks?: Array<{ type?: string; props?: { imageUrl?: string } }>;
      };
      if (Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
        return parsed.blocks
          .map((block) => block.type || "")
          .filter((type) => type.length > 0);
      }
      if (Array.isArray(parsed.components) && parsed.components.length > 0) {
        return parsed.components;
      }
    } catch {
      return ["hero", "job-list", "cta"];
    }

    return ["hero", "job-list", "cta"];
  }, [publicJobsPage?.layoutJson]);

  const parsedBlocks = useMemo(() => {
    if (!publicJobsPage?.layoutJson) {
      return [] as IBuilderBlock[];
    }
    try {
      const parsed = JSON.parse(publicJobsPage.layoutJson) as {
        blocks?: IBuilderBlock[];
      };
      return Array.isArray(parsed.blocks) ? parsed.blocks : [];
    } catch {
      return [] as IBuilderBlock[];
    }
  }, [publicJobsPage?.layoutJson]);

  const renderedBlocks = useMemo(() => {
    if (parsedBlocks.length > 0) {
      return parsedBlocks;
    }
    return layoutComponents.map((type, index) => ({
      id: `${type}-${index}`,
      type,
      props: {},
    })) as IBuilderBlock[];
  }, [parsedBlocks, layoutComponents]);

  const bannerImageUrl = useMemo(() => {
    if (!publicJobsPage?.layoutJson) {
      return publicJobsPage?.heroImageUrl || "";
    }
    try {
      const parsed = JSON.parse(publicJobsPage.layoutJson) as {
        blocks?: Array<{ type?: string; props?: { imageUrl?: string } }>;
      };
      const imageBlock = parsed.blocks?.find((block) => block.type === "image");
      return imageBlock?.props?.imageUrl || publicJobsPage?.heroImageUrl || "";
    } catch {
      return publicJobsPage?.heroImageUrl || "";
    }
  }, [publicJobsPage?.layoutJson, publicJobsPage?.heroImageUrl]);

  if (isPageLoading) {
    return (
      <div className={styles.pageLoader}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <CompanyPublicHeader
        companyName={publicJobsPage?.companyName || companyLabel}
        companyLogoUrl={publicJobsPage?.companyLogoStoredFileId}
        companyWebsiteUrl={publicJobsPage?.companyWebsiteUrl}
        companyEmail={publicJobsPage?.companyEmail}
        primaryColor={publicJobsPage?.primaryColor}
      />

      {renderedBlocks.map((block, index) => {
        const blockType = block.type || "";

        if (blockType === "hero") {
          return (
            <div key={block.id || `hero-${index}`} className={styles.header}>
              <Typography.Title level={2} className={styles.title}>
                {block.props?.title || publicJobsPage?.heroTitle || "Open Jobs"}
              </Typography.Title>
              <Typography.Paragraph className={styles.subtitle}>
                {block.props?.subtitle ||
                  publicJobsPage?.heroSubtitle ||
                  `Showing open jobs for the current tenant (${companyLabel}).`}
              </Typography.Paragraph>
              {block.props?.imageUrl || publicJobsPage?.heroImageUrl ? (
                <img
                  src={block.props?.imageUrl || publicJobsPage?.heroImageUrl}
                  alt="Hero"
                  className={styles.heroImage}
                />
              ) : null}
            </div>
          );
        }

        if (blockType === "job-list") {
          const showCount = (block.props?.showCount ?? "true") !== "false";
          return (
            <section
              key={block.id || `job-list-${index}`}
              className={styles.section}
            >
              <Typography.Title level={3} className={styles.sectionTitle}>
                {block.props?.title || "Our Openings"}
              </Typography.Title>
              <Typography.Paragraph className={styles.subtitle}>
                {block.props?.subtitle || "Open positions"}
                {showCount ? ` • ${jobs.length} Open Positions` : ""}
              </Typography.Paragraph>

              {isPending && jobs.length === 0 ? <Spin /> : null}
              {!isPending && jobs.length === 0 ? (
                <Empty description="No open jobs right now." />
              ) : null}

              <div className={styles.list}>
                {jobs.map((job) => (
                  <article key={job.id} className={styles.jobItem}>
                    <div className={styles.cardHeader}>
                      <div>
                        <Typography.Title level={4}>
                          {job.title}
                        </Typography.Title>
                        <Space size={8} wrap>
                          <Typography.Text className={styles.iconText}>
                            <MapPin size={14} />
                            {job.location}
                          </Typography.Text>
                          <Typography.Text className={styles.iconText}>
                            <Briefcase size={14} />
                            {job.employmentType}
                          </Typography.Text>
                          {job.contractDuration ? (
                            <Tag>{job.contractDuration} months</Tag>
                          ) : null}
                        </Space>
                      </div>
                      <Tag color={job.isOpen ? "green" : "default"}>
                        {job.isOpen ? "Open" : "Closed"}
                      </Tag>
                    </div>

                    <Typography.Paragraph className={styles.description}>
                      {job.description}
                    </Typography.Paragraph>

                    <div className={styles.actions}>
                      <Link href={`/jobs/${job.id}`}>
                        <Button
                          type="primary"
                          icon={<ArrowRight size={14} />}
                          style={{
                            backgroundColor:
                              block.props?.backgroundColor ||
                              publicJobsPage?.primaryColor ||
                              undefined,
                            color: block.props?.textColor || "#121212",
                          }}
                        >
                          {block.props?.label || "Apply"}
                        </Button>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        }

        if (blockType === "text") {
          return (
            <section
              key={block.id || `text-${index}`}
              className={styles.section}
            >
              <Typography.Paragraph className={styles.multilineText}>
                {block.props?.content ||
                  "Add text content in the page builder."}
              </Typography.Paragraph>
            </section>
          );
        }

        if (blockType === "image") {
          const imageUrl = block.props?.imageUrl || bannerImageUrl;
          return imageUrl ? (
            <section
              key={block.id || `image-${index}`}
              className={styles.section}
            >
              <img src={imageUrl} alt="Banner" className={styles.bannerImage} />
            </section>
          ) : null;
        }

        if (blockType === "button") {
          return (
            <section
              key={block.id || `button-${index}`}
              className={styles.section}
            >
              <div className={styles.actions}>
                <Button
                  type="primary"
                  style={{
                    backgroundColor:
                      block.props?.backgroundColor ||
                      publicJobsPage?.primaryColor ||
                      undefined,
                    color: block.props?.textColor || "#121212",
                  }}
                >
                  {block.props?.label || "Button"}
                </Button>
              </div>
            </section>
          );
        }

        if (blockType === "faq") {
          return (
            <section
              key={block.id || `faq-${index}`}
              className={styles.section}
            >
              <Typography.Title level={4} className={styles.sectionTitle}>
                FAQ
              </Typography.Title>
              <Typography.Paragraph className={styles.subtitle}>
                Applications are reviewed continuously. Include assessment
                responses for faster shortlisting.
              </Typography.Paragraph>
            </section>
          );
        }

        if (blockType === "cta") {
          return (
            <section
              key={block.id || `cta-${index}`}
              className={styles.section}
            >
              <Typography.Title level={4} className={styles.sectionTitle}>
                {block.props?.title || "Ready to apply?"}
              </Typography.Title>
              <Typography.Paragraph className={styles.subtitle}>
                {block.props?.subtitle ||
                  "Open any role to view details and apply. No login is required."}
              </Typography.Paragraph>
            </section>
          );
        }

        if (blockType === "form") {
          return (
            <section
              key={block.id || `form-${index}`}
              className={styles.section}
            >
              <Typography.Title level={4} className={styles.sectionTitle}>
                {block.props?.title || "Submit your application"}
              </Typography.Title>
              <Typography.Paragraph className={styles.subtitle}>
                {block.props?.subtitle ||
                  "The application form is shown on each job detail page."}
              </Typography.Paragraph>
              {block.props?.url ? (
                <Typography.Paragraph style={{ marginBottom: 0 }}>
                  <a href={block.props.url} target="_blank" rel="noreferrer">
                    {block.props.linkText || "Open external form"}
                  </a>
                </Typography.Paragraph>
              ) : null}
            </section>
          );
        }

        return null;
      })}

      <JobsPageFooter
        companyName={publicJobsPage?.companyName || companyLabel}
        companyWebsiteUrl={publicJobsPage?.companyWebsiteUrl}
        companyEmail={publicJobsPage?.companyEmail}
      />
    </div>
  );
};

export default JobsPage;
