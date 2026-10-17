import { type Page } from "@playwright/test";

export const setupOnboarding = async (page: Page, options: { authenticated?: boolean; connected?: boolean; step?: number; failRegistration?: boolean } = {}) => {
  let profile = {
    userId: 99, fullName: "Jane Developer", emailAddress: "jane@example.com",
    githubUsername: options.connected ? "jane-github" : "", studyLevel: 0,
    skills: [] as string[], goals: [] as string[], hasCompletedOnboarding: false, onboardingStep: options.step ?? 0,
  };
  const saves: Record<string, unknown>[] = [];
  let connectionStarted = false;
  const ok = (result: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ result }) });
  await page.context().addCookies([{ name: "mosaic-talent.e2e", value: "1", url: "http://127.0.0.1:3000" }]);
  if (options.authenticated) await page.context().addCookies([
    { name: "mosaic-talent.access-token", value: "test-session", url: "http://127.0.0.1:3000" },
  ]);

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/Account/Register")) {
      if (options.failRegistration) return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: { message: "This email is already registered." } }) });
      const input = route.request().postDataJSON();
      profile = { ...profile, fullName: input.fullName, emailAddress: input.emailAddress };
      return route.fulfill(ok({ canLogin: true }));
    }
    if (path.endsWith("/Authenticate")) return route.fulfill(ok({ accessToken: "test-session", userId: 99, expireInSeconds: 3600 }));
    if (path.endsWith("/GetAccessToken")) return route.fulfill(ok(""));
    if (path.endsWith("/GetCurrentLoginInformations")) return route.fulfill(ok({ user: { id: 99, userName: "jane", name: "Jane", surname: "Developer", emailAddress: profile.emailAddress } }));
    if (path.endsWith("/GetMyProfile")) return route.fulfill(ok(profile));
    if (path.endsWith("/UpsertMyProfile")) {
      const input = route.request().postDataJSON();
      saves.push(input);
      profile = { ...profile, skills: input.skills, goals: input.goals, onboardingStep: input.onboardingStep,
        hasCompletedOnboarding: profile.hasCompletedOnboarding || input.completeOnboarding };
      return route.fulfill(ok(profile));
    }
    if (path.endsWith("/BeginGitHubConnection")) {
      connectionStarted = route.request().headers().authorization === "Bearer test-session";
      return route.fulfill(ok({ authorizationUrl: "https://github.com/login/oauth/authorize?state=protected-test-state" }));
    }
    if (path.endsWith("/GetGithubSkillSuggestions")) return route.fulfill(ok(["Python", "TypeScript"]));
    if (path.endsWith("/GetStudyLevels")) return route.fulfill(ok([]));
    if (path.endsWith("/GetMyProjects") || path.endsWith("/GetOpenProjects")) return route.fulfill(ok([]));
    return route.fulfill(ok({ items: [], totalCount: 0 }));
  });
  await page.route("https://github.com/login/oauth/authorize**", async (route) => {
    profile.githubUsername = "jane-github";
    await route.fulfill({ status: 302, headers: { location: "http://127.0.0.1:3000/onboarding?githubConnected=1" }, body: "" });
  });
  return { saves, getProfile: () => profile, connectionStarted: () => connectionStarted };
};
