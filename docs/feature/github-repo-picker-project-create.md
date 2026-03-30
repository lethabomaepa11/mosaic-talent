# GitHub Repo Picker for Project Creation

## Summary

Project creation now requires a connected GitHub account and a selected repository from that account.

Instead of manually entering a GitHub URL, developers:

1. Connect GitHub (OAuth connect mode).
2. Fetch and select one of their repositories.
3. Optionally create a new repository inline if none exists.

## Backend Changes

## Developer model

- Added encrypted GitHub access token storage to `Developer`:
  - `GithubAccessTokenEncrypted`
  - `GithubAccessTokenUpdatedAt`

This allows authenticated GitHub API calls for repository listing/creation.

## OAuth flow updates

- `GET /api/TokenAuth/GitHubAuth` now supports:
  - `mode=connect` (requests repo scope)
  - `returnPath` (redirect target after callback)
- Callback now stores GitHub access token on the developer profile.
- Connect-mode callback redirects back to app route with:
  - `githubConnected=1` on success
  - `githubConnected=0&githubConnectError=<code>` on failure

## DeveloperProject API additions

- `GET /api/services/app/DeveloperProject/GetGithubConnectionStatus`
- `GET /api/services/app/DeveloperProject/GetMyGithubRepositories`
- `POST /api/services/app/DeveloperProject/CreateGithubRepository`

## CreateProject enforcement

- `CreateProject` now requires `GithubRepo`.
- Selected repo is validated against repositories returned by GitHub for the connected account.
- Stored project repo is normalized to canonical HTML URL (`https://github.com/<owner>/<repo>`).

## Frontend Changes

Updated `/app/projects/my` create modal flow:

- If GitHub is not connected:
  - show connect gate
  - disable project creation submit
- If connected:
  - fetch repositories
  - render typed repo autocomplete (fullName values)
  - allow refresh
  - allow inline repository creation
- After creating a repo:
  - refresh list
  - auto-select the new repo

## Testing

## Unit tests

- Added provider tests for:
  - GitHub connection status fetch
  - GitHub repository fetch
  - GitHub repository creation

File:

- `frontend/src/providers/project-provider/__tests__/ProjectProvider.test.tsx`

## Playwright E2E

Added E2E coverage for:

1. Connect gate when GitHub is not connected.
2. Project creation with selected repository.
3. Inline repository creation and auto-selection.

Files:

- `frontend/playwright.config.ts`
- `frontend/e2e/project-create-github.spec.ts`

## CI Workflow

Frontend CI now runs:

1. `npm test` (unit)
2. `npm run build`
3. `npx playwright install --with-deps chromium`
4. `npm run test:e2e`

## Migration Note

Model changes were made on `Developer` for GitHub token persistence.

Run migrations manually in `aspnet-core` after pulling this branch.
