export interface IAiVizTotals {
  totalApplications: number;
  openPositions: number;
  assessmentCompletion: number;
  avgAssessmentTurnaround: number;
  offerAcceptance: number;
  shortlisted: number;
  approved: number;
}

export interface IAiVizTrendPoint {
  monthLabel: string;
  applications: number;
  progressed: number;
  hires: number;
}

export interface IAiVizPipelinePoint {
  key: string;
  label: string;
  value: number;
  percentage: number;
}

export interface IAiVizQuality {
  matchAvg: number;
  assessmentAvg: number;
  strongRate: number;
  roleSpeed: Array<{ role: string; days: number }>;
}

export interface IAiVizSourcePoint {
  source: string;
  count: number;
  percentage: number;
}

export const buildReportSnapshotJson = ({
  totals,
  trends,
  pipeline,
  quality,
  sources,
}: {
  totals: IAiVizTotals;
  trends: IAiVizTrendPoint[];
  pipeline: IAiVizPipelinePoint[];
  quality: IAiVizQuality;
  sources: IAiVizSourcePoint[];
}) =>
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    totals: {
      totalApplications: totals.totalApplications,
      openPositions: totals.openPositions,
      assessmentCompletion: Number(totals.assessmentCompletion.toFixed(2)),
      avgAssessmentTurnaround: Number(totals.avgAssessmentTurnaround.toFixed(2)),
      offerAcceptance: Number(totals.offerAcceptance.toFixed(2)),
      shortlisted: totals.shortlisted,
      approved: totals.approved,
    },
    trends,
    pipeline,
    quality: {
      matchAvg: Number(quality.matchAvg.toFixed(2)),
      assessmentAvg: Number(quality.assessmentAvg.toFixed(2)),
      strongRate: Number(quality.strongRate.toFixed(2)),
      roleSpeed: quality.roleSpeed.map((item) => ({
        role: item.role,
        days: Number(item.days.toFixed(2)),
      })),
    },
    sources,
  });

export const parseOptionJson = (
  optionJson: string,
): Record<string, unknown> | null => {
  if (!optionJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(optionJson) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};
