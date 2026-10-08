"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  Empty,
  Input,
  Rate,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "@/components/providers";
import { IPeerReview, useReviewAction, useReviewState } from "@/providers/review-provider";
import { useStyles } from "./style";

const toAnonymousReviewLabel = (index: number) => `Anonymous teammate ${index + 1}`;

const ProjectReviewsPage = () => {
  const params = useParams<{ project: string }>();
  const projectId = params.project;

  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [ratingLoadingByReview, setRatingLoadingByReview] = useState<Record<string, boolean>>({});
  const [answerLoadingByQuestion, setAnswerLoadingByQuestion] = useState<Record<string, boolean>>({});
  const { styles } = useStyles();
  const { projectReviews, selectedProjectReview } = useReviewState();
  const {
    fetchMyProjectPeerReviews,
    fetchProjectPeerReviews,
    generateProjectPeerReviews,
    setPeerReviewRating,
    submitReviewAnswer,
  } = useReviewAction();

  useEffect(() => {
    if (!projectId) {
      return;
    }

    void fetchMyProjectPeerReviews();
    setProjectLoading(true);
    void fetchProjectPeerReviews(projectId).finally(() => setProjectLoading(false));
  }, [projectId]);

  const activeProjectReview = useMemo(() => {
    if (
      selectedProjectReview &&
      selectedProjectReview.projectId &&
      selectedProjectReview.projectId === projectId
    ) {
      return selectedProjectReview;
    }

    return projectReviews.find((item) => item.projectId === projectId);
  }, [projectReviews, projectId, selectedProjectReview]);

  const handleGenerateReviews = async () => {
    if (!projectId) {
      return;
    }

    setIsGenerating(true);
    try {
      await generateProjectPeerReviews(projectId);
      toast.success("Peer reviews ready", "AI-generated review questions were prepared.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate peer reviews.";
      toast.error("Generation failed", message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRatingChange = async (review: IPeerReview, rating: number) => {
    setRatingLoadingByReview((prev) => ({ ...prev, [review.id]: true }));
    try {
      const updated = await setPeerReviewRating(review.id, rating);
      toast.success("Rating updated", `Anonymous review updated to ${rating}/10.`);
      if (updated?.gamificationReward?.pointsAwarded) {
        const badges = updated.gamificationReward.badgesUnlocked;
        const badgeText = badges.length > 0 ? ` Badges: ${badges.join(", ")}.` : "";
        toast.success(
          "Points earned",
          `+${updated.gamificationReward.pointsAwarded} points. Level ${updated.gamificationReward.level}.${badgeText}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update rating.";
      toast.error("Update failed", message);
    } finally {
      setRatingLoadingByReview((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    const text = (draftAnswers[questionId] ?? "").trim();
    if (!text) {
      toast.warning("Answer required", "Please enter an answer before saving.");
      return;
    }

    setAnswerLoadingByQuestion((prev) => ({ ...prev, [questionId]: true }));
    try {
      const question = await submitReviewAnswer(questionId, text);
      setDraftAnswers((prev) => ({ ...prev, [questionId]: "" }));
      toast.success("Answer saved", "Your anonymous response has been recorded.");
      if (question?.gamificationReward?.pointsAwarded) {
        const badges = question.gamificationReward.badgesUnlocked;
        const badgeText = badges.length > 0 ? ` Badges: ${badges.join(", ")}.` : "";
        toast.success(
          "Progress updated",
          `+${question.gamificationReward.pointsAwarded} points. Level ${question.gamificationReward.level}.${badgeText}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save answer.";
      toast.error("Save failed", message);
    } finally {
      setAnswerLoadingByQuestion((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  return (
    <div className={styles.page} data-ai-page="project-reviews">
      <div className={styles.header}>
        <div>
          <Space size="small">
            <Link href="/app/reviews">
              <Button icon={<ArrowLeft size={14} />}>Back</Button>
            </Link>
            <Typography.Text type="secondary">Peer Reviews</Typography.Text>
          </Space>
          <Typography.Title level={2} className={styles.title}>
            {activeProjectReview?.projectTitle ?? "Project Reviews"}
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            All reviews are anonymous. Complete assigned reviews and check anonymous feedback.
          </Typography.Paragraph>
        </div>
        <Button
          icon={<Sparkles size={14} />}
          type="primary"
          onClick={() => void handleGenerateReviews()}
          disabled={!projectId}
          loading={isGenerating}
          data-ai-action="generate-peer-reviews"
        >
          Generate Reviews
        </Button>
      </div>

      {projectLoading ? <Spin /> : null}

      {!projectLoading && !activeProjectReview ? (
        <Empty description="Project reviews not found." />
      ) : null}

      {!projectLoading && activeProjectReview ? (
        <>
          <Card className={styles.reviewCard}>
            <Typography.Title level={5}>Assigned To You</Typography.Title>
            {activeProjectReview.assignedToMe.length === 0 ? (
              <Empty description="No assigned reviews for this project." />
            ) : (
              activeProjectReview.assignedToMe.map((review, index) => (
                <Card key={review.id} className={styles.reviewItem}>
                  <Space direction="vertical" size="small" className={styles.fullWidth}>
                    <Typography.Text strong>{toAnonymousReviewLabel(index)}</Typography.Text>
                    <Rate
                      count={10}
                      value={review.rating}
                      onChange={(value) => void handleRatingChange(review, value)}
                      disabled={Boolean(ratingLoadingByReview[review.id])}
                    />
                    {ratingLoadingByReview[review.id] ? <Spin size="small" /> : null}
                    <Typography.Text className={styles.mutedText}>
                      Score: {review.rating}/10
                    </Typography.Text>
                    {review.questions.map((question) => (
                      <div key={question.id} className={styles.questionRow}>
                        <Typography.Text>{question.text}</Typography.Text>
                        <div className={styles.questionMeta}>
                          {question.category ? <Tag>{question.category}</Tag> : null}
                          {question.relatedGoal ? <Tag color="gold">{question.relatedGoal}</Tag> : null}
                        </div>
                        <Input.TextArea
                          value={draftAnswers[question.id] ?? question.answerText ?? ""}
                          rows={3}
                          disabled={Boolean(answerLoadingByQuestion[question.id])}
                          onChange={(event) =>
                            setDraftAnswers((prev) => ({
                              ...prev,
                              [question.id]: event.target.value,
                            }))
                          }
                          placeholder="Write anonymous feedback..."
                        />
                        <Button
                          onClick={() => void handleAnswerSubmit(question.id)}
                          loading={Boolean(answerLoadingByQuestion[question.id])}
                          data-ai-action="save-review-answer"
                        >
                          Save answer
                        </Button>
                      </div>
                    ))}
                  </Space>
                </Card>
              ))
            )}
          </Card>

          <Card className={styles.reviewCard}>
            <Typography.Title level={5}>Anonymous Feedback Received</Typography.Title>
            {activeProjectReview.receivedByMe.length === 0 ? (
              <Empty description="No received reviews for this project." />
            ) : (
              activeProjectReview.receivedByMe.map((review) => (
                <Card key={review.id} className={styles.reviewItem}>
                  <Space direction="vertical" size="small">
                    <Typography.Text strong>From anonymous teammate</Typography.Text>
                    <Typography.Text>Rating: {review.rating}/10</Typography.Text>
                    <Typography.Text className={styles.mutedText}>
                      {review.isCompleted ? "Review completed" : "Review in progress"}
                    </Typography.Text>
                  </Space>
                </Card>
              ))
            )}
          </Card>

          {activeProjectReview.feedback ? (
            <Card className={styles.reviewCard}>
              <Typography.Title level={5}>Project AI Feedback</Typography.Title>
              <Typography.Paragraph>{activeProjectReview.feedback.summary}</Typography.Paragraph>
              <Typography.Paragraph>
                <Typography.Text strong>Growth Score:</Typography.Text>{" "}
                {activeProjectReview.feedback.growthScore}/100
              </Typography.Paragraph>
              <div className={styles.feedbackGrid}>
                <Card size="small">
                  <Typography.Text strong>Strengths</Typography.Text>
                  <ul>
                    {activeProjectReview.feedback.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Card>
                <Card size="small">
                  <Typography.Text strong>Improvement Areas</Typography.Text>
                  <ul>
                    {activeProjectReview.feedback.improvementAreas.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Card>
              </div>
              <Card size="small" className={styles.tipsCard}>
                <Typography.Text strong>Tips</Typography.Text>
                <ul>
                  {activeProjectReview.feedback.tips.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default ProjectReviewsPage;
