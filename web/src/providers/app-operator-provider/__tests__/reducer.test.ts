import { describe, expect, it } from "vitest";
import { addAssistantMessage, addUserMessage, setConfirmation } from "../actions";
import { INITIAL_STATE } from "../context";
import { AppOperatorReducer } from "../reducer";

describe("app operator reducer", () => {
  it("appends user and assistant history entries", () => {
    const userState = AppOperatorReducer(
      INITIAL_STATE,
      addUserMessage({ id: "u1", role: "user", text: "hello" }),
    );
    const assistantState = AppOperatorReducer(
      userState,
      addAssistantMessage({ id: "a1", role: "assistant", text: "done" }),
    );

    expect(assistantState.history).toHaveLength(2);
    expect(assistantState.history[0]?.role).toBe("user");
    expect(assistantState.history[1]?.role).toBe("assistant");
  });

  it("stores pending confirmation", () => {
    const next = AppOperatorReducer(
      INITIAL_STATE,
      setConfirmation({
        summary: "Confirm",
        intent: {
          type: "shortlist_candidates",
          rawCommand: "shortlist",
          params: { skill: "react" },
          missingRequired: [],
          requiresConfirmation: true,
        },
      }),
    );

    expect(next.pendingConfirmation?.summary).toBe("Confirm");
    expect(next.pendingConfirmation?.intent.type).toBe("shortlist_candidates");
  });
});
