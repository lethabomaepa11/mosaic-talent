"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Empty,
  Progress,
  Space,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  Calendar,
  Download,
  Filter,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Briefcase,
  Clock,
} from "lucide-react";
import {
  useJobAction,
  useJobState,
  IJobApplication,
} from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

type TrendPoint = {
  monthLabel: string;
  applications: number;
  progressed: number;
  hires: number;
};

const asStatus = (value: string) => (value ?? "").trim().toLowerCase();

const isProgressedStatus = (status: string) => {
  const normalized = asStatus(status);
  return ["shortlisted", "assessment", "interview", "approved"].includes(
    normalized,
  );
};

const isHireStatus = (status: string) => asStatus(status) === "approved";

const toDays = (from: string, to: string) => {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return (end - start) / (1000 * 60 * 60 * 24);
};

const CompanyReportsDashboard = () => {
  const { styles } = useStyles();
  const router = useRouter();
  const { tenancyName } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);
  const { jobs } = useJobState();
  const { fetchMyJobs, fetchJobApplications } = useJobAction();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<IJobApplication[]>([]);
  const [loadedSignature, setLoadedSignature] = useState("");

  useEffect(() => {
    if (!isCompanyTenant) {
      router.replace("/app");
      return;
    }

    void fetchMyJobs();
  }, [isCompanyTenant, router]);

  const jobSignature = useMemo(
    () =>
      jobs
        .map((job) => job.id)
        .sort()
        .join("|"),
    [jobs],
  );

  useEffect(() => {
    if (!isCompanyTenant) {
      return;
    }

    if (!jobSignature) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApplications([]);
      setLoading(false);
      return;
    }

    if (jobSignature === loadedSignature) {
      return;
    }

    const load = async () => {
      setLoading(true);
      const buckets: IJobApplication[] = [];
      for (const job of jobs) {
        try {
          const list = await fetchJobApplications(job.id);
          buckets.push(...list);
        } catch {
          // Keep dashboard usable even when one job fails to load.
        }
      }

      setApplications(buckets);
      setLoadedSignature(jobSignature);
      setLoading(false);
    };

    void load();
  }, []);

  const jobById = useMemo(() => {
    const map = new Map<string, string>();
    jobs.forEach((job) => map.set(job.id, job.title));
    return map;
  }, [jobs]);

  const totals = useMemo(() => {
    const totalApplications = applications.length;
    const openPositions = jobs.filter((job) => job.isOpen).length;
    const assessmentsSubmitted = applications.filter((item) =>
      Boolean(item.assessmentSubmittedAt),
    ).length;
    const approved = applications.filter((item) =>
      isHireStatus(item.status),
    ).length;
    const shortlisted = applications.filter(
      (item) => asStatus(item.status) === "shortlisted",
    ).length;
    const rejected = applications.filter(
      (item) => asStatus(item.status) === "rejected",
    ).length;
    const offerAcceptanceBase = approved + rejected;
    const offerAcceptance =
      offerAcceptanceBase > 0 ? (approved / offerAcceptanceBase) * 100 : 0;
    const assessmentCompletion =
      totalApplications > 0
        ? (assessmentsSubmitted / totalApplications) * 100
        : 0;

    const assessmentDurations = applications
      .map((item) =>
        item.assessmentSubmittedAt
          ? toDays(item.createdAt, item.assessmentSubmittedAt)
          : null,
      )
      .filter((value): value is number => typeof value === "number");
    const avgAssessmentTurnaround =
      assessmentDurations.length > 0
        ? assessmentDurations.reduce((acc, value) => acc + value, 0) /
          assessmentDurations.length
        : 0;

    return {
      totalApplications,
      openPositions,
      assessmentCompletion,
      avgAssessmentTurnaround,
      offerAcceptance,
      approved,
      shortlisted,
    };
  }, [applications, jobs]);

  const trends = useMemo<TrendPoint[]>(() => {
    const now = new Date();
    const points: TrendPoint[] = [];

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      points.push({
        monthLabel: d.toLocaleDateString(undefined, { month: "short" }),
        applications: 0,
        progressed: 0,
        hires: 0,
      });
    }

    applications.forEach((item) => {
      const date = new Date(item.createdAt);
      const slot = points.find(
        (_, idx) =>
          date.getMonth() ===
            new Date(
              now.getFullYear(),
              now.getMonth() - (5 - idx),
              1,
            ).getMonth() &&
          date.getFullYear() ===
            new Date(
              now.getFullYear(),
              now.getMonth() - (5 - idx),
              1,
            ).getFullYear(),
      );
      if (!slot) return;

      slot.applications += 1;
      if (isProgressedStatus(item.status)) slot.progressed += 1;
      if (isHireStatus(item.status)) slot.hires += 1;
    });

    return points;
  }, [applications]);

  const pipeline = useMemo(() => {
    const total = applications.length || 1;
    const count = (status: string) =>
      applications.filter((item) => asStatus(item.status) === status).length;

    const rows = [
      { key: "applied", label: "Applied", value: count("applied") },
      { key: "shortlisted", label: "Shortlisted", value: count("shortlisted") },
      { key: "assessment", label: "Assessment", value: count("assessment") },
      { key: "interview", label: "Interview", value: count("interview") },
      { key: "approved", label: "Hired", value: count("approved") },
      { key: "rejected", label: "Rejected", value: count("rejected") },
    ];

    return rows.map((row) => ({
      ...row,
      percentage: Math.round((row.value / total) * 100),
    }));
  }, [applications]);

  const sources = useMemo(() => {
    const grouped = new Map<string, number>();
    applications.forEach((item) => {
      const source = (item.source ?? "other").trim() || "other";
      grouped.set(source, (grouped.get(source) ?? 0) + 1);
    });

    const total = applications.length || 1;
    return Array.from(grouped.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [applications]);

  const quality = useMemo(() => {
    const validMatch = applications
      .map((item) => item.matchScore)
      .filter((value): value is number => Number.isFinite(value));
    const validAssessment = applications
      .map((item) => item.assessmentScore)
      .filter((value): value is number => Number.isFinite(value));
    const withAssessmentVerdict = applications.filter((item) =>
      Boolean(item.assessmentVerdict),
    );
    const strongVerdicts = withAssessmentVerdict.filter((item) => {
      const verdict = (item.assessmentVerdict ?? "").toLowerCase();
      return (
        verdict.includes("strong") ||
        verdict.includes("approved") ||
        verdict.includes("pass")
      );
    }).length;

    const matchAvg =
      validMatch.length > 0
        ? validMatch.reduce((acc, value) => acc + value, 0) / validMatch.length
        : 0;
    const assessmentAvg =
      validAssessment.length > 0
        ? validAssessment.reduce((acc, value) => acc + value, 0) /
          validAssessment.length
        : 0;
    const strongRate =
      withAssessmentVerdict.length > 0
        ? (strongVerdicts / withAssessmentVerdict.length) * 100
        : 0;

    const roleSpeed = Array.from(
      applications.reduce((acc, item) => {
        if (!item.assessmentSubmittedAt) return acc;
        const title = jobById.get(item.jobId) ?? "Unknown Role";
        const days = toDays(item.createdAt, item.assessmentSubmittedAt);
        if (days === null) return acc;
        const current = acc.get(title) ?? [];
        current.push(days);
        acc.set(title, current);
        return acc;
      }, new Map<string, number[]>()),
    )
      .map(([role, days]) => ({
        role,
        days: days.reduce((acc, value) => acc + value, 0) / days.length,
      }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);

    return {
      matchAvg,
      assessmentAvg,
      strongRate,
      roleSpeed,
    };
  }, [applications, jobById]);

  const topSource = sources[0];

  if (!isCompanyTenant) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.emptyWrap}>
        <Spin size="large" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <Empty description="Create jobs first to unlock analytics." />
      </div>
    );
  }

  return (
    <div className={styles.page} data-ai-page="dashboard">
      <div className={styles.header}>
        <div>
          <Typography.Title level={2} className={styles.title}>
            Company Analytics
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            Live hiring intelligence from your jobs, applications, assessments,
            and outcomes.
          </Typography.Paragraph>
        </div>
        <div className={styles.headerActions}>
          <Button
            icon={<Calendar size={14} />}
            data-ai-action="set-report-range"
          >
            Last 6 months
          </Button>
          <Button icon={<Filter size={14} />} data-ai-action="filter-reports">
            Filter
          </Button>
          <Button icon={<Download size={14} />} data-ai-action="export-reports">
            Export
          </Button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiBody}>
            <div>
              <Statistic
                title="Total Applications"
                value={totals.totalApplications}
              />
              <div className={styles.kpiMeta}>Across all company jobs</div>
            </div>
            <Users size={20} />
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiBody}>
            <div>
              <Statistic title="Open Positions" value={totals.openPositions} />
              <div className={styles.kpiMeta}>
                Active postings currently open
              </div>
            </div>
            <Briefcase size={20} />
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiBody}>
            <div>
              <Statistic
                title="Avg Assessment Turnaround"
                value={totals.avgAssessmentTurnaround.toFixed(1)}
                suffix="days"
              />
              <div className={styles.kpiMeta}>
                Created-to-submitted assessment cycle
              </div>
            </div>
            <Clock size={20} />
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiBody}>
            <div>
              <Statistic
                title="Offer Acceptance"
                value={totals.offerAcceptance.toFixed(1)}
                suffix="%"
              />
              <div className={styles.kpiMeta}>
                Approved vs rejected outcomes
              </div>
            </div>
            <Target size={20} />
          </div>
        </Card>
      </div>

      <Tabs
        className={styles.tabs}
        items={[
          {
            key: "overview",
            label: "Overview",
            children: (
              <div className={styles.panelGrid}>
                <Card
                  title="Hiring Trend (6 months)"
                  className={styles.chartCard}
                >
                  <div className={styles.rows}>
                    {trends.map((point) => {
                      const max = Math.max(
                        ...trends.map((x) => x.applications),
                        1,
                      );
                      const percent = Math.round(
                        (point.applications / max) * 100,
                      );
                      return (
                        <div key={point.monthLabel} className={styles.row}>
                          <span className={styles.rowLabel}>
                            {point.monthLabel}
                          </span>
                          <div className={styles.progressWrap}>
                            <Progress percent={percent} showInfo={false} />
                          </div>
                          <span className={styles.rowValue}>
                            {point.applications} apps
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card title="Hiring Momentum" className={styles.chartCard}>
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ width: "100%" }}
                  >
                    <Tag color="blue">Shortlisted: {totals.shortlisted}</Tag>
                    <Tag color="purple">
                      Assessments Submitted:{" "}
                      {
                        applications.filter((x) =>
                          Boolean(x.assessmentSubmittedAt),
                        ).length
                      }
                    </Tag>
                    <Tag color="green">Hired: {totals.approved}</Tag>
                    <Badge
                      className={
                        totals.assessmentCompletion >= 50
                          ? styles.badgeUp
                          : styles.badgeDown
                      }
                      count={
                        <span>
                          {totals.assessmentCompletion >= 50 ? (
                            <TrendingUp size={12} />
                          ) : (
                            <TrendingDown size={12} />
                          )}{" "}
                          {totals.assessmentCompletion.toFixed(1)}% completion
                        </span>
                      }
                    />
                  </Space>
                </Card>
              </div>
            ),
          },
          {
            key: "pipeline",
            label: "Pipeline",
            children: (
              <Card title="Recruitment Funnel" className={styles.chartCard}>
                <div className={styles.rows}>
                  {pipeline.map((item) => (
                    <div key={item.key} className={styles.row}>
                      <span className={styles.rowLabel}>{item.label}</span>
                      <div className={styles.progressWrap}>
                        <Progress percent={item.percentage} showInfo={false} />
                      </div>
                      <span className={styles.rowValue}>
                        {item.value} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ),
          },
          {
            key: "quality",
            label: "Quality Metrics",
            children: (
              <div className={styles.panelGrid}>
                <Card title="Quality Scoreboard" className={styles.chartCard}>
                  <div className={styles.kpiGrid}>
                    <Card>
                      <Statistic
                        title="Avg Match Score"
                        value={quality.matchAvg.toFixed(1)}
                        suffix="%"
                      />
                    </Card>
                    <Card>
                      <Statistic
                        title="Avg Assessment Score"
                        value={quality.assessmentAvg.toFixed(1)}
                        suffix="%"
                      />
                    </Card>
                    <Card>
                      <Statistic
                        title="Strong Verdict Rate"
                        value={quality.strongRate.toFixed(1)}
                        suffix="%"
                      />
                    </Card>
                  </div>
                </Card>
                <Card
                  title="Fastest Assessment Turnaround by Role"
                  className={styles.chartCard}
                >
                  {quality.roleSpeed.length === 0 ? (
                    <Empty description="No submitted assessments yet." />
                  ) : (
                    <div className={styles.rows}>
                      {quality.roleSpeed.map((item) => {
                        const max = Math.max(
                          ...quality.roleSpeed.map((x) => x.days),
                          1,
                        );
                        const inversePercent = Math.round(
                          (1 - item.days / max) * 100,
                        );
                        return (
                          <div key={item.role} className={styles.row}>
                            <span className={styles.rowLabel}>{item.role}</span>
                            <div className={styles.progressWrap}>
                              <Progress
                                percent={Math.max(5, inversePercent)}
                                showInfo={false}
                              />
                            </div>
                            <span className={styles.rowValue}>
                              {item.days.toFixed(1)} days
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            ),
          },
          {
            key: "sources",
            label: "Sources",
            children: (
              <div className={styles.panelGrid}>
                <Card title="Application Sources" className={styles.chartCard}>
                  {sources.length === 0 ? (
                    <Empty description="No source data yet." />
                  ) : (
                    <div className={styles.rows}>
                      {sources.map((item) => (
                        <div key={item.source} className={styles.row}>
                          <span className={styles.rowLabel}>{item.source}</span>
                          <div className={styles.progressWrap}>
                            <Progress
                              percent={item.percentage}
                              showInfo={false}
                            />
                          </div>
                          <span className={styles.rowValue}>
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                <Card title="Source Insight" className={styles.chartCard}>
                  {topSource ? (
                    <div className={styles.sourceHint}>
                      <div className={styles.sourceHintTitle}>
                        Top Channel: {topSource.source}
                      </div>
                      <p className={styles.sourceHintText}>
                        {topSource.count} applications ({topSource.percentage}%)
                        came from this channel. Prioritize this source for
                        near-term hiring velocity.
                      </p>
                    </div>
                  ) : (
                    <Empty description="No source insight available yet." />
                  )}
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default CompanyReportsDashboard;
