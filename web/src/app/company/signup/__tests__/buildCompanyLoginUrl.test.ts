import { describe, expect, it } from "vitest";
import { buildCompanyLoginUrl } from "../buildCompanyLoginUrl";

describe("buildCompanyLoginUrl", () => {
  it("redirects root production domain to tenant subdomain", () => {
    expect(
      buildCompanyLoginUrl({
        tenancyName: "acme",
        protocol: "https:",
        hostname: "mosaictalent.co.za",
      }),
    ).toBe("https://acme.mosaictalent.co.za/login");
  });

  it("replaces existing production tenant with the created tenant", () => {
    expect(
      buildCompanyLoginUrl({
        tenancyName: "acme",
        protocol: "https:",
        hostname: "legacy.mosaictalent.co.za",
      }),
    ).toBe("https://acme.mosaictalent.co.za/login");
  });

  it("keeps localhost behavior and preserves port", () => {
    expect(
      buildCompanyLoginUrl({
        tenancyName: "acme",
        protocol: "http:",
        hostname: "localhost",
        port: "3000",
      }),
    ).toBe("http://acme.localhost:3000/login");
  });

  it("keeps vercel tenant pattern behavior", () => {
    expect(
      buildCompanyLoginUrl({
        tenancyName: "acme",
        protocol: "https:",
        hostname: "mosaic-talent.vercel.app",
      }),
    ).toBe("https://acme-mosaic-talent.vercel.app/login");
  });

  it("supports custom root domains with multi-level tlds", () => {
    expect(
      buildCompanyLoginUrl({
        tenancyName: "acme",
        protocol: "https:",
        hostname: "example.co.za",
        rootDomain: "example.co.za",
      }),
    ).toBe("https://acme.example.co.za/login");
  });
});
