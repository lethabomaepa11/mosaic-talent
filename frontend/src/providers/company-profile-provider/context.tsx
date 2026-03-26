"use client";

import { createContext } from "react";

export interface ICompanyEmployeeProfile {
  userId: number;
  name: string;
  surname: string;
  userName: string;
  emailAddress: string;
  avatarUrl?: string;
  role: number;
}

export interface IUpdateCompanyEmployeeProfileInput {
  name: string;
  surname: string;
  avatarUrl?: string;
}

export interface ICompanyProfileStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  profile?: ICompanyEmployeeProfile;
}

export interface ICompanyProfileActionContext {
  fetchMyEmployeeProfile: () => Promise<void>;
  updateMyEmployeeProfile: (
    input: IUpdateCompanyEmployeeProfileInput,
  ) => Promise<void>;
}

export const INITIAL_STATE: ICompanyProfileStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  profile: undefined,
};

export const CompanyProfileStateContext =
  createContext<ICompanyProfileStateContext>(INITIAL_STATE);

export const CompanyProfileActionContext =
  createContext<ICompanyProfileActionContext>({
    fetchMyEmployeeProfile: async () => undefined,
    updateMyEmployeeProfile: async () => undefined,
  });
