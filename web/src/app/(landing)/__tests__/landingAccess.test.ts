import { describe, expect, it } from "vitest";
import { shouldRestrictLandingOnTenantSubdomain } from "../landingAccess";

describe("shouldRestrictLandingOnTenantSubdomain", () => {
  it("does not restrict while tenant resolution is pending", () => {
    const restricted = shouldRestrictLandingOnTenantSubdomain({
      isResolved: false,
      tenancyName: "acme",
      source: "subdomain",
    });

    expect(restricted).toBe(false);
  });

  it("does not restrict on default tenant context", () => {
    const restricted = shouldRestrictLandingOnTenantSubdomain({
      isResolved: true,
      tenancyName: "",
      source: "default",
    });

    expect(restricted).toBe(false);
  });

  it("restricts on root-domain subdomains", () => {
    const restricted = shouldRestrictLandingOnTenantSubdomain({
      isResolved: true,
      tenancyName: "acme",
      source: "subdomain",
    });

    expect(restricted).toBe(true);
  });

  it("restricts on vercel tenant hostnames", () => {
    const restricted = shouldRestrictLandingOnTenantSubdomain({
      isResolved: true,
      tenancyName: "acme",
      source: "vercel",
    });

    expect(restricted).toBe(true);
  });
});
