# GitHub Candidate Background Analysis

## Summary

Recruiters and HR can now get automated GitHub technical background insights for candidates, reducing manual repository review effort.

The analysis enriches candidate applications with:

- GitHub profile and repository metadata.
- Profile summary narrative (when available).
- README/documentation quality scoring.
- Source-level confidence and fallback status indicators.

## External Sources

- `https://api.github.com/users/{username}`
- `https://api.github.com/users/{username}/repos`
- `https://api.github.com/repos/{username}/{repo}/readme`
- `https://profile-summary-for-github.com/api/user/{username}`

## What Gets Analyzed

- Public repository footprint (count, stars, activity, language signals).
- Top technical language indicators from repositories.
- README quality dimensions (setup, usage, architecture, API docs, examples, testing, contribution/license, content depth).
- High-level profile summary text from profile-summary service.

## Resilient Fallbacks

When one or more external sources fail, the pipeline still returns partial, useful analysis:

- No username detected: skip external GitHub calls and continue with existing assessment heuristics.
- Profile-summary failure: continue with GitHub profile/repository data only.
- README fetch failure or unavailable README: compute documentation score from repository metadata fallback.
- API timeout/rate-limit/failure: preserve existing assessment behavior and add source status/confidence indicators.

## Returned Candidate Fields

Application DTOs now include:

- `aiGithubUsername`
- `aiGithubProfileSummary`
- `aiGithubDocumentationScore`
- `aiGithubDocumentationNotes`
- `aiGithubAnalysisConfidence`
- `aiGithubAnalysisSourceStatus`

These are shown in the candidate application detail view under **GitHub Technical Analysis**.
