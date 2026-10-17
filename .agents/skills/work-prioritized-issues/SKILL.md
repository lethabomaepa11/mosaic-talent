---
name: work-prioritized-issues
description: Triage and implement Mosaic-Talent GitHub issues toward the real-user onboarding release. Use when asked to pick the next issue, work through the backlog, or report discovered issues; the user supplies the product backlog and the agent chooses work by priority and dependencies.
---

# Work Prioritized Issues

The user writes product issues. Select and complete focused work from that backlog to deliver a stable v1 for real user onboarding and usage. Create new issues only for distinct problems discovered during the work or an approved task with no existing issue.

## Read the live backlog

- Resolve the repository from `git remote`; do not assume a different repository or a fixed issue order.
- Read open issues, milestone descriptions, priority labels, assignees, comments, and linked pull requests. Exclude pull requests from issue lists and follow pagination.
- Prefer authenticated GitHub CLI access. Public API reads are an option for public repositories when CLI authentication is unavailable. Never expose tokens or infer that public reads permit writes.
- Inspect current code and related tests before treating an issue as unimplemented. Identify partial implementations, overlapping requests, existing branches, and work in progress.
- For this release, use the milestone named `MVP 1: Real user onboarding and usage` while it remains the active target. Refresh that choice when the user changes release scope.

## Choose the next issue

Respect explicit user ordering and existing priority labels. When no priority is specified, explain a proposed order using:

1. Release blockers: broken signup/login, onboarding completion, authorization, data integrity, or failures preventing real usage.
2. Prerequisites that unblock the selected issues.
3. The first useful user journey: create an account, complete basic onboarding, find or create a project, and collaborate.
4. Improvements to repeated use and feedback, followed by presentation polish.

Within a priority group, prefer work with greater user impact and fewer unresolved dependencies. Effort can break ties; it must not replace high-impact blockers with easy chores. Separate observed defects from inferred risk and record the reason for the selection.

Existing assignees do not automatically mean work is in progress. Check comments and linked PRs; coordinate before taking over someone else's active work, and preserve assignments unless a change is authorized. Do not rewrite the user's backlog or invent milestone membership or priority labels.

Keep a release queue in the feature documentation with issue links, proposed order, rationale, dependencies, and current state. Refresh it after each issue and before selecting the next one. Treat any recorded queue as a snapshot, not permanent instructions.

## Implement an approved issue

- Read root and nested `AGENTS.md` and [follow-git-workflow](../follow-git-workflow/SKILL.md), then applicable provider, auth, styling, or backend skills. Read installed Next.js guides before frontend code changes.
- Use the existing issue as the tracking issue; do not create a second issue for the same work or require the user to rewrite their issue into a template.
- Present a concrete plan with branch, affected files, acceptance criteria, endpoints, validation, and material uncertainties. Wait for explicit approval before implementation. A backlog-work request is not blanket approval for every future plan. If scope changes, present the updated plan and wait again.
- Branch from current `dev`, including the issue number in the branch name where useful. Keep unrelated work separate and preserve existing local changes.
- Keep API calls in providers, authentication real, and authenticated session state out of `localStorage`. Keep frontend routes responsive through their colocated `createStyles` styles.
- Validate the issue's acceptance criteria and relevant failure paths with the repository's actual test commands. For frontend flows, include Playwright coverage and 360px, 768px, and desktop checks, subject to any explicit user exceptions.
- Document decisions and behavior under `docs/feature/` and update root README links.
- Never run migration commands. If schema changes are needed, explain the required manual migration and stop short of claiming the feature is deployable until that dependency is resolved.
- After validation, provide concrete functional testing instructions and wait for the user's confirmation before commit, push, or PR, as required by the git workflow. Open PRs against `dev` with test evidence and `Closes #N` only when the full issue is addressed; use `Refs #N` for partial work.
- Distinguish implemented locally, validated, awaiting user testing, PR open, and merged. Do not close an issue or declare the release ready merely because local work is complete. Merging and deploying require their own authorization.

## Report discovered issues

The user permits creating GitHub issues for distinct problems found during this workflow. Search open and closed issues first to avoid duplicates or to identify a regression. Use the repository's bug or feature template for new issues and include:

- Reproduction steps or concrete code/test evidence, current behavior, and expected behavior.
- Effect on real-user onboarding or usage, proposed priority with rationale, and a link to the source issue.
- Suggested scope and acceptance criteria, plus dependencies or unresolved product decisions.
- Suggested owner: user for product decisions or external setup, agent for implementable engineering work. Do not assign a nonexistent agent account or change someone else's assignment without authorization.

File confirmed problems, not speculative improvements. When a discovery blocks the current issue, report it immediately and propose the necessary plan change. Otherwise keep it in the backlog and finish the approved scope. Creating an issue does not authorize implementing it.

When GitHub writes are unavailable, prepare the exact template-based issue draft in the work handoff and report that it has not been filed. Request the missing access without asking for credentials in chat. Check for a previously created issue before retrying an uncertain write; do not repeat a create request blindly.

## Handoff and continuation

Report the current issue and branch, implemented behavior, validation results and limits, discovered issue links or unfiled drafts, manual dependencies, and the next proposed issue. Record this in feature documentation when it is needed across sessions. Continue independent investigation while awaiting approval, but do not start dependent implementation or bypass user testing confirmation.

Release readiness means the agreed onboarding and first-use acceptance criteria work with real endpoints, mandatory checks pass, and remaining blockers are explicitly resolved or accepted by the user. An empty backlog alone does not prove readiness.
