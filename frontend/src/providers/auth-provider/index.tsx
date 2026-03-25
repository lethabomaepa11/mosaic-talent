"use client";

import { PropsWithChildren, useContext, useEffect, useReducer } from "react";
import {
  getAuthUser,
  getAxiosInstance,
  removeAuthToken,
  removeAuthUser,
  setAuthToken,
  setAuthUser,
} from "@/utils/axiosInstance";
import {
  loginError,
  loginPending,
  loginSuccess,
  logoutError,
  logoutPending,
  logoutSuccess,
  registerError,
  registerPending,
  registerSuccess,
} from "./actions";
import {
  AuthActionContext,
  AuthStateContext,
  INITIAL_STATE,
  IRegisterInput,
  IUser,
} from "./context";
import { AuthReducer } from "./reducer";

interface IAuthResponse {
  accessToken: string;
  expireInSeconds: number;
  userId: number;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  useEffect(() => {
    const storedUser = getAuthUser<IUser>();

    if (storedUser) {
      setAuthToken(storedUser.accessToken);
      dispatch(loginSuccess(storedUser));
    }
  }, []);

  const login = async (userNameOrEmailAddress: string, password: string) => {
    dispatch(loginPending());

    try {
      const res = await instance.post("/api/TokenAuth/Authenticate", {
        userNameOrEmailAddress,
        password,
        rememberClient: true,
      });
      const user = res.data.result as IAuthResponse;
      const authUser = {
        accessToken: user.accessToken,
        expireInSeconds: user.expireInSeconds,
        userId: user.userId,
      };
      setAuthToken(authUser.accessToken);
      setAuthUser(authUser);
      dispatch(loginSuccess(user));
    } catch {
      removeAuthToken();
      removeAuthUser();
      dispatch(loginError());
    }
  };

  const register = async (input: IRegisterInput) => {
    dispatch(registerPending());

    try {
      await instance.post("/api/services/app/Account/Register", input);
      const res = await instance.post("/api/TokenAuth/Authenticate", {
        userNameOrEmailAddress: input.userName,
        password: input.password,
        rememberClient: true,
      });
      const user = res.data.result as IAuthResponse;
      const authUser = {
        accessToken: user.accessToken,
        expireInSeconds: user.expireInSeconds,
        userId: user.userId,
      };
      setAuthToken(authUser.accessToken);
      setAuthUser(authUser);
      dispatch(registerSuccess(authUser));
    } catch {
      removeAuthToken();
      removeAuthUser();
      dispatch(registerError());
    }
  };

  const logout = async () => {
    dispatch(logoutPending());

    try {
      removeAuthToken();
      removeAuthUser();
      dispatch(logoutSuccess());
    } catch {
      dispatch(logoutError());
    }
  };

  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionContext.Provider value={{ login, register, logout }}>
        {children}
      </AuthActionContext.Provider>
    </AuthStateContext.Provider>
  );
}

export function useAuthState() {
  return useContext(AuthStateContext);
}

export function useAuthAction() {
  return useContext(AuthActionContext);
}
