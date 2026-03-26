import { createAction } from "redux-actions";
import { ISimulationScenario, ISimulationSession, ISimulationStateContext } from "./context";

type SimulationStatePatch = Partial<ISimulationStateContext>;

export enum SimulationStateEnums {
  SIM_FETCH_SCENARIOS_PENDING = "SIM_FETCH_SCENARIOS_PENDING",
  SIM_FETCH_SCENARIOS_SUCCESS = "SIM_FETCH_SCENARIOS_SUCCESS",
  SIM_FETCH_SCENARIOS_ERROR = "SIM_FETCH_SCENARIOS_ERROR",
  SIM_CREATE_SCENARIO_PENDING = "SIM_CREATE_SCENARIO_PENDING",
  SIM_CREATE_SCENARIO_SUCCESS = "SIM_CREATE_SCENARIO_SUCCESS",
  SIM_CREATE_SCENARIO_ERROR = "SIM_CREATE_SCENARIO_ERROR",
  SIM_SESSION_PENDING = "SIM_SESSION_PENDING",
  SIM_SESSION_SUCCESS = "SIM_SESSION_SUCCESS",
  SIM_SESSION_ERROR = "SIM_SESSION_ERROR",
}

export const fetchScenariosPending = createAction<SimulationStatePatch>(
  SimulationStateEnums.SIM_FETCH_SCENARIOS_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchScenariosSuccess = createAction<SimulationStatePatch, ISimulationScenario[]>(
  SimulationStateEnums.SIM_FETCH_SCENARIOS_SUCCESS,
  (scenarios) => ({ isPending: false, isSuccess: true, isError: false, scenarios }),
);

export const fetchScenariosError = createAction<SimulationStatePatch>(
  SimulationStateEnums.SIM_FETCH_SCENARIOS_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const createScenarioPending = createAction<SimulationStatePatch>(
  SimulationStateEnums.SIM_CREATE_SCENARIO_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const createScenarioSuccess = createAction<SimulationStatePatch>(
  SimulationStateEnums.SIM_CREATE_SCENARIO_SUCCESS,
  () => ({ isPending: false, isSuccess: true, isError: false }),
);

export const createScenarioError = createAction<SimulationStatePatch>(
  SimulationStateEnums.SIM_CREATE_SCENARIO_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const sessionPending = createAction<SimulationStatePatch>(
  SimulationStateEnums.SIM_SESSION_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const sessionSuccess = createAction<SimulationStatePatch, ISimulationSession>(
  SimulationStateEnums.SIM_SESSION_SUCCESS,
  (activeSession) => ({ isPending: false, isSuccess: true, isError: false, activeSession }),
);

export const sessionError = createAction<SimulationStatePatch>(
  SimulationStateEnums.SIM_SESSION_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);
