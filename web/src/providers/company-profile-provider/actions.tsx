import { createAction } from "redux-actions";
import {
  ICompanyEmployeeProfile,
  ICompanyProfileStateContext,
} from "./context";

type CompanyProfileStatePatch = Partial<ICompanyProfileStateContext>;

export enum CompanyProfileStateEnums {
  COMPANY_PROFILE_FETCH_PENDING = "COMPANY_PROFILE_FETCH_PENDING",
  COMPANY_PROFILE_FETCH_SUCCESS = "COMPANY_PROFILE_FETCH_SUCCESS",
  COMPANY_PROFILE_FETCH_ERROR = "COMPANY_PROFILE_FETCH_ERROR",
  COMPANY_PROFILE_SAVE_PENDING = "COMPANY_PROFILE_SAVE_PENDING",
  COMPANY_PROFILE_SAVE_SUCCESS = "COMPANY_PROFILE_SAVE_SUCCESS",
  COMPANY_PROFILE_SAVE_ERROR = "COMPANY_PROFILE_SAVE_ERROR",
}

export const fetchProfilePending = createAction<CompanyProfileStatePatch>(
  CompanyProfileStateEnums.COMPANY_PROFILE_FETCH_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const fetchProfileSuccess = createAction<
  CompanyProfileStatePatch,
  ICompanyEmployeeProfile
>(CompanyProfileStateEnums.COMPANY_PROFILE_FETCH_SUCCESS, (profile) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  profile,
}));

export const fetchProfileError = createAction<CompanyProfileStatePatch>(
  CompanyProfileStateEnums.COMPANY_PROFILE_FETCH_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);

export const saveProfilePending = createAction<CompanyProfileStatePatch>(
  CompanyProfileStateEnums.COMPANY_PROFILE_SAVE_PENDING,
  () => ({ isPending: true, isSuccess: false, isError: false }),
);

export const saveProfileSuccess = createAction<
  CompanyProfileStatePatch,
  ICompanyEmployeeProfile
>(CompanyProfileStateEnums.COMPANY_PROFILE_SAVE_SUCCESS, (profile) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  profile,
}));

export const saveProfileError = createAction<CompanyProfileStatePatch>(
  CompanyProfileStateEnums.COMPANY_PROFILE_SAVE_ERROR,
  () => ({ isPending: false, isSuccess: false, isError: true }),
);
