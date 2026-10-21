import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IdeatorProvider, useIdeatorAction, useIdeatorState } from "..";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock("@/utils/axiosInstance", () => ({ getAxiosInstance: () => mocks }));

const Consumer = () => {
  const { fetchFeed, react, convert } = useIdeatorAction();
  return <>
    <button onClick={() => fetchFeed()}>Feed</button>
    <button onClick={() => react("idea-1", "Interested")}>Interested</button>
    <button onClick={() => convert("idea-1", true)}>Convert</button>
  </>;
};

describe("IdeatorProvider", () => {
  afterEach(() => cleanup());
  it("reads the authenticated feed and posts reactions and creator-confirmed conversions to provider endpoints", async () => {
    mocks.get.mockResolvedValue({ data: { result: [] } });
    mocks.post.mockResolvedValue({ data: { result: {} } });
    render(<IdeatorProvider><Consumer /></IdeatorProvider>);

    fireEvent.click(screen.getByText("Feed"));
    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith("/api/services/app/Ideator/GetFeed"));
    fireEvent.click(screen.getByText("Interested"));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/api/services/app/Ideator/React", { ideaPostId: "idea-1", type: "Interested" }));
    fireEvent.click(screen.getByText("Convert"));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/api/services/app/Ideator/ConvertToProject", { ideaPostId: "idea-1", inviteInterestedDevelopers: true }));
  });

  it("sets the provider error state when the API request fails", async () => {
    mocks.get.mockRejectedValueOnce(new Error("network unavailable"));
    const State = () => {
      const { fetchFeed } = useIdeatorAction();
      const { isError } = useIdeatorState();
      return <><button onClick={() => fetchFeed().catch(() => undefined)}>Feed</button>{isError ? <span>Feed error</span> : null}</>;
    };
    render(<IdeatorProvider><State /></IdeatorProvider>);
    fireEvent.click(screen.getByText("Feed"));
    await waitFor(() => expect(screen.getByText("Feed error")).toBeInTheDocument());
  });
});
