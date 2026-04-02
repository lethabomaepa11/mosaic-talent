"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  Input,
  message,
  Progress,
  Space,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from "antd";
import dynamic from "next/dynamic";
import {
  FileSpreadsheet,
  FileText,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Briefcase,
  Clock,
} from "lucide-react";
import {
  IAIReportVisualizationResult,
  useJobAction,
  useJobState,
  IJobApplication,
} from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { buildReportSnapshotJson, parseOptionJson } from "./aiViz";

type TrendPoint = {
  monthLabel: string;
  applications: number;
  progressed: number;
  hires: number;
};

type ExportRow = Record<string, string | number>;

type ParsedChart = {
  id: string;
  title: string;
  description: string;
  option: Record<string, unknown>;
};

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
});

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

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const buildTimestampSuffix = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
};

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read image"));
    };
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(blob);
  });

const CompanyReportsDashboard = () => {
  const { styles } = useStyles();
  const router = useRouter();
  const { tenancyName, companyName, companyLogoUrl } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);
  const { jobs } = useJobState();
  const {
    fetchMyJobs,
    fetchJobApplications,
    generateReportVisualizationWithAi,
  } = useJobAction();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<IJobApplication[]>([]);
  const [loadedSignature, setLoadedSignature] = useState("");
  const [aiPrompt, setAiPrompt] = useState(
    "Show unconventional patterns and hidden hiring bottlenecks using this data.",
  );
  const [aiVizLoading, setAiVizLoading] = useState(false);
  const [aiVizError, setAiVizError] = useState("");
  const [aiVizResult, setAiVizResult] =
    useState<IAIReportVisualizationResult | null>(null);

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

  const overviewRows = useMemo<ExportRow[]>(
    () => [
      { Metric: "Total Applications", Value: totals.totalApplications },
      { Metric: "Open Positions", Value: totals.openPositions },
      {
        Metric: "Assessment Completion",
        Value: formatPercent(totals.assessmentCompletion),
      },
      {
        Metric: "Avg Assessment Turnaround (days)",
        Value: totals.avgAssessmentTurnaround.toFixed(1),
      },
      { Metric: "Offer Acceptance", Value: formatPercent(totals.offerAcceptance) },
      { Metric: "Shortlisted", Value: totals.shortlisted },
      { Metric: "Hired", Value: totals.approved },
    ],
    [totals],
  );

  const trendRows = useMemo<ExportRow[]>(
    () =>
      trends.map((point) => ({
        Month: point.monthLabel,
        Applications: point.applications,
        Progressed: point.progressed,
        Hires: point.hires,
      })),
    [trends],
  );

  const pipelineRows = useMemo<ExportRow[]>(
    () =>
      pipeline.map((item) => ({
        Stage: item.label,
        Applications: item.value,
        Percentage: `${item.percentage}%`,
      })),
    [pipeline],
  );

  const qualityRows = useMemo<ExportRow[]>(
    () => [
      { Metric: "Avg Match Score", Value: formatPercent(quality.matchAvg) },
      {
        Metric: "Avg Assessment Score",
        Value: formatPercent(quality.assessmentAvg),
      },
      { Metric: "Strong Verdict Rate", Value: formatPercent(quality.strongRate) },
    ],
    [quality],
  );

  const roleSpeedRows = useMemo<ExportRow[]>(
    () =>
      quality.roleSpeed.map((item) => ({
        Role: item.role,
        "Avg Days": item.days.toFixed(1),
      })),
    [quality.roleSpeed],
  );

  const sourceRows = useMemo<ExportRow[]>(
    () =>
      sources.map((item) => ({
        Source: item.source,
        Applications: item.count,
        Percentage: `${item.percentage}%`,
      })),
    [sources],
  );

  const reportSnapshotJson = useMemo(
    () =>
      buildReportSnapshotJson({
        totals,
        trends,
        pipeline,
        quality,
        sources,
      }),
    [pipeline, quality, sources, totals, trends],
  );

  const aiCharts = useMemo<ParsedChart[]>(
    () =>
      (aiVizResult?.charts ?? [])
        .map((chart, index) => {
          const option = parseOptionJson(chart.optionJson);
          if (!option) {
            return null;
          }

          return {
            id: chart.id || `chart-${index + 1}`,
            title: chart.title || "AI chart",
            description: chart.description || "",
            option,
          } as ParsedChart;
        })
        .filter((chart): chart is ParsedChart => Boolean(chart)),
    [aiVizResult],
  );

  const handleGenerateAiVisualization = async () => {
    const trimmed = aiPrompt.trim();
    if (!trimmed) {
      message.error("Add a prompt for AI visualisation.");
      return;
    }

    setAiVizLoading(true);
    setAiVizError("");
    try {
      const result = await generateReportVisualizationWithAi({
        prompt: trimmed,
        reportSnapshotJson,
      });
      setAiVizResult(result);
      message.success("AI visualisation generated.");
    } catch (error) {
      const details =
        error instanceof Error
          ? error.message
          : "Could not generate visualisation.";
      setAiVizError(details);
      message.error("AI visualisation failed.");
    } finally {
      setAiVizLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const sheets: Array<{ name: string; rows: ExportRow[] }> = [
        { name: "Overview", rows: overviewRows },
        { name: "Trends", rows: trendRows },
        { name: "Pipeline", rows: pipelineRows },
        { name: "Quality", rows: qualityRows },
        { name: "RoleSpeed", rows: roleSpeedRows },
        { name: "Sources", rows: sourceRows },
      ];

      sheets.forEach((sheet) => {
        const rows = sheet.rows.length > 0 ? sheet.rows : [{ Info: "No data" }];
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      });

      const fileName = `company-reports-${buildTimestampSuffix()}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      message.success("Excel report exported.");
    } catch {
      message.error("Could not export Excel report.");
    }
  };

  const handleExportPdf = async () => {
    try {
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 40;
      let cursorY = 40;

      if (companyLogoUrl) {
        try {
          const response = await fetch(companyLogoUrl);
          if (response.ok) {
            const imageBlob = await response.blob();
            const dataUrl = await toDataUrl(imageBlob);
            const isPng = dataUrl.startsWith("data:image/png");
            pdf.addImage(dataUrl, isPng ? "PNG" : "JPEG", marginX, cursorY, 64, 64);
            cursorY += 76;
          }
        } catch {
          // Keep export available even when logo retrieval fails.
        }
      }

      const drawTitle = (text: string) => {
        pdf.setFontSize(16);
        pdf.text(text, marginX, cursorY);
        cursorY += 20;
      };

      const drawTable = (title: string, rows: ExportRow[]) => {
        if (cursorY > 700) {
          pdf.addPage();
          cursorY = 40;
        }

        pdf.setFontSize(12);
        pdf.text(title, marginX, cursorY);
        cursorY += 8;

        const normalizedRows = rows.length > 0 ? rows : [{ Info: "No data" }];
        const headers = Object.keys(normalizedRows[0]);
        autoTable(pdf, {
          startY: cursorY,
          head: [headers],
          body: normalizedRows.map((row) =>
            headers.map((header) => String(row[header] ?? "")),
          ),
          margin: { left: marginX, right: marginX },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [22, 119, 255] },
        });

        cursorY = ((pdf as unknown as { lastAutoTable?: { finalY?: number } })
          .lastAutoTable?.finalY ?? cursorY) + 20;
      };

      drawTitle(`${companyName || "Company"} Reports`);
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, marginX, cursorY);
      cursorY += 20;

      drawTable("Overview", overviewRows);
      drawTable("Hiring Trend", trendRows);
      drawTable("Recruitment Pipeline", pipelineRows);
      drawTable("Quality Metrics", qualityRows);
      drawTable("Role Turnaround", roleSpeedRows);
      drawTable("Application Sources", sourceRows);

      if (topSource) {
        if (cursorY > 760) {
          pdf.addPage();
          cursorY = 40;
        }
        pdf.setFontSize(11);
        pdf.text(
          `Top Source Insight: ${topSource.source} (${topSource.count} applications, ${topSource.percentage}%)`,
          marginX,
          cursorY,
        );
      }

      pdf.save(`company-reports-${buildTimestampSuffix()}.pdf`);
      message.success("PDF report exported.");
    } catch {
      message.error("Could not export PDF report.");
    }
  };

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
            icon={<FileText size={14} />}
            data-ai-action="export-reports-pdf"
            onClick={handleExportPdf}
          >
            Export PDF
          </Button>
          <Button
            icon={<FileSpreadsheet size={14} />}
            data-ai-action="export-reports-excel"
            onClick={handleExportExcel}
          >
            Export Excel
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
          {
            key: "ai-viz-lab",
            label: "AI Viz Lab",
            children: (
              <div className={styles.aiTabWrap}>
                <Card
                  title="Experimental Data Visualisation"
                  className={styles.chartCard}
                >
                  <div className={styles.aiPromptRow}>
                    <Input.TextArea
                      value={aiPrompt}
                      onChange={(event) => setAiPrompt(event.target.value)}
                      autoSize={{ minRows: 3, maxRows: 5 }}
                      placeholder="Ask AI for any visual story, for example: reveal hidden quality-risk clusters by source and role."
                    />
                    <Button
                      type="primary"
                      icon={<Sparkles size={14} />}
                      loading={aiVizLoading}
                      onClick={handleGenerateAiVisualization}
                    >
                      Generate Visualisation
                    </Button>
                  </div>
                  {aiVizError ? (
                    <Alert
                      className={styles.aiError}
                      type="error"
                      showIcon
                      message={aiVizError}
                    />
                  ) : null}
                  {aiVizResult?.summary ? (
                    <Typography.Paragraph className={styles.aiSummary}>
                      {aiVizResult.summary}
                    </Typography.Paragraph>
                  ) : null}
                </Card>

                {aiVizLoading ? (
                  <div className={styles.aiLoadingWrap}>
                    <Spin size="large" />
                  </div>
                ) : aiCharts.length === 0 ? (
                  <Card className={styles.chartCard}>
                    <Empty description="Generate AI visualisations to explore experimental chart views." />
                  </Card>
                ) : (
                  <div className={styles.aiChartsGrid}>
                    {aiCharts.map((chart) => (
                      <Card
                        key={chart.id}
                        title={chart.title}
                        className={styles.chartCard}
                      >
                        {chart.description ? (
                          <Typography.Paragraph className={styles.aiChartDescription}>
                            {chart.description}
                          </Typography.Paragraph>
                        ) : null}
                        <div className={styles.aiChartCanvas}>
                          <ReactECharts
                            option={chart.option}
                            style={{ height: "100%", width: "100%" }}
                            notMerge
                            lazyUpdate
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default CompanyReportsDashboard;
