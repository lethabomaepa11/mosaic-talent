"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Sparkles } from "lucide-react";
import { toast } from "@/components/providers";
import { IPeerReview, useReviewAction, useReviewState } from "@/providers/review-provider";
import { useStyles } from "./style";

const ReviewsPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [ratingLoadingByReview, setRatingLoadingByReview] = useState<Record<string, boolean>>({});
  const [answerLoadingByQuestion, setAnswerLoadingByQuestion] = useState<Record<string, boolean>>({});
  const { styles } = useStyles();
  const { isPending, projectReviews, selectedProjectReview } = useReviewState();
  const {
    fetchMyProjectPeerReviews,
    fetchProjectPeerReviews,
    generateProjectPeerReviews,
    setPeerReviewRating,
    submitReviewAnswer,
  } = useReviewAction();
  const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");

  useEffect(() => {
    void fetchMyProjectPeerReviews();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      return;
    }

    if (projectReviews.length > 0) {
      setSelectedProjectId(projectReviews[0].projectId);
    }
  }, [projectReviews, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    setProjectLoading(true);
    void fetchProjectPeerReviews(selectedProjectId).finally(() => setProjectLoading(false));
  }, [selectedProjectId]);

  const activeProjectReview = useMemo(() => {
    if (
      selectedProjectReview &&
      selectedProjectReview.projectId &&
      selectedProjectReview.projectId === selectedProjectId
    ) {
      return selectedProjectReview;
    }

    return projectReviews.find((item) => item.projectId === selectedProjectId);
  }, [projectReviews, selectedProjectId, selectedProjectReview]);

  const handleGenerateReviews = async () => {
    if (!selectedProjectId) {
      return;
    }

    setIsGenerating(true);
    try {
      await generateProjectPeerReviews(selectedProjectId);
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
      await setPeerReviewRating(review.id, rating);
      toast.success("Rating updated", `${review.revieweeName} was rated ${rating}/10.`);
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
      await submitReviewAnswer(questionId, text);
      setDraftAnswers((prev) => ({ ...prev, [questionId]: "" }));
      toast.success("Answer saved", "Your response has been recorded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save answer.";
      toast.error("Save failed", message);
    } finally {
      setAnswerLoadingByQuestion((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Typography.Title level={2} className={styles.title}>
            Peer Reviews
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            AI-generated reviews are created after completed projects for your teammate interactions.
          </Typography.Paragraph>
        </div>
        <div className={styles.headerActions}>
          <Button
            icon={<Sparkles size={14} />}
            type="primary"
            onClick={() => void handleGenerateReviews()}
            disabled={!selectedProjectId}
            loading={isGenerating}
          >
            Generate Reviews
          </Button>
        </div>
      </div>

      {isPending && projectReviews.length === 0 ? <Spin /> : null}

      {!isPending && projectReviews.length === 0 ? (
        <Empty description="No completed project reviews yet." />
      ) : null}

      {projectReviews.length > 0 ? (
        <div className={styles.body}>
          <div className={styles.projectList}>
            {projectReviews.map((item) => (
              <Card
                key={item.projectId}
                size="small"
                hoverable
                onClick={() => setSelectedProjectId(item.projectId)}
                className={cx(
                  styles.projectCard,
                  selectedProjectId === item.projectId && styles.selectedProjectCard,
                )}
              >
                <Typography.Text strong>{item.projectTitle}</Typography.Text>
                <div>
                  <Typography.Text className={styles.mutedText}>
                    {item.assignedToMe.length} assigned, {item.receivedByMe.length} received
                  </Typography.Text>
                </div>
              </Card>
            ))}
          </div>

          <div className={styles.reviewBoard}>
            {projectLoading ? (
              <Spin />
            ) : activeProjectReview ? (
              <>
                <Card className={styles.reviewCard}>
                  <Typography.Title level={4}>{activeProjectReview.projectTitle}</Typography.Title>
                  <Typography.Paragraph className={styles.mutedText}>
                    Complete your assigned reviews, then check project-level AI feedback below.
                  </Typography.Paragraph>
                </Card>

                <div className={styles.reviewSection}>
                  <Typography.Title level={5}>Assigned To Me</Typography.Title>
                  {activeProjectReview.assignedToMe.length === 0 ? (
                    <Empty description="No assigned reviews for this project." />
                  ) : (
                    activeProjectReview.assignedToMe.map((review) => (
                      <Card key={review.id} className={styles.reviewCard}>
                        <Space direction="vertical" size="small" style={{ width: "100%" }}>
                          <Typography.Text strong>{review.revieweeName}</Typography.Text>
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
                                placeholder="Write your feedback..."
                              />
                              <Button
                                onClick={() => void handleAnswerSubmit(question.id)}
                                loading={Boolean(answerLoadingByQuestion[question.id])}
                              >
                                Save answer
                              </Button>
                            </div>
                          ))}
                        </Space>
                      </Card>
                    ))
                  )}
                </div>

                <div className={styles.reviewSection}>
                  <Typography.Title level={5}>Received By Me</Typography.Title>
                  {activeProjectReview.receivedByMe.length === 0 ? (
                    <Empty description="No received reviews for this project." />
                  ) : (
                    activeProjectReview.receivedByMe.map((review) => (
                      <Card key={review.id} className={styles.reviewCard}>
                        <Space direction="vertical" size="small">
                          <Typography.Text strong>From {review.reviewerName}</Typography.Text>
                          <Typography.Text>Rating: {review.rating}/10</Typography.Text>
                          <Typography.Text className={styles.mutedText}>
                            {review.isCompleted ? "Review completed" : "Review in progress"}
                          </Typography.Text>
                        </Space>
                      </Card>
                    ))
                  )}
                </div>

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
            ) : (
              <Empty description="Select a project to view reviews." />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReviewsPage;
