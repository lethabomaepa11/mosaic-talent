import { describe, expect, it } from "vitest";
import {
  AuthStateEnums,
  loginError,
  loginPending,
  loginSuccess,
  logoutError,
  logoutPending,
  logoutSuccess,
  registerError,
  registerPending,
  registerSuccess,
} from "../actions";
import { INITIAL_STATE, type IUser } from "../context";
import { AuthReducer } from "../reducer";

const user: IUser = {
  accessToken: "token-123",
  expireInSeconds: 3600,
  userId: 42,
};

const actionMap = [
  [AuthStateEnums.LOGIN_PENDING, loginPending()],
  [AuthStateEnums.LOGIN_SUCCESS, loginSuccess(user)],
  [AuthStateEnums.LOGIN_ERROR, loginError()],
  [AuthStateEnums.REGISTER_PENDING, registerPending()],
  [AuthStateEnums.REGISTER_SUCCESS, registerSuccess(user)],
  [AuthStateEnums.REGISTER_ERROR, registerError()],
  [AuthStateEnums.LOGOUT_PENDING, logoutPending()],
  [AuthStateEnums.LOGOUT_SUCCESS, logoutSuccess()],
  [AuthStateEnums.LOGOUT_ERROR, logoutError()],
] as const;

describe("AuthReducer", () => {
  it.each(actionMap)("handles %s", (_, action) => {
    expect(AuthReducer(INITIAL_STATE, action)).toEqual({
      ...INITIAL_STATE,
      ...action.payload,
    });
  });
});
