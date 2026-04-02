import { describe, expect, it } from "vitest";
import { buildSocialShareUrl, buildTenantJobsUrl } from "../jobShare";

describe("buildTenantJobsUrl", () => {
  it("builds root-domain tenant jobs url", () => {
    const url = buildTenantJobsUrl({
      tenancyName: "acme",
      protocol: "https:",
      hostname: "mosaictalent.co.za",
    });

    expect(url).toBe("https://acme.mosaictalent.co.za/jobs");
  });

  it("builds localhost tenant jobs url", () => {
    const url = buildTenantJobsUrl({
      tenancyName: "acme",
      protocol: "http:",
      hostname: "localhost",
      port: "3000",
    });

    expect(url).toBe("http://acme.localhost:3000/jobs");
  });

  it("builds vercel tenant jobs url", () => {
    const url = buildTenantJobsUrl({
      tenancyName: "acme",
      protocol: "https:",
      hostname: "mosaic-talent.vercel.app",
    });

    expect(url).toBe("https://acme-mosaic-talent.vercel.app/jobs");
  });
});

describe("buildSocialShareUrl", () => {
  const baseInput = {
    publicJobsUrl: "https://acme.mosaictalent.co.za/jobs",
    jobTitle: "Frontend Engineer",
    companyLabel: "Acme",
  };

  it("builds linkedin share url", () => {
    const url = buildSocialShareUrl({
      ...baseInput,
      platform: "linkedin",
    });

    expect(url).toContain("linkedin.com");
    expect(url).toContain(encodeURIComponent(baseInput.publicJobsUrl));
  });

  it("builds x share url", () => {
    const url = buildSocialShareUrl({
      ...baseInput,
      platform: "x",
    });

    expect(url).toContain("twitter.com/intent/tweet");
    expect(url).toContain(encodeURIComponent(baseInput.publicJobsUrl));
  });
});
