import { describe, expect, it } from "vitest";
import {
  fetchScenariosSuccess,
  sessionSuccess,
  SimulationStateEnums,
} from "../actions";

describe("simulation actions", () => {
  it("creates fetch scenarios success payload", () => {
    const scenarios = [{ id: "1", title: "Scenario", prompt: "Prompt", botCount: 2, requiredRoles: ["Teammate"] }];
    expect(fetchScenariosSuccess(scenarios)).toMatchObject({
      type: SimulationStateEnums.SIM_FETCH_SCENARIOS_SUCCESS,
      payload: { scenarios },
    });
  });

  it("creates session success payload", () => {
    const session = {
      id: "s1",
      scenarioId: "sc1",
      scenarioTitle: "Scenario",
      sessionType: "MeetingSimulation",
      orchestratorNeeded: true,
      awaitingUserInput: false,
      messages: [],
      bots: [],
      observations: [],
    };
    expect(sessionSuccess(session)).toMatchObject({
      type: SimulationStateEnums.SIM_SESSION_SUCCESS,
      payload: { activeSession: session },
    });
  });
});
