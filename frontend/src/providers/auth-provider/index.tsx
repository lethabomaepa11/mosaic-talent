"use client";

import { PropsWithChildren, useContext, useEffect, useReducer } from "react";
import {
  fetchAccessTokenFromApi,
  getAuthToken,
  getAxiosInstance,
  removeAuthToken,
  setAbpTenantId,
  setAuthToken,
} from "@/utils/axiosInstance";
import {
  loginError,
  loginPending,
  loginSuccess,
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
} from "./context";
import { AuthReducer } from "./reducer";
import { useTenantResolutionState } from "@/providers/tenant-provider";

interface IAuthResponse {
  accessToken: string;
  expireInSeconds: number;
  userId: number;
}

interface IOAuthBootstrap {
  accessToken: string;
  tenantId?: string | null;
}

function consumeOAuthBootstrapFromHash(): IOAuthBootstrap | null {
  if (typeof window === "undefined") {
    return null;
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  const accessToken = params.get("oauthAccessToken");

  if (!accessToken) {
    return null;
  }

  const oauthTenantId = params.get("oauthTenantId");
  const tenantId =
    oauthTenantId === null
      ? undefined
      : oauthTenantId.toLowerCase() === "host"
        ? null
        : oauthTenantId;

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );

  return {
    accessToken,
    tenantId,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);
  const { isResolved } = useTenantResolutionState();

  useEffect(() => {
    if (!isResolved) {
      return;
    }

    let token = getAuthToken();

    const restoreSession = async () => {
      dispatch(loginPending());

      const oauthBootstrap = consumeOAuthBootstrapFromHash();
      if (oauthBootstrap) {
        token = oauthBootstrap.accessToken;
        setAuthToken(oauthBootstrap.accessToken);
        if (oauthBootstrap.tenantId !== undefined) {
          setAbpTenantId(oauthBootstrap.tenantId);
        }
      }

      if (!token) {
        token = await fetchAccessTokenFromApi();
        if (token) {
          setAuthToken(token);
        }
      }

      if (!token) {
        dispatch(logoutSuccess());
        return;
      }
      try {
        const res = await instance.get(
          "/api/services/app/Session/GetCurrentLoginInformations",
        );
        const sessionUser = res.data?.result?.user;
        const userId = Number(sessionUser?.id ?? 0);

        if (!userId) {
          throw new Error("Invalid session user");
        }

        dispatch(
          loginSuccess({
            accessToken: token,
            expireInSeconds: 0,
            userId,
          }),
        );
      } catch {
        removeAuthToken();
        dispatch(logoutSuccess());
      }
    };

    restoreSession();
  }, [isResolved]);

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
      dispatch(loginSuccess(authUser));
    } catch {
      removeAuthToken();
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
      dispatch(registerSuccess(authUser));
    } catch {
      removeAuthToken();
      dispatch(registerError());
    }
  };

  const logout = async () => {
    dispatch(logoutPending());

    try {
      await instance.post("/api/TokenAuth/Logout", {}, { withCredentials: true });
    } catch {
      // Local session cleanup must still complete if the backend is unavailable.
    } finally {
      removeAuthToken();
      dispatch(logoutSuccess());
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
