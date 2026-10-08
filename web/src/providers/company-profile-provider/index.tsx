"use client";

import { PropsWithChildren, useContext, useReducer } from "react";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { AxiosError } from "axios";
import {
  fetchProfileError,
  fetchProfilePending,
  fetchProfileSuccess,
  saveProfileError,
  saveProfilePending,
  saveProfileSuccess,
} from "./actions";
import {
  CompanyProfileActionContext,
  CompanyProfileStateContext,
  INITIAL_STATE,
  ICompanyEmployeeProfile,
  IUpdateCompanyEmployeeProfileInput,
} from "./context";
import { CompanyProfileReducer } from "./reducer";

const ENDPOINT = "/api/services/app/CompanyAccount";

const normalizeProfile = (
  input: Partial<ICompanyEmployeeProfile>,
): ICompanyEmployeeProfile => ({
  userId: Number(input.userId ?? 0),
  name: input.name ?? "",
  surname: input.surname ?? "",
  userName: input.userName ?? "",
  emailAddress: input.emailAddress ?? "",
  avatarUrl: input.avatarUrl ?? "",
  role: Number(input.role ?? 0),
});

export const CompanyProfileProvider = ({ children }: PropsWithChildren) => {
  const instance = getAxiosInstance();
  const [state, dispatch] = useReducer(CompanyProfileReducer, INITIAL_STATE);

  const fetchMyEmployeeProfile = async () => {
    dispatch(fetchProfilePending());

    try {
      const res = await instance.get(`${ENDPOINT}/GetMyEmployeeProfile`);
      dispatch(fetchProfileSuccess(normalizeProfile(res.data?.result ?? {})));
    } catch {
      dispatch(fetchProfileError());
    }
  };

  const updateMyEmployeeProfile = async (
    input: IUpdateCompanyEmployeeProfileInput,
  ) => {
    dispatch(saveProfilePending());

    try {
      const res = await instance.put(`${ENDPOINT}/UpdateMyEmployeeProfile`, input);
      dispatch(saveProfileSuccess(normalizeProfile(res.data?.result ?? {})));
    } catch (error) {
      dispatch(saveProfileError());
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.error?.message as string | undefined)
          : undefined;
      throw new Error(message || "Failed to update employee profile.");
    }
  };

  return (
    <CompanyProfileStateContext.Provider value={state}>
      <CompanyProfileActionContext.Provider
        value={{ fetchMyEmployeeProfile, updateMyEmployeeProfile }}
      >
        {children}
      </CompanyProfileActionContext.Provider>
    </CompanyProfileStateContext.Provider>
  );
};

export const useCompanyProfileState = () => {
  return useContext(CompanyProfileStateContext);
};

export const useCompanyProfileAction = () => {
  return useContext(CompanyProfileActionContext);
};
