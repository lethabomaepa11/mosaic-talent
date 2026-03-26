import { handleActions } from "redux-actions";
import { INITIAL_STATE, ISimulationStateContext } from "./context";
import { SimulationStateEnums } from "./actions";

type SimulationStatePatch = Partial<ISimulationStateContext>;

export const SimulationReducer = handleActions<ISimulationStateContext, SimulationStatePatch>(
  {
    [SimulationStateEnums.SIM_FETCH_SCENARIOS_PENDING]: (state, { payload }) => ({ ...state, ...payload }),
    [SimulationStateEnums.SIM_FETCH_SCENARIOS_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
    [SimulationStateEnums.SIM_FETCH_SCENARIOS_ERROR]: (state, { payload }) => ({ ...state, ...payload }),
    [SimulationStateEnums.SIM_CREATE_SCENARIO_PENDING]: (state, { payload }) => ({ ...state, ...payload }),
    [SimulationStateEnums.SIM_CREATE_SCENARIO_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
    [SimulationStateEnums.SIM_CREATE_SCENARIO_ERROR]: (state, { payload }) => ({ ...state, ...payload }),
    [SimulationStateEnums.SIM_SESSION_PENDING]: (state, { payload }) => ({ ...state, ...payload }),
    [SimulationStateEnums.SIM_SESSION_SUCCESS]: (state, { payload }) => ({ ...state, ...payload }),
    [SimulationStateEnums.SIM_SESSION_ERROR]: (state, { payload }) => ({ ...state, ...payload }),
  },
  INITIAL_STATE,
);
