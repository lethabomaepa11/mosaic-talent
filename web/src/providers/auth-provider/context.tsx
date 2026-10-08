"use client";

import { createContext } from "react";

export interface IUser {
  userId: number;
  accessToken: string;
  expireInSeconds: number;
}

export interface IRegisterInput {
  name: string;
  surname: string;
  userName: string;
  emailAddress: string;
  password: string;
}

export interface IAuthStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isAuthenticated: boolean;
  user?: IUser;
}

export interface IAuthActionContext {
  login: (userNameOrEmailAddress: string, password: string) => Promise<void>;
  register: (input: IRegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const INITIAL_STATE: IAuthStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  isAuthenticated: false,
};

export const AuthStateContext = createContext<IAuthStateContext>(INITIAL_STATE);
export const AuthActionContext = createContext<IAuthActionContext>({
  login: async () => undefined,
  register: async () => undefined,
  logout: async () => undefined,
});
