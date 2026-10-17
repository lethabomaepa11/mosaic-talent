import { createAction } from "redux-actions";
import { IAuthStateContext, IUser } from "./context";

export enum AuthStateEnums {
  LOGIN_PENDING = "AUTH_LOGIN_PENDING",
  LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS",
  LOGIN_ERROR = "AUTH_LOGIN_ERROR",
  REGISTER_PENDING = "AUTH_REGISTER_PENDING",
  REGISTER_SUCCESS = "AUTH_REGISTER_SUCCESS",
  REGISTER_ERROR = "AUTH_REGISTER_ERROR",
  LOGOUT_PENDING = "AUTH_LOGOUT_PENDING",
  LOGOUT_SUCCESS = "AUTH_LOGOUT_SUCCESS",
  LOGOUT_ERROR = "AUTH_LOGOUT_ERROR",
}

export const loginPending = createAction<Partial<IAuthStateContext>>(
  AuthStateEnums.LOGIN_PENDING,
  () => ({
    isPending: true,
    isSuccess: false,
    isError: false,
    isAuthenticated: false,
  }),
);

export const loginSuccess = createAction<Partial<IAuthStateContext>, IUser>(
  AuthStateEnums.LOGIN_SUCCESS,
  (user) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    isAuthenticated: true,
    isSessionRestored: true,
    user,
  }),
);

export const loginError = createAction<Partial<IAuthStateContext>>(
  AuthStateEnums.LOGIN_ERROR,
  () => ({
    isPending: false,
    isSuccess: false,
    isError: true,
    isAuthenticated: false,
    user: undefined,
    isSessionRestored: true,
  }),
);

export const registerPending = createAction<Partial<IAuthStateContext>>(
  AuthStateEnums.REGISTER_PENDING,
  () => ({
    isPending: true,
    isSuccess: false,
    isError: false,
    isAuthenticated: false,
  }),
);

export const registerSuccess = createAction<Partial<IAuthStateContext>, IUser>(
  AuthStateEnums.REGISTER_SUCCESS,
  (user) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    isAuthenticated: true,
    isSessionRestored: true,
    user,
  }),
);

export const registerError = createAction<Partial<IAuthStateContext>>(
  AuthStateEnums.REGISTER_ERROR,
  () => ({
    isPending: false,
    isSuccess: false,
    isError: true,
    isAuthenticated: false,
    user: undefined,
    isSessionRestored: true,
  }),
);

export const logoutPending = createAction<Partial<IAuthStateContext>>(
  AuthStateEnums.LOGOUT_PENDING,
  () => ({
    isPending: true,
    isSuccess: false,
    isError: false,
    isAuthenticated: false,
  }),
);

export const logoutSuccess = createAction<Partial<IAuthStateContext>>(
  AuthStateEnums.LOGOUT_SUCCESS,
  () => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    isAuthenticated: false,
    user: undefined,
    isSessionRestored: true,
  }),
);

export const logoutError = createAction<Partial<IAuthStateContext>>(
  AuthStateEnums.LOGOUT_ERROR,
  () => ({
    isPending: false,
    isSuccess: false,
    isError: true,
    isAuthenticated: false,
  }),
);
