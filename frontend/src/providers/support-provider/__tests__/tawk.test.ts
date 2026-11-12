import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const url = "https://embed.tawk.to/6af5d41ae84c933e6cc134c5/1k7849236";

describe("support widget loading", () => {
  beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); });
  afterEach(() => {
    vi.useRealTimers();
    document.getElementById("mosaic-support-widget")?.remove();
    delete window.Tawk_API;
  });

  it("accepts only a tawk.to embed path without query, credentials or arbitrary scripts", async () => {
    const { getTawkEmbedUrl } = await import("../tawk");
    expect(getTawkEmbedUrl(` ${url}/ `)).toBe(url);
    for (const invalid of [undefined, "", "https://example.com/a.js", url + "?x=1", url + "#x", url.replace("https:", "http:"), url.replace("embed.tawk.to", "embed.tawk.to.evil.com")]) {
      expect(getTawkEmbedUrl(invalid)).toBeNull();
    }
  });

  it("deduplicates concurrent loads and uses widget readiness rather than script load", async () => {
    const { loadTawk } = await import("../tawk");
    const first = loadTawk(url);
    expect(loadTawk(url)).toBe(first);
    expect(document.querySelectorAll("#mosaic-support-widget")).toHaveLength(1);
    const api = window.Tawk_API!;
    api.showWidget = vi.fn(); api.maximize = vi.fn(); api.hideWidget = vi.fn();
    api.onBeforeLoad!(); expect(api.hideWidget).toHaveBeenCalledOnce();
    api.onLoad!();
    expect(await first).toBe(api);
    api.onChatMinimized!(); expect(api.hideWidget).toHaveBeenCalledTimes(2);
    expect(await loadTawk(url)).toBe(api);
  });

  it("fails on blocked scripts and allows a fresh attempt", async () => {
    const { loadTawk } = await import("../tawk");
    const failed = expect(loadTawk(url)).rejects.toThrow("Support could not load");
    document.getElementById("mosaic-support-widget")!.dispatchEvent(new Event("error"));
    await failed;
    expect(document.getElementById("mosaic-support-widget")).toBeNull();
    const retry = loadTawk(url);
    Object.assign(window.Tawk_API!, { showWidget: vi.fn(), maximize: vi.fn() });
    window.Tawk_API!.onLoad!();
    await expect(retry).resolves.toBe(window.Tawk_API);
  });

  it("times out when a script never produces a usable widget", async () => {
    const { loadTawk } = await import("../tawk");
    const failed = expect(loadTawk(url)).rejects.toThrow("Support could not load");
    await vi.advanceTimersByTimeAsync(15_000);
    await failed;
    expect(document.getElementById("mosaic-support-widget")).toBeNull();
    const hideWidget = vi.fn();
    window.Tawk_API!.hideWidget = hideWidget;
    window.Tawk_API!.onLoad!();
    expect(hideWidget).toHaveBeenCalledOnce();
  });

  it("rejects invalid URLs before adding scripts and incomplete vendor APIs", async () => {
    const { loadTawk } = await import("../tawk");
    await expect(loadTawk("javascript:alert(1)")).rejects.toThrow("Invalid support configuration");
    expect(document.getElementById("mosaic-support-widget")).toBeNull();
    const failed = expect(loadTawk(url)).rejects.toThrow("Support could not load");
    window.Tawk_API!.onLoad!();
    await failed;
  });
});
