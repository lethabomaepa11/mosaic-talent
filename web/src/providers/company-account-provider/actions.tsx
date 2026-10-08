import { createAction } from "redux-actions";
import {
  ICompany,
  ICompanyAccountStateContext,
  ICompanyEmployee,
} from "./context";

type CompanyStatePatch = Partial<ICompanyAccountStateContext>;

export enum CompanyAccountStateEnums {
  COMPANY_ACCOUNT_PENDING = "COMPANY_ACCOUNT_PENDING",
  COMPANY_ACCOUNT_CREATE_SUCCESS = "COMPANY_ACCOUNT_CREATE_SUCCESS",
  COMPANY_ACCOUNT_FETCH_SUCCESS = "COMPANY_ACCOUNT_FETCH_SUCCESS",
  COMPANY_ACCOUNT_EMPLOYEES_SUCCESS = "COMPANY_ACCOUNT_EMPLOYEES_SUCCESS",
  COMPANY_ACCOUNT_ERROR = "COMPANY_ACCOUNT_ERROR",
}

export const companyAccountPending = createAction<CompanyStatePatch>(
  CompanyAccountStateEnums.COMPANY_ACCOUNT_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const companyAccountCreateSuccess = createAction<
  CompanyStatePatch,
  { tenantId: number; tenancyName: string }
>(CompanyAccountStateEnums.COMPANY_ACCOUNT_CREATE_SUCCESS, ({ tenantId, tenancyName }) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  tenantId,
  tenancyName,
}));

export const companyAccountFetchSuccess = createAction<CompanyStatePatch, ICompany>(
  CompanyAccountStateEnums.COMPANY_ACCOUNT_FETCH_SUCCESS,
  (company) => ({
    isPending: false,
    isSuccess: true,
    isError: false,
    company,
  }),
);

export const companyAccountEmployeesSuccess = createAction<
  CompanyStatePatch,
  ICompanyEmployee[]
>(CompanyAccountStateEnums.COMPANY_ACCOUNT_EMPLOYEES_SUCCESS, (employees) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  employees,
}));

export const companyAccountError = createAction<CompanyStatePatch>(
  CompanyAccountStateEnums.COMPANY_ACCOUNT_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);
