# Agent Issue Template Workflow

## Summary

Agent workflow rules require a tracked issue before application code changes begin. Reuse an existing user-written issue when it covers the work. Only new issues must follow repository issue templates.

## Rules Added

- Reuse existing issues without creating duplicates or requiring the user to reformat them.
- For new issues, use `.github/ISSUE_TEMPLATE/bug_report.md` for bug-fix work.
- For new issues, use `.github/ISSUE_TEMPLATE/feature_request.md` for feature, refactor, and chore work.
- Keep new issue body sections aligned with the selected template.
- See [Issue-Driven V1 Workflow](issue-driven-v1-workflow.md) for priority selection, discovered issues, and approval boundaries.

## CLI Guidance

Preferred GitHub CLI usage:

- `gh issue create --template bug_report.md --title "<title>"`
- `gh issue create --template feature_request.md --title "<title>"`

If non-interactive CLI mode blocks `--template` with `--body`, issue creation may use `--body` with the same section structure as the selected template.

## Why

This preserves the user's backlog, keeps new issue reports consistent, and improves traceability from issue to branch to PR.
