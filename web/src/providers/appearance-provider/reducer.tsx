import { handleActions } from "redux-actions";
import { AppearanceStateEnums } from "./actions";
import { IAppearanceStateContext, INITIAL_STATE } from "./context";

export const AppearanceReducer = handleActions<
  IAppearanceStateContext,
  Partial<IAppearanceStateContext>
>(
  {
    [AppearanceStateEnums.APPEARANCE_HYDRATE_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AppearanceStateEnums.APPEARANCE_HYDRATE_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AppearanceStateEnums.APPEARANCE_HYDRATE_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AppearanceStateEnums.APPEARANCE_SET_MODE]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
