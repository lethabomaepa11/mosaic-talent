"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Button, Card, Empty, Spin, Tag, Typography } from "antd";
import { ArrowRight } from "lucide-react";
import { useReviewAction, useReviewState } from "@/providers/review-provider";
import { toReviewProjectSummary } from "./reviewProjectSummary";
import { useStyles } from "./style";

const ReviewsPage = () => {
  const { styles } = useStyles();
  const { isPending, projectReviews } = useReviewState();
  const { fetchMyProjectPeerReviews } = useReviewAction();

  useEffect(() => {
    void fetchMyProjectPeerReviews();
  }, []);

  const summaries = useMemo(
    () => projectReviews.map((item) => toReviewProjectSummary(item)),
    [projectReviews],
  );

  return (
    <div className={styles.page} data-ai-page="reviews">
      <div>
        <Typography.Title level={2} className={styles.title}>
          Peer Reviews
        </Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>
          Select a project to complete your anonymous peer reviews.
        </Typography.Paragraph>
      </div>

      {isPending && summaries.length === 0 ? (
        <div className={styles.loaderWrap}>
          <Spin size="large" />
        </div>
      ) : null}

      {!isPending && summaries.length === 0 ? (
        <Empty description="No project peer reviews available yet." />
      ) : null}

      {summaries.length > 0 ? (
        <div className={styles.grid}>
          {summaries.map((item) => (
            <Card key={item.projectId} className={styles.projectCard}>
              <Typography.Title level={4} className={styles.projectTitle}>
                {item.projectTitle}
              </Typography.Title>
              <div className={styles.metaRow}>
                <Tag color={item.pendingCount > 0 ? "gold" : "green"}>
                  {item.pendingCount} pending
                </Tag>
                <Tag>{item.completedCount} completed</Tag>
                <Tag>{item.receivedCount} received</Tag>
              </div>
              <Typography.Paragraph className={styles.cardSubtitle}>
                All peer reviews are anonymous. Open the project to submit yours.
              </Typography.Paragraph>
              <Link href={`/app/reviews/${item.projectId}`}>
                <Button type="primary" icon={<ArrowRight size={14} />}>
                  Open Reviews
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ReviewsPage;
