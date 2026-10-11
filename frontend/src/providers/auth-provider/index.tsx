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
} from "./context";
import { AuthReducer } from "./reducer";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { AxiosError } from "axios";

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
      const registration = await instance.post("/api/services/app/Account/Register", input);
      if (registration.data?.result?.canLogin === false) {
        throw new Error("Your account was created but cannot sign in yet. Contact support before trying again.");
      }
      const res = await instance.post("/api/TokenAuth/Authenticate", {
        userNameOrEmailAddress: input.userName || input.emailAddress,
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
    } catch (error) {
      removeAuthToken();
      dispatch(registerError());
      throw new Error(error instanceof AxiosError
        ? error.response?.data?.error?.message || "Unable to create your account. Check your details and try again."
        : error instanceof Error ? error.message : "Unable to create your account.");
    }
  };

  const beginGithubConnection = async (returnPath: string) => {
    const res = await instance.post("/api/TokenAuth/BeginGitHubConnection", { returnPath }, { withCredentials: true });
    const authorizationUrl = res.data?.result?.authorizationUrl;
    const url = new URL(authorizationUrl);
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.pathname !== "/login/oauth/authorize") {
      throw new Error("GitHub connection is unavailable. You can skip it and add skills manually.");
    }
    return url.href;
  };

  const logout = async () => {
    dispatch(logoutPending());

    try {
      removeAuthToken();
      dispatch(logoutSuccess());
    } catch {
      dispatch(logoutError());
    }
  };

  return (
    <AuthStateContext.Provider value={state}>
      <AuthActionContext.Provider value={{ login, register, logout, beginGithubConnection }}>
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
