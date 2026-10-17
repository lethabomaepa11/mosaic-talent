# Issue #102: OAuth logout retains the server session cookie

Filed as [#102](https://github.com/lethabomaepa11/mosaic-talent/issues/102) on 2026-10-12 after checking open and closed issues; the related #43 concerns production login cookie domains rather than logout. The title and body below match the filed report. No assignee or milestone was changed.

Filed title: Clear OAuth session cookies on logout

**Describe the bug**

The auth provider's logout action deletes only the frontend access-token cookie. GitHub callback also writes an HttpOnly backend access-token cookie, which remains available to `GetAccessToken`. Session restoration can therefore sign an OAuth user back in after logout and refresh. This is confirmed by code inspection; the real-browser reproduction below still needs verification.

**To Reproduce**

1. Sign in with GitHub, or connect GitHub while signed in.
2. Log out through the application.
3. Refresh or reopen the application while the backend OAuth cookie remains valid.
4. Observe that auth restoration calls `GetAccessToken`, receives the retained token, and may restore the previous account.

**Expected behavior**

Logout clears both frontend authentication and backend OAuth bootstrap cookies. Refresh stays signed out. Logging into another account must not later restore the old OAuth account.

**Screenshots**

Not applicable to code inspection. Attach browser evidence when reproducing; exclude tokens and cookie values.

**Desktop (please complete the following information):**

- OS: Windows development environment; affected browser reproduction pending.
- Browser: pending verification.
- Version: pending verification.

**Smartphone (please complete the following information):**

- Device: not yet tested.
- OS: not yet tested.
- Browser: not yet tested.
- Version: not yet tested.

**Additional context**

Discovered during [#94](https://github.com/lethabomaepa11/mosaic-talent/issues/94). Suggested priority: high for real-user onboarding because it undermines explicit logout and safe account switching. Suggested owner: agent for an engineering fix; no GitHub assignment has been changed.

Evidence: `frontend/src/providers/auth-provider/index.tsx` calls `removeAuthToken` without a backend logout request; `frontend/src/utils/axiosInstance.ts` deletes only `mosaic-talent.access-token`; `TokenAuthController.GitHub.cs` issues HttpOnly server cookies; `TokenAuthController.cs` returns the server token from `GetAccessToken`.

Suggested scope: add a backend logout action that expires OAuth token/tenant cookies with matching path/domain settings, invoke it through the auth provider with credentialed requests, and clear frontend state on logout. Define retry behavior for a failed backend logout. Review token revocation separately if required by the authentication policy.

Acceptance criteria: OAuth login and connection users remain signed out after refresh; email/password logout still works; switching accounts does not restore stale identity; unit and browser tests cover cookie clearing and failures. Implementation requires a separate approved plan.
