import { describe, expect, it } from "vitest";
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
} from "../actions";
import type { IUser } from "../context";

const user: IUser = {
  accessToken: "token-123",
  expireInSeconds: 3600,
  userId: 7,
};

describe("auth actions", () => {
  it("creates login lifecycle payloads", () => {
    expect(loginPending()).toMatchObject({
      payload: {
        isAuthenticated: false,
        isError: false,
        isPending: true,
        isSuccess: false,
      },
    });
    expect(loginSuccess(user)).toMatchObject({
      payload: {
        isAuthenticated: true,
        isError: false,
        isPending: false,
        isSuccess: true,
        user,
      },
    });
    expect(loginError()).toMatchObject({
      payload: {
        isAuthenticated: false,
        isError: true,
        isPending: false,
        isSuccess: false,
      },
    });
  });

  it("creates register lifecycle payloads", () => {
    expect(registerPending()).toMatchObject({
      payload: {
        isPending: true,
        isSuccess: false,
      },
    });
    expect(registerSuccess(user)).toMatchObject({
      payload: {
        isAuthenticated: true,
        user,
      },
    });
    expect(registerError()).toMatchObject({
      payload: {
        isError: true,
        isAuthenticated: false,
      },
    });
  });

  it("creates logout payloads", () => {
    expect(logoutPending()).toMatchObject({
      payload: {
        isPending: true,
      },
    });
    expect(logoutSuccess()).toMatchObject({
      payload: {
        isAuthenticated: false,
        user: undefined,
      },
    });
    expect(logoutError()).toMatchObject({
      payload: {
        isError: true,
      },
    });
  });
});
