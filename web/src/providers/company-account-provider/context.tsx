"use client";

import { createContext } from "react";

export interface ICompany {
  id: string;
  name: string;
  tenancyName: string;
  logoStoredFileId?: string;
  website?: string;
  email: string;
  accountOwnerUserId: number;
}

export interface ICompanyEmployee {
  id: string;
  companyId: string;
  userId: number;
  name: string;
  surname: string;
  emailAddress: string;
  userName: string;
  role: number;
}

export interface ICreateCompanyAccountInput {
  name: string;
  logoStoredFileId?: string;
  website?: string;
  email: string;
  accountOwnerName: string;
  accountOwnerSurname: string;
  accountOwnerUserName: string;
  accountOwnerEmailAddress: string;
  accountOwnerPassword: string;
}

export interface IAddCompanyEmployeeInput {
  name: string;
  surname: string;
  userName: string;
  emailAddress: string;
  password: string;
  role: number;
}

export interface IUpdateMyCompanyInput {
  name: string;
  logoStoredFileId?: string;
  website?: string;
  email: string;
}

export interface ICompanyAccountStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  company?: ICompany;
  employees: ICompanyEmployee[];
  tenantId?: number;
  tenancyName?: string;
}

export interface ICompanyAccountActionContext {
  createCompanyAccount: (
    input: ICreateCompanyAccountInput,
  ) => Promise<{ tenantId: number; tenancyName: string } | null>;
  fetchMyCompany: () => Promise<void>;
  fetchMyCompanyEmployees: () => Promise<void>;
  addCompanyEmployee: (input: IAddCompanyEmployeeInput) => Promise<void>;
  updateMyCompany: (input: IUpdateMyCompanyInput) => Promise<ICompany | null>;
}

export const INITIAL_STATE: ICompanyAccountStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  company: undefined,
  employees: [],
  tenantId: undefined,
  tenancyName: undefined,
};

export const CompanyAccountStateContext = createContext<ICompanyAccountStateContext>(INITIAL_STATE);
export const CompanyAccountActionContext = createContext<ICompanyAccountActionContext>({
  createCompanyAccount: async () => null,
  fetchMyCompany: async () => undefined,
  fetchMyCompanyEmployees: async () => undefined,
  addCompanyEmployee: async () => undefined,
  updateMyCompany: async () => null,
});
