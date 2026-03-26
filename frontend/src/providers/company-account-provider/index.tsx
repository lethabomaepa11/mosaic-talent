"use client";

import { PropsWithChildren, useContext, useReducer } from "react";
import { getAxiosInstance } from "@/utils/axiosInstance";
import {
  companyAccountCreateSuccess,
  companyAccountEmployeesSuccess,
  companyAccountError,
  companyAccountFetchSuccess,
  companyAccountPending,
} from "./actions";
import {
  CompanyAccountActionContext,
  CompanyAccountStateContext,
  IAddCompanyEmployeeInput,
  ICreateCompanyAccountInput,
  INITIAL_STATE,
} from "./context";
import { CompanyAccountReducer } from "./reducer";

const ENDPOINT = "/api/services/app/CompanyAccount";

export const CompanyAccountProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(CompanyAccountReducer, INITIAL_STATE);

  const createCompanyAccount = async (input: ICreateCompanyAccountInput) => {
    dispatch(companyAccountPending());

    try {
      const res = await instance.post(`${ENDPOINT}/CreateCompanyAccount`, input);
      const result = res.data?.result as { tenantId: number; tenancyName: string };
      dispatch(
        companyAccountCreateSuccess({
          tenantId: result.tenantId,
          tenancyName: result.tenancyName,
        }),
      );
      return result;
    } catch {
      dispatch(companyAccountError());
      return null;
    }
  };

  const fetchMyCompany = async () => {
    dispatch(companyAccountPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyCompany`);
      dispatch(companyAccountFetchSuccess(res.data?.result));
    } catch {
      dispatch(companyAccountError());
    }
  };

  const fetchMyCompanyEmployees = async () => {
    dispatch(companyAccountPending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyCompanyEmployees`);
      dispatch(companyAccountEmployeesSuccess(res.data?.result ?? []));
    } catch {
      dispatch(companyAccountError());
    }
  };

  const addCompanyEmployee = async (input: IAddCompanyEmployeeInput) => {
    dispatch(companyAccountPending());

    try {
      await instance.post(`${ENDPOINT}/AddCompanyEmployee`, input);
      await fetchMyCompanyEmployees();
    } catch {
      dispatch(companyAccountError());
    }
  };

  return (
    <CompanyAccountStateContext.Provider value={state}>
      <CompanyAccountActionContext.Provider
        value={{
          createCompanyAccount,
          fetchMyCompany,
          fetchMyCompanyEmployees,
          addCompanyEmployee,
        }}
      >
        {children}
      </CompanyAccountActionContext.Provider>
    </CompanyAccountStateContext.Provider>
  );
};

export const useCompanyAccountState = () => {
  return useContext(CompanyAccountStateContext);
};

export const useCompanyAccountAction = () => {
  return useContext(CompanyAccountActionContext);
};
