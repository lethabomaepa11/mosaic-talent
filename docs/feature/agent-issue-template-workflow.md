# Agent Issue Template Workflow

## Summary

Agent workflow rules now require issue creation to follow repository issue templates before code changes begin.

## Rules Added

- Use `.github/ISSUE_TEMPLATE/bug_report.md` for bug-fix work.
- Use `.github/ISSUE_TEMPLATE/feature_request.md` for feature, refactor, and chore work.
- Keep issue body sections aligned with the selected template.

## CLI Guidance

Preferred GitHub CLI usage:

- `gh issue create --template bug_report.md --title "<title>"`
- `gh issue create --template feature_request.md --title "<title>"`

If non-interactive CLI mode blocks `--template` with `--body`, issue creation may use `--body` with the same section structure as the selected template.

## Why

This enforces consistent issue quality and improves traceability from issue to branch to PR.
