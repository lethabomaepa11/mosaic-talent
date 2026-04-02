# Company AI Viz Lab

## Summary

Added an experimental AI-driven visualisation tab to the company analytics dashboard so teams can request dynamic chart views from existing report data.

## What Changed

- Added a new dashboard tab: `AI Viz Lab`.
- Users can provide a prompt describing the type of visual analysis they want.
- The frontend sends current report snapshot data and prompt to a new backend AI endpoint.
- AI response returns one or more chart configurations rendered with ECharts.
- Added resilient fallback charts when AI output is unavailable or invalid.
- Added server-side sanitization and validation for chart options before returning to the client.

## Backend

- New endpoint on `CompanyJobAppService`:
  - `POST /api/services/app/CompanyJob/GenerateReportVisualizationWithAi`
- New DTOs:
  - `GenerateReportVisualizationWithAiInput`
  - `GenerateReportVisualizationWithAiDto`
  - `AiVisualizationChartDto`
- Validation and sanitization:
  - prompt and snapshot length guards
  - snapshot JSON object validation
  - top-level ECharts option key allowlist
  - JSON depth, array, and object-size limits
  - removal of unsafe function/script-like strings

## Frontend

- Reports dashboard now includes `AI Viz Lab` tab with:
  - prompt editor
  - generate action
  - loading + error states
  - dynamic ECharts rendering for returned chart options
- Added provider action:
  - `generateReportVisualizationWithAi`

## Dependencies

- `echarts`
- `echarts-for-react`
