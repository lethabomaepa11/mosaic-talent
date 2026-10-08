import { handleActions } from "redux-actions";
import { AuthStateEnums } from "./actions";
import { IAuthStateContext, INITIAL_STATE } from "./context";

export const AuthReducer = handleActions<IAuthStateContext, IAuthStateContext>(
  {
    [AuthStateEnums.LOGIN_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.LOGIN_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.LOGIN_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.REGISTER_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.REGISTER_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.REGISTER_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.LOGOUT_PENDING]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.LOGOUT_SUCCESS]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [AuthStateEnums.LOGOUT_ERROR]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  INITIAL_STATE,
);
