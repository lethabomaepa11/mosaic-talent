"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Progress,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { GithubFilled, LinkedinFilled } from "@ant-design/icons";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  MessageSquare,
  Send,
  ThumbsDown,
  Users,
} from "lucide-react";
import { toast } from "@/components/providers";
import {
  IJobApplication,
  useJobAction,
  useJobState,
} from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

const statusLabelToValue: Record<string, number> = {
  applied: 0,
  shortlisted: 1,
  interview: 2,
  rejected: 3,
  approved: 4,
  assessment: 5,
};

const parseResponseJson = (json?: string) => {
  if (!json) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {} as Record<string, string>;
  }
};

const extractUrls = (text: string) => {
  const matches = text.match(/https?:\/\/[^\s)]+/gi) ?? [];
  return Array.from(new Set(matches));
};

const CandidateAssessmentPage = () => {
  const params = useParams<{ id: string; applicationId: string }>();
  const router = useRouter();
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);
  const { jobs } = useJobState();
  const {
    fetchMyJobs,
    fetchJobApplications,
    updateApplicationStatus,
    sendApplicationEmail,
  } = useJobAction();

  const jobId = String(params?.id ?? "");
  const applicationId = String(params?.applicationId ?? "");

  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<IJobApplication[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState({ subject: "", message: "" });

  useEffect(() => {
    if (!isCompanyTenant) {
      router.replace("/app");
      return;
    }
    void fetchMyJobs();
  }, [isCompanyTenant, router]);

  useEffect(() => {
    if (!isCompanyTenant || !jobId) return;
    const load = async () => {
      setLoading(true);
      try {
        setApplications(await fetchJobApplications(jobId));
      } catch (error) {
        toast.error(
          "Load failed",
          error instanceof Error
            ? error.message
            : "Could not load application.",
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [isCompanyTenant, jobId]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === jobId),
    [jobs, jobId],
  );
  const application = useMemo(
    () => applications.find((item) => item.id === applicationId),
    [applications, applicationId],
  );
  const responseData = useMemo(
    () => parseResponseJson(application?.applicationResponseJson),
    [application?.applicationResponseJson],
  );
  const responseText = useMemo(
    () => Object.values(responseData).join(" "),
    [responseData],
  );
  const links = useMemo(() => {
    const all = extractUrls(
      `${application?.aiGithubRepo ?? ""} ${responseText}`,
    );
    return {
      github:
        application?.aiGithubRepo ||
        all.find((url) => url.includes("github.com")) ||
        "",
      linkedin: all.find((url) => url.includes("linkedin.com")) || "",
      website:
        all.find(
          (url) => !url.includes("github.com") && !url.includes("linkedin.com"),
        ) || "",
    };
  }, [application?.aiGithubRepo, responseText]);
  const mosaic = useMemo(() => {
    const src = application?.aiMosaic ?? {};
    const baseScore = application?.matchScore ?? 0;
    const technical =
      typeof src.technical === "number" ? src.technical : baseScore;
    const problemSolving =
      typeof src.problemSolving === "number"
        ? src.problemSolving
        : baseScore * 0.96;
    const collaboration =
      typeof src.collaboration === "number"
        ? src.collaboration
        : baseScore * 0.92;
    const communication =
      typeof src.communication === "number"
        ? src.communication
        : baseScore * 0.9;
    return {
      technical: Math.max(0, Math.min(100, Math.round(technical))),
      problemSolving: Math.max(0, Math.min(100, Math.round(problemSolving))),
      collaboration: Math.max(0, Math.min(100, Math.round(collaboration))),
      communication: Math.max(0, Math.min(100, Math.round(communication))),
    };
  }, [application?.aiMosaic, application?.matchScore]);
  const githubSourceStatuses = useMemo(
    () => Object.entries(application?.aiGithubAnalysisSourceStatus ?? {}),
    [application?.aiGithubAnalysisSourceStatus],
  );
  const githubDocScore =
    typeof application?.aiGithubDocumentationScore === "number"
      ? Math.max(0, Math.min(100, application.aiGithubDocumentationScore))
      : null;
  const githubConfidenceColor =
    application?.aiGithubAnalysisConfidence === "high"
      ? "success"
      : application?.aiGithubAnalysisConfidence === "medium"
        ? "gold"
        : "default";

  const scoreClass =
    (application?.matchScore ?? 0) >= 90
      ? styles.scoreHigh
      : (application?.matchScore ?? 0) >= 80
        ? styles.scoreMid
        : styles.scoreLow;
  const githubAnalysisCard = (
    <Card size="small" title="GitHub Technical Analysis">
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Space size={8} wrap>
          <Tag>{application?.aiGithubUsername || "github: unknown"}</Tag>
          {application?.aiGithubAnalysisConfidence ? (
            <Tag color={githubConfidenceColor}>
              confidence: {application.aiGithubAnalysisConfidence}
            </Tag>
          ) : null}
        </Space>
        {application?.aiGithubProfileSummary ? (
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            {application.aiGithubProfileSummary}
          </Typography.Paragraph>
        ) : (
          <Typography.Text type="secondary">
            No GitHub profile narrative available.
          </Typography.Text>
        )}
        {githubDocScore !== null ? (
          <div>
            <Typography.Text type="secondary">
              README/documentation strength
            </Typography.Text>
            <Progress percent={Math.round(githubDocScore)} showInfo />
          </div>
        ) : (
          <Typography.Text type="secondary">
            README score unavailable.
          </Typography.Text>
        )}
        {application?.aiGithubDocumentationNotes &&
        application.aiGithubDocumentationNotes.length > 0 ? (
          <div>
            {application.aiGithubDocumentationNotes.slice(0, 4).map((note) => (
              <Typography.Paragraph key={note} style={{ marginBottom: 6 }}>
                - {note}
              </Typography.Paragraph>
            ))}
          </div>
        ) : null}
        {githubSourceStatuses.length > 0 ? (
          <div className={styles.githubSourceStatuses}>
            {githubSourceStatuses.map(([key, value]) => (
              <Tag key={`${key}-${value}`}>
                {key}: {value}
              </Tag>
            ))}
          </div>
        ) : null}
      </Space>
    </Card>
  );

  const handleStatusUpdate = async (status: number) => {
    if (!application) return;
    setUpdatingStatus(true);
    try {
      await updateApplicationStatus(application.id, status);
      setApplications(await fetchJobApplications(jobId));
      toast.success("Status updated", "Application status was updated.");
    } catch (error) {
      toast.error(
        "Update failed",
        error instanceof Error ? error.message : "Could not update status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openEmailModal = () => {
    if (!application) return;
    setEmailDraft({
      subject: `Regarding your application for ${selectedJob?.title ?? "this role"}`,
      message: `Hi ${application.candidateName},\n\nThank you for your application. We would like to discuss next steps.\n\nRegards,\nHiring Team`,
    });
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!application) return;
    if (!emailDraft.subject.trim() || !emailDraft.message.trim()) {
      toast.error("Missing fields", "Subject and message are required.");
      return;
    }
    setSendingEmail(true);
    try {
      await sendApplicationEmail(
        application.id,
        emailDraft.subject.trim(),
        emailDraft.message.trim(),
      );
      toast.success(
        "Email sent",
        `Message sent to ${application.candidateName}.`,
      );
      setIsEmailModalOpen(false);
    } catch (error) {
      toast.error(
        "Send failed",
        error instanceof Error ? error.message : "Could not send email.",
      );
    } finally {
      setSendingEmail(false);
    }
  };

  if (!isCompanyTenant) return null;
  if (loading)
    return (
      <div className={styles.pageLoader}>
        <Spin size="large" />
      </div>
    );
  if (!application)
    return (
      <Empty description="Application not found.">
        <Link href={`/app/jobs/${jobId}`}>
          <Button>Back to Applications</Button>
        </Link>
      </Empty>
    );

  return (
    <>
      <div className={styles.page} data-ai-page="job-application-detail">
        <Link href={`/app/jobs/${jobId}`} className={styles.backLink}>
          <Button icon={<ArrowLeft size={14} />}>Back to Applications</Button>
        </Link>
        <div className={styles.header}>
          <div className={styles.candidateBlock}>
            <div className={styles.avatar}>
              {(application.candidateName || "C")
                .split(" ")
                .map((x) => x[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <Space size={8} wrap>
                <Typography.Title level={2} style={{ margin: 0 }}>
                  {application.candidateName}
                </Typography.Title>
                <Tag>{application.status}</Tag>
              </Space>
              <Typography.Text type="secondary">
                {selectedJob?.title || "Job application"} -{" "}
                {application.candidateEmail}
              </Typography.Text>
              <div className={styles.candidateMeta}>
                <span>
                  <MapPin size={12} /> Location not provided
                </span>
                <span>
                  <Briefcase size={12} /> Source: {application.source}
                </span>
                <span>
                  <Calendar size={12} /> Applied{" "}
                  {new Date(application.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.linkRow}>
                {links.github ? (
                  <a href={links.github} target="_blank" rel="noreferrer">
                    <Button icon={<GithubFilled />}>GitHub</Button>
                  </a>
                ) : null}
                {links.linkedin ? (
                  <a href={links.linkedin} target="_blank" rel="noreferrer">
                    <Button icon={<LinkedinFilled />}>LinkedIn</Button>
                  </a>
                ) : null}
                {links.website ? (
                  <a href={links.website} target="_blank" rel="noreferrer">
                    <Button icon={<Globe size={14} />}>Portfolio</Button>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <div className={styles.sideActions}>
            <Card className={styles.matchCard}>
              <Typography.Text type="secondary">Match Score</Typography.Text>
              <div className={scoreClass}>
                {application.matchScore.toFixed(1)}%
              </div>
            </Card>
            <Space direction="vertical">
              <Button
                icon={<Calendar size={14} />}
                onClick={() => void handleStatusUpdate(2)}
                loading={updatingStatus}
              >
                Schedule Interview
              </Button>
              <Button
                icon={<MessageSquare size={14} />}
                onClick={openEmailModal}
                data-ai-action="open-candidate-email"
              >
                Send Message
              </Button>
              {application.resumeStoredFileId ? (
                <a
                  href={application.resumeStoredFileId}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button icon={<ExternalLink size={14} />}>Open Resume</Button>
                </a>
              ) : null}
            </Space>
          </div>
        </div>

        <Tabs
          className={styles.tabs}
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "overview",
              label: "Overview",
              children: (
                <div className={styles.twoCol}>
                  <Card title="AI Assessment Summary">
                    <Typography.Paragraph>
                      {application.matchReason || "No AI summary yet."}
                    </Typography.Paragraph>
                    <div className={styles.summaryGrid}>
                      <Card size="small" title="Key Strengths">
                        {(application.aiStrengths?.length
                          ? application.aiStrengths
                          : ["No strengths extracted yet."]
                        ).map((x) => (
                          <Typography.Paragraph
                            key={x}
                            style={{ marginBottom: 6 }}
                          >
                            - {x}
                          </Typography.Paragraph>
                        ))}
                      </Card>
                      <Card size="small" title="Considerations">
                        {(application.aiWeaknesses?.length
                          ? application.aiWeaknesses
                          : ["No considerations extracted yet."]
                        ).map((x) => (
                          <Typography.Paragraph
                            key={x}
                            style={{ marginBottom: 6 }}
                          >
                            - {x}
                          </Typography.Paragraph>
                        ))}
                      </Card>
                      {githubAnalysisCard}
                    </div>
                  </Card>
                  <Card title="Application Timeline">
                    <Space
                      direction="vertical"
                      size={10}
                      style={{ width: "100%" }}
                    >
                      <div className={styles.timelineRow}>
                        <div className={styles.timelineDotDone}>
                          <CheckCircle size={14} />
                        </div>
                        <div>
                          <Typography.Text strong>Applied</Typography.Text>
                          <br />
                          <Typography.Text type="secondary">
                            {new Date(application.createdAt).toLocaleString()}
                          </Typography.Text>
                        </div>
                      </div>
                      <div className={styles.timelineRow}>
                        <div className={styles.timelineDotCurrent}>
                          <Clock size={14} />
                        </div>
                        <div>
                          <Typography.Text strong>
                            Current Status
                          </Typography.Text>
                          <br />
                          <Typography.Text type="secondary">
                            {application.status}
                          </Typography.Text>
                        </div>
                      </div>
                      <div className={styles.timelineRow}>
                        <div className={styles.timelineDotPending}>
                          <Users size={14} />
                        </div>
                        <div>
                          <Typography.Text strong>
                            Interview / Decision
                          </Typography.Text>
                          <br />
                          <Typography.Text type="secondary">
                            Pending
                          </Typography.Text>
                        </div>
                      </div>
                    </Space>
                  </Card>
                  <Card title="Assessment">
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      <Typography.Text type="secondary">
                        Status: {application.assessmentStatus || "not-created"}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Score:{" "}
                        {typeof application.assessmentScore === "number"
                          ? `${application.assessmentScore.toFixed(1)}%`
                          : "--"}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Verdict: {application.assessmentVerdict || "--"}
                      </Typography.Text>
                      {application.assessmentSubmittedAt ? (
                        <Typography.Text type="secondary">
                          Submitted:{" "}
                          {new Date(
                            application.assessmentSubmittedAt,
                          ).toLocaleString()}
                        </Typography.Text>
                      ) : null}
                      {application.assessmentId ? (
                        <a
                          href={`/assessment/${application.assessmentId}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button icon={<ExternalLink size={14} />}>
                            Open Candidate Assessment
                          </Button>
                        </a>
                      ) : null}
                    </Space>
                  </Card>
                </div>
              ),
            },
            {
              key: "mosaic",
              label: "Mosaic Profile",
              children: (
                <Card title="Mosaic Breakdown">
                  <Space
                    direction="vertical"
                    size={10}
                    style={{ width: "100%" }}
                  >
                    <div>
                      <Typography.Text>Technical</Typography.Text>
                      <Progress percent={mosaic.technical} showInfo={false} />
                    </div>
                    <div>
                      <Typography.Text>Problem Solving</Typography.Text>
                      <Progress
                        percent={mosaic.problemSolving}
                        showInfo={false}
                      />
                    </div>
                    <div>
                      <Typography.Text>Collaboration</Typography.Text>
                      <Progress
                        percent={mosaic.collaboration}
                        showInfo={false}
                      />
                    </div>
                    <div>
                      <Typography.Text>Communication</Typography.Text>
                      <Progress
                        percent={mosaic.communication}
                        showInfo={false}
                      />
                    </div>
                  </Space>
                </Card>
              ),
            },
            {
              key: "projects",
              label: "Projects",
              children:
                application.aiProjects && application.aiProjects.length > 0 ? (
                  <Space
                    direction="vertical"
                    size={10}
                    style={{ width: "100%" }}
                  >
                    {application.aiProjects.map((project) => (
                      <Card
                        key={`${project.name}-${project.score}`}
                        title={project.name}
                      >
                        <Typography.Paragraph>
                          {project.description || "No description provided."}
                        </Typography.Paragraph>
                        <Space wrap>
                          {(project.technologies ?? []).map((tech) => (
                            <Tag key={`${project.name}-${tech}`}>{tech}</Tag>
                          ))}
                        </Space>
                        <Typography.Paragraph
                          style={{ marginTop: 8, marginBottom: 0 }}
                        >
                          Score: {project.score.toFixed(1)}%
                        </Typography.Paragraph>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Card title="Projects">
                    <Empty description="No projects extracted from CV yet." />
                  </Card>
                ),
            },
            {
              key: "github",
              label: "GitHub Analysis",
              children: githubAnalysisCard,
            },
            {
              key: "reviews",
              label: "Reviews",
              children: (
                <Card title="Reviews">
                  <Empty description="Peer reviews are not linked to this application yet." />
                </Card>
              ),
            },
            {
              key: "assessment",
              label: "Assessment",
              children: (
                <Card title="Assessment Result">
                  <Empty
                    description={
                      application.assessmentStatus === "reviewed"
                        ? "Assessment was reviewed. See overview for summary."
                        : "Assessment has not been reviewed yet."
                    }
                  />
                </Card>
              ),
            },
          ]}
        />

        <Card title="Skills & Notes">
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <Space wrap>
              {(application.aiExtractedSkills?.length
                ? application.aiExtractedSkills
                : ["No extracted skills"]
              ).map((skill) => (
                <Tag key={skill}>{skill}</Tag>
              ))}
            </Space>
            <Input.TextArea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add internal notes..."
            />
            <Button icon={<Send size={14} />}>Save Notes</Button>
          </Space>
        </Card>

        <Card className={styles.stickyActions}>
          <div className={styles.stickyRow}>
            <div className={styles.actionGroup}>
              <Button
                danger
                icon={<ThumbsDown size={14} />}
                loading={updatingStatus}
                onClick={() => void handleStatusUpdate(3)}
                data-ai-action="reject-candidate"
              >
                Reject
              </Button>
              <Button
                icon={<Clock size={14} />}
                loading={updatingStatus}
                onClick={() => void handleStatusUpdate(0)}
              >
                Keep in Pipeline
              </Button>
            </div>
            <div className={styles.actionGroup}>
              <Button
                icon={<MessageSquare size={14} />}
                onClick={openEmailModal}
                data-ai-action="open-candidate-email"
              >
                Request More Info
              </Button>
              <Button
                type="primary"
                icon={<CheckCircle size={14} />}
                loading={updatingStatus}
                onClick={() => void handleStatusUpdate(2)}
              >
                Move to Interview
              </Button>
            </div>
          </div>
        </Card>
      </div>
      <Modal
        title={`Email ${application.candidateName}`}
        open={isEmailModalOpen}
        onCancel={() => setIsEmailModalOpen(false)}
        onOk={() => void handleSendEmail()}
        okText="Send Email"
        confirmLoading={sendingEmail}
      >
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            To: {application.candidateEmail}
          </Typography.Text>
          <Input
            value={emailDraft.subject}
            onChange={(event) =>
              setEmailDraft((prev) => ({
                ...prev,
                subject: event.target.value,
              }))
            }
            placeholder="Email subject"
          />
          <Input.TextArea
            rows={8}
            value={emailDraft.message}
            onChange={(event) =>
              setEmailDraft((prev) => ({
                ...prev,
                message: event.target.value,
              }))
            }
            placeholder="Write your message..."
          />
        </Space>
      </Modal>
    </>
  );
};

export default CandidateAssessmentPage;


