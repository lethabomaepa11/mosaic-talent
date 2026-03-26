import { describe, expect, it } from "vitest";
import { fetchScenariosSuccess, sessionSuccess } from "../actions";
import { INITIAL_STATE } from "../context";
import { SimulationReducer } from "../reducer";

describe("simulation reducer", () => {
  it("stores scenarios", () => {
    const next = SimulationReducer(
      INITIAL_STATE,
      fetchScenariosSuccess([{ id: "1", title: "T", prompt: "P", botCount: 1, requiredRoles: [] }]),
    );
    expect(next.scenarios).toHaveLength(1);
  });

  it("stores active session", () => {
    const next = SimulationReducer(
      INITIAL_STATE,
      sessionSuccess({
        id: "s1",
        scenarioId: "1",
        scenarioTitle: "T",
        sessionType: "OneOnOne",
        orchestratorNeeded: false,
        messages: [],
        bots: [],
        observations: [],
      }),
    );
    expect(next.activeSession?.id).toBe("s1");
  });
});
