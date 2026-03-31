# Repo Safety Scan

## Overview

Projects can be scanned on-demand against scanrepo.dev to evaluate repository risk before a developer joins. The scan runs when requested from the UI and is not persisted in the database.

## User Flow

- Open projects: each project card exposes a  Check Repo Safety action for GitHub-linked projects.
- Project detail: the Repo Safety card runs the scan and shows the latest risk level, score, and findings.
- Results are client-side only; leaving the page clears the scan state.

## API

### Request

POST /api/services/app/DeveloperProject/ScanRepoSafety

Payload:

`json
{
  projectId: <guid>
}
`

### Response (normalized)

`json
{
  progress: [{ step: Checking cache..., progress: 5 }],
  result: {
    repoUrl: https://github.com/<owner>/<repo>,
    riskScore: 12,
    riskLevel: low,
    categories: [],
    findings: [],
    badges: [],
    scannedAt: 2026-03-31T09:56:02.258Z
  }
}
`

## Implementation Notes

- The backend validates the project exists and requires a GitHub repository URL.
- ScanRepoSafety calls https://www.scanrepo.dev/api/scan and parses progress/result payloads.
- No database fields are added; scans are on-demand and per-session.

## UI Placement

- Project card: Safe/Risk tag and scan action.
- Project detail: Repo Safety card shows progress, risk score, badges, and findings.
