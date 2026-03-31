import { describe, expect, it } from "vitest";
import { getTenancyCandidateFromHost, normalizeHost } from "../hostTenancy";

describe("hostTenancy", () => {
  it("normalizes hostnames by lowering case and removing port", () => {
    expect(normalizeHost("Acme.MosaicTalent.co.za:3000")).toBe(
      "acme.mosaictalent.co.za",
    );
  });

  it("returns null for root mosaictalent domain", () => {
    expect(
      getTenancyCandidateFromHost("mosaictalent.co.za", {
        rootDomain: "mosaictalent.co.za",
      }),
    ).toBeNull();
  });

  it("resolves tenant from mosaictalent.co.za subdomain", () => {
    expect(
      getTenancyCandidateFromHost("acme.mosaictalent.co.za", {
        rootDomain: "mosaictalent.co.za",
      }),
    ).toEqual({
      tenancyName: "acme",
      source: "subdomain",
    });
  });

  it("uses the label closest to root domain when multiple labels exist", () => {
    expect(
      getTenancyCandidateFromHost("edge.acme.mosaictalent.co.za", {
        rootDomain: "mosaictalent.co.za",
      }),
    ).toEqual({
      tenancyName: "acme",
      source: "subdomain",
    });
  });

  it("keeps localhost subdomain behavior", () => {
    expect(getTenancyCandidateFromHost("acme.localhost")).toEqual({
      tenancyName: "acme",
      source: "subdomain",
    });
  });

  it("keeps vercel tenant behavior", () => {
    expect(
      getTenancyCandidateFromHost("acme-mosaic-talent.vercel.app"),
    ).toEqual({
      tenancyName: "acme",
      source: "vercel",
    });
  });
});
