"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Input,
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
  Search,
  Users,
} from "lucide-react";
import { toast } from "@/components/providers";
import {
  IJob,
  IJobApplication,
  IJobCandidate,
  useJobAction,
  useJobState,
} from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";
import { GithubOutlined } from "@ant-design/icons";

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

const parseApplicationResponses = (json?: string) => {
  if (!json) {
    return [] as Array<{ key: string; value: string }>;
  }

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return Object.entries(parsed)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0)
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
    fetchCandidatesDirectory,
  } = useJobAction();

  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applications, setApplications] = useState<IJobApplication[]>([]);
  const [candidates, setCandidates] = useState<IJobCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingApplicationId, setUpdatingApplicationId] = useState("");

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

  useEffect(() => {
    if (!isCompanyTenant) {
      return;
    }

    const loadCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const result = await fetchCandidatesDirectory();
        setCandidates(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to load candidates.";
        toast.error("Load failed", message);
      } finally {
        setLoadingCandidates(false);
      }
    };

    void loadCandidates();
  }, [isCompanyTenant]);

  const selectedJob = useMemo<IJob | undefined>(() => {
    return jobs.find((job) => job.id === jobId);
  }, [jobs, jobId]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        application.candidateName.toLowerCase().includes(q) ||
        application.candidateEmail.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

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
            placeholder="Search by candidate name or email..."
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
              return (
            <div className={styles.sidePanel}>
              <div>
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
                    <Tag>{application.source}</Tag>
                    <Tag color="blue">{application.status}</Tag>
                    <Tag color={application.isPublicApplication ? "purple" : "default"}>
                      {application.isPublicApplication ? "Public form" : "Member form"}
                    </Tag>
                    <Typography.Text className={styles.score}>
                      Match {application.matchScore.toFixed(1)}%
                    </Typography.Text>
                  </Space>
                </div>
                <Typography.Paragraph
                  style={{ marginTop: 12, marginBottom: 0 }}
                >
                  {application.matchReason || "No match reason provided yet."}
                </Typography.Paragraph>
                {responseEntries.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <Typography.Text strong>Custom Responses</Typography.Text>
                    <Space direction="vertical" size={8} style={{ width: "100%", marginTop: 8 }}>
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
              <div>
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
                  <Button style={{ marginTop: 8 }} block>
                    Resume: {application.resumeStoredFileId}
                  </Button>
                ) : null}
              </div>
            </div>
              );
            })()}
          </Card>
        ))}
      </Space>

      <Card>
        <div className={styles.cardHeader}>
          <div>
            <Typography.Title level={4}>Candidate Directory</Typography.Title>
            <Typography.Text className={styles.meta}>
              Shared developer pool from tenant 1, visible to every company
              tenant.
            </Typography.Text>
          </div>
          <Tag>{candidates.length} candidates</Tag>
        </div>

        {loadingCandidates ? <Spin style={{ marginTop: 16 }} /> : null}
        {!loadingCandidates && candidates.length === 0 ? (
          <Empty description="No candidates found." />
        ) : null}

        <div className={styles.candidateGrid}>
          {candidates.map((candidate) => (
            <div key={candidate.developerId} className={styles.candidateCard}>
              <div className={styles.candidateAvatar}>
                {(candidate.fullName || "Candidate")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <Typography.Text strong>
                  {candidate.fullName || "Candidate"}
                </Typography.Text>
                <Typography.Paragraph className={styles.meta}>
                  {candidate.email || "No email"}
                </Typography.Paragraph>
                <Space size={4} wrap>
                  {candidate.githubUsername ? (
                    <Tag icon={<GithubOutlined size={12} />}>
                      {candidate.githubUsername}
                    </Tag>
                  ) : null}
                </Space>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default JobApplicationsPage;
