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
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Code,
  Eye,
  MapPin,
  MessageSquare,
  Briefcase,
  Search,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "@/components/providers";
import {
  IJob,
  IJobApplication,
  useJobAction,
  useJobState,
} from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

const statusOptions = [
  { label: "Applied", value: 0 },
  { label: "Shortlisted", value: 1 },
  { label: "Interview", value: 2 },
  { label: "Rejected", value: 3 },
  { label: "Approved", value: 4 },
];

const statusLabelToValue: Record<string, number> = {
  applied: 0,
  shortlisted: 1,
  interview: 2,
  rejected: 3,
  approved: 4,
};

const getStatusClassName = (status: string, styles: ReturnType<typeof useStyles>["styles"]) => {
  switch (status) {
    case "applied":
      return styles.statusNew;
    case "shortlisted":
      return styles.statusShortlisted;
    case "interview":
      return styles.statusInterviewing;
    case "approved":
      return styles.statusShortlisted;
    case "rejected":
      return styles.statusReviewing;
    default:
      return styles.statusReviewing;
  }
};

const getScoreClassName = (score: number, styles: ReturnType<typeof useStyles>["styles"]) => {
  if (score >= 90) return styles.scoreValueHigh;
  if (score >= 80) return styles.scoreValueMid;
  return styles.scoreValueLow;
};

const parseApplicationResponses = (json?: string) => {
  if (!json) {
    return [] as Array<{ key: string; value: string }>;
  }

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return Object.entries(parsed)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0)
      .filter(([key]) => !key.startsWith("__ai_") && key !== "__resume_extracted")
      .map(([key, value]) => ({
        key,
        value,
      }));
  } catch {
    return [] as Array<{ key: string; value: string }>;
  }
};

const JobApplicationsPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = String(params?.id ?? "");
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);
  const { jobs, isPending } = useJobState();
  const {
    fetchMyJobs,
    fetchJobApplications,
    updateApplicationStatus,
    sendApplicationEmail,
  } = useJobAction();

  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applications, setApplications] = useState<IJobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingApplicationId, setUpdatingApplicationId] = useState("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState({ subject: "", message: "" });
  const [emailTarget, setEmailTarget] = useState<IJobApplication | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!isCompanyTenant) {
      router.replace("/app");
      return;
    }

    void fetchMyJobs();
  }, [isCompanyTenant, router]);

  useEffect(() => {
    if (!isCompanyTenant || !jobId) {
      return;
    }

    const loadApplications = async () => {
      setLoadingApplications(true);
      try {
        const result = await fetchJobApplications(jobId);
        setApplications(result);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load applications.";
        toast.error("Load failed", message);
      } finally {
        setLoadingApplications(false);
      }
    };

    void loadApplications();
  }, [isCompanyTenant, jobId]);

  const selectedJob = useMemo<IJob | undefined>(() => {
    return jobs.find((job) => job.id === jobId);
  }, [jobs, jobId]);

  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((item) => {
      (item.aiExtractedSkills ?? []).forEach((skill) => set.add(skill));
    });

    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        application.candidateName.toLowerCase().includes(q) ||
        application.candidateEmail.toLowerCase().includes(q);
      const matchesSkill =
        skillFilter === "all" ||
        (application.aiExtractedSkills ?? []).some(
          (skill) => skill.toLowerCase() === skillFilter.toLowerCase(),
        );
      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;
      return matchesSearch && matchesStatus && matchesSkill;
    });
  }, [applications, searchQuery, skillFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter((item) => item.status === "applied").length,
      shortlisted: applications.filter((item) => item.status === "shortlisted")
        .length,
      interview: applications.filter((item) => item.status === "interview")
        .length,
    };
  }, [applications]);

  const handleStatusChange = async (
    application: IJobApplication,
    status: number,
  ) => {
    setUpdatingApplicationId(application.id);
    try {
      await updateApplicationStatus(application.id, status);
      const refreshed = await fetchJobApplications(jobId);
      setApplications(refreshed);
      toast.success("Status updated", "Candidate application status updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update status.";
      toast.error("Update failed", message);
    } finally {
      setUpdatingApplicationId("");
    }
  };

  const openEmailModal = (application: IJobApplication) => {
    setEmailTarget(application);
    setEmailDraft({
      subject: `Regarding your application for ${selectedJob?.title ?? "this role"}`,
      message: `Hi ${application.candidateName},\n\nThank you for your application. We would like to discuss the next step with you.\n\nRegards,\nHiring Team`,
    });
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTarget) {
      return;
    }

    if (!emailDraft.subject.trim() || !emailDraft.message.trim()) {
      toast.error("Missing fields", "Subject and message are required.");
      return;
    }

    setSendingEmail(true);
    try {
      await sendApplicationEmail(
        emailTarget.id,
        emailDraft.subject.trim(),
        emailDraft.message.trim(),
      );
      toast.success("Email sent", `Message sent to ${emailTarget.candidateName}.`);
      setIsEmailModalOpen(false);
      setEmailTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send email.";
      toast.error("Send failed", message);
    } finally {
      setSendingEmail(false);
    }
  };

  if (!isCompanyTenant) {
    return null;
  }

  if ((isPending && !selectedJob) || (loadingApplications && applications.length === 0)) {
    return (
      <div className={styles.pageLoader}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/app/jobs">
          <Button icon={<ArrowLeft size={14} />}>Back to Jobs</Button>
        </Link>
        <Typography.Title level={2} className={styles.title}>
          {selectedJob?.title ?? "Job"} Applications
        </Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>
          Review and move candidates through your pipeline.
        </Typography.Paragraph>
      </div>

      <div className={styles.statsGrid}>
        <Card>
          <Statistic
            title="Total Candidates"
            value={stats.total}
            prefix={<Users size={14} />}
          />
        </Card>
        <Card>
          <Statistic
            title="Applied"
            value={stats.applied}
            prefix={<Clock size={14} />}
          />
        </Card>
        <Card>
          <Statistic
            title="Shortlisted"
            value={stats.shortlisted}
            prefix={<CheckCircle size={14} />}
          />
        </Card>
        <Card>
          <Statistic
            title="Interview"
            value={stats.interview}
            prefix={<Calendar size={14} />}
          />
        </Card>
      </div>

      <Card>
        <div className={styles.filtersRow}>
          <Input
            prefix={<Search size={14} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search candidates by name or skill..."
          />
          <Select
            value={skillFilter}
            onChange={setSkillFilter}
            options={skillOptions.map((skill) => ({
              label: skill === "all" ? "All Skills" : skill,
              value: skill,
            }))}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Applied", value: "applied" },
              { label: "Shortlisted", value: "shortlisted" },
              { label: "Interview", value: "interview" },
              { label: "Rejected", value: "rejected" },
              { label: "Approved", value: "approved" },
            ]}
          />
        </div>
      </Card>

      {!isPending &&
      !loadingApplications &&
      filteredApplications.length === 0 ? (
        <Empty description="No applications found for this job." />
      ) : null}

      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {filteredApplications.map((application) => (
          <Card key={application.id}>
            {(() => {
              const responseEntries = parseApplicationResponses(application.applicationResponseJson);
              const score = Number.isFinite(application.matchScore) ? application.matchScore : 0;
              const technical = Math.round(score);
              const problemSolving = Math.max(0, Math.min(100, Math.round(score * 0.96)));
              const collaboration = Math.max(0, Math.min(100, Math.round((application.aiStrengths?.length ?? 0) > 0 ? score * 0.92 : score * 0.84)));
              const communication = Math.max(0, Math.min(100, Math.round((application.aiWeaknesses?.length ?? 0) > 0 ? score * 0.88 : score * 0.9)));
              const initials = (application.candidateName || "Candidate")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase();
              return (
            <div className={styles.sidePanel}>
              <div className={styles.appRow}>
                <div className={styles.avatar}>{initials}</div>
                <div className={styles.appMain}>
                  <div className={styles.cardHeader}>
                    <div>
                      <Typography.Title level={4}>
                        {application.candidateName}
                      </Typography.Title>
                      <Typography.Text className={styles.meta}>
                        {application.candidateEmail}
                      </Typography.Text>
                    </div>
                    <Space wrap>
                      <Tag className={getStatusClassName(application.status, styles)}>
                        {application.status}
                      </Tag>
                      <Tag color={application.isPublicApplication ? "purple" : "default"}>
                        {application.isPublicApplication ? "Public form" : "Member form"}
                      </Tag>
                    </Space>
                  </div>
                  <div className={styles.appMeta}>
                    <span><MapPin size={12} /> Remote / Not set</span>
                    <span><Briefcase size={12} /> Applied via {application.source}</span>
                    <span><Code size={12} /> {(application.aiExtractedSkills ?? []).length} skills</span>
                    <span><Star size={12} /> {application.aiStrengths?.length ?? 0} strengths</span>
                  </div>
                  <Typography.Paragraph
                    style={{ marginTop: 12, marginBottom: 0 }}
                  >
                    {application.matchReason || "No match reason provided yet."}
                  </Typography.Paragraph>
                  <div className={styles.appSkills}>
                    <Typography.Text type="secondary">Skills:</Typography.Text>
                    {(application.aiExtractedSkills ?? []).map((skill) => (
                      <Tag key={`${application.id}-skill-${skill}`}>{skill}</Tag>
                    ))}
                    <Typography.Text className={styles.meta} style={{ marginLeft: "auto" }}>
                      Applied {new Date(application.createdAt).toLocaleDateString()}
                    </Typography.Text>
                  </div>
                </div>
                <div className={styles.scorePanel}>
                  <Typography.Text type="secondary">Match Score</Typography.Text>
                  <div className={getScoreClassName(score, styles)}>
                    {score.toFixed(1)}%
                  </div>
                </div>
                <div className={styles.breakdownPanel}>
                  <Typography.Text type="secondary">Mosaic Breakdown</Typography.Text>
                  <Space direction="vertical" size={6} style={{ width: "100%", marginTop: 8 }}>
                    {[
                      { key: "technical", label: "Technical", value: technical },
                      { key: "problemSolving", label: "Problem Solving", value: problemSolving },
                      { key: "collaboration", label: "Collaboration", value: collaboration },
                      { key: "communication", label: "Communication", value: communication },
                    ].map((metric) => (
                      <div key={`${application.id}-${metric.key}`} className={styles.breakdownRow}>
                        <span className={styles.breakdownLabel}>{metric.label}</span>
                        <Progress percent={metric.value} showInfo={false} size="small" style={{ flex: 1 }} />
                        <span className={styles.breakdownValue}>{metric.value}</span>
                      </div>
                    ))}
                  </Space>
                </div>
                <div className={styles.appActions}>
                  <Button icon={<Eye size={14} />} block>
                    View Application
                  </Button>
                  <Button
                    icon={<MessageSquare size={14} />}
                    block
                    onClick={() => openEmailModal(application)}
                  >
                    Message
                  </Button>
                  <Button icon={<Calendar size={14} />} block>
                    Schedule
                  </Button>
                  <Select
                    style={{ width: "100%" }}
                    value={statusLabelToValue[application.status] ?? 0}
                    options={statusOptions}
                    loading={updatingApplicationId === application.id}
                    onChange={(value) =>
                      void handleStatusChange(application, value)
                    }
                  />
                  {application.resumeStoredFileId ? (
                    <a href={application.resumeStoredFileId} target="_blank" rel="noreferrer">
                      <Button block>
                        Open Resume
                      </Button>
                    </a>
                  ) : null}
                </div>
              </div>
              {application.isPublicApplication && (application.aiVerdict || responseEntries.length > 0) ? (
                <div>
                  <Typography.Text strong>Application Insights</Typography.Text>
                  <Space direction="vertical" size={8} style={{ width: "100%", marginTop: 8 }}>
                    {application.aiVerdict ? (
                      <div className={styles.applicationItem}>
                        <Typography.Text strong>Verdict</Typography.Text>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>
                          <TrendingUp size={12} style={{ marginRight: 6 }} />
                          {application.aiVerdict}
                        </Typography.Paragraph>
                      </div>
                    ) : null}
                    {responseEntries.map((entry) => (
                      <div key={`${application.id}-${entry.key}`} className={styles.applicationItem}>
                        <Typography.Text strong>{entry.key}</Typography.Text>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>
                          {entry.value}
                        </Typography.Paragraph>
                      </div>
                    ))}
                  </Space>
                </div>
              ) : null}
            </div>
              );
            })()}
          </Card>
        ))}
      </Space>
    </div>
    <Modal
      title={emailTarget ? `Email ${emailTarget.candidateName}` : "Email Applicant"}
      open={isEmailModalOpen}
      onCancel={() => setIsEmailModalOpen(false)}
      onOk={() => void handleSendEmail()}
      okText="Send Email"
      confirmLoading={sendingEmail}
      destroyOnClose
    >
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Typography.Text type="secondary">
          To: {emailTarget?.candidateEmail || "No email"}
        </Typography.Text>
        <Input
          value={emailDraft.subject}
          onChange={(event) =>
            setEmailDraft((prev) => ({ ...prev, subject: event.target.value }))
          }
          placeholder="Email subject"
        />
        <Input.TextArea
          rows={8}
          value={emailDraft.message}
          onChange={(event) =>
            setEmailDraft((prev) => ({ ...prev, message: event.target.value }))
          }
          placeholder="Write your message..."
        />
      </Space>
    </Modal>
    </>
  );
};

export default JobApplicationsPage;
