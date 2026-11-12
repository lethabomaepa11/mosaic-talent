import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupportLauncher } from "../SupportLauncher";

const mocks = vi.hoisted(() => ({ open: vi.fn(), pathname: "/login", error: undefined as string | undefined }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/providers/support-provider", () => ({
  useSupportAction: () => ({ openSupport: mocks.open }),
  useSupportState: () => ({ isPending: false, error: mocks.error }),
}));

describe("support launcher", () => {
  beforeEach(() => { mocks.open.mockReset(); mocks.pathname = "/login"; mocks.error = undefined; });
  it("offers support and the public guide without starting a widget on mount", async () => {
    render(<SupportLauncher />);
    expect(mocks.open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^Support$/ }));
    expect(await screen.findByRole("dialog", { name: "Support" })).toBeVisible();
    expect(screen.getByRole("link", { name: /getting started/ })).toHaveAttribute("href", "/how-to");
    mocks.open.mockResolvedValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Contact support" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Support$/ })).toHaveAttribute("aria-expanded", "false"));
  });
  it("keeps the panel available after failure and links workspace users to their guide", async () => {
    mocks.pathname = "/app/help"; mocks.error = "Support couldn't load.";
    mocks.open.mockResolvedValue(false);
    render(<SupportLauncher />);
    fireEvent.click(screen.getByRole("button", { name: /^Support$/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Support couldn't load.");
    expect(screen.getByRole("link", { name: /getting started/ })).toHaveAttribute("href", "/app/how-to");
    fireEvent.click(screen.getByRole("button", { name: "Contact support" }));
    await waitFor(() => expect(mocks.open).toHaveBeenCalledOnce());
    expect(screen.getByRole("dialog", { name: "Support" })).toBeVisible();
  });
});
