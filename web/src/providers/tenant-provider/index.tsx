"use client";

import { PropsWithChildren, useContext, useReducer } from "react";
import axios from "axios";
import { setAbpTenantId } from "@/utils/axiosInstance";
import {
  tenantResolutionError,
  tenantResolutionPending,
  tenantResolutionSuccess,
} from "./actions";
import {
  INITIAL_STATE,
  TenantResolutionActionContext,
  TenantResolutionStateContext,
} from "./context";
import { TenantResolutionReducer } from "./reducer";
import { getTenancyCandidateFromHost, normalizeHost } from "./hostTenancy";

interface IIsTenantAvailableResult {
  state: number;
  tenantId?: number | null;
}

interface ICompanyBrandingResult {
  name?: string;
  logoStoredFileId?: string;
  websiteUrl?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const resolveTenantWithApi = async (tenancyName: string) => {
  const rawClient = axios.create({
    baseURL: API_BASE_URL,
  });

  const response = await rawClient.post(
    "/api/services/app/Account/IsTenantAvailable",
    {
      tenancyName,
    },
  );

  return response.data?.result as IIsTenantAvailableResult | undefined;
};

const resolveCompanyBranding = async (tenancyName: string) => {
  const rawClient = axios.create({
    baseURL: API_BASE_URL,
  });

  const response = await rawClient.get(
    "/api/services/app/CompanyAccount/GetCompanyBrandingByTenancyName",
    {
      params: { tenancyName },
    },
  );

  return response.data?.result as ICompanyBrandingResult | undefined;
};

export const TenantResolutionProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(TenantResolutionReducer, INITIAL_STATE);

  const resolveTenant = async () => {
    dispatch(tenantResolutionPending());

    try {
      const host = normalizeHost(window.location.hostname);
      const candidate = getTenancyCandidateFromHost(host);

      if (!candidate) {
        setAbpTenantId("1");
        dispatch(
          tenantResolutionSuccess({
            tenantId: "1",
            tenancyName: "",
            companyName: "",
            companyLogoUrl: "",
            source: "default",
            websiteUrl: "",
          }),
        );
        return;
      }

      const result = await resolveTenantWithApi(candidate.tenancyName);
      const available = result?.state === 1 && !!result?.tenantId;

      if (!available) {
        setAbpTenantId(null);
        dispatch(
          tenantResolutionError({
            tenantId: "",
            tenancyName: candidate.tenancyName,
            companyName: "",
            companyLogoUrl: "",
            source: candidate.source,
          }),
        );
        return;
      }

      const tenantId = String(result.tenantId);
      const branding = await resolveCompanyBranding(candidate.tenancyName);
      setAbpTenantId(tenantId);

      dispatch(
        tenantResolutionSuccess({
          tenantId,
          tenancyName: candidate.tenancyName,
          companyName: branding?.name ?? "",
          companyLogoUrl: branding?.logoStoredFileId ?? "",
          source: candidate.source,
          websiteUrl: branding?.websiteUrl ?? "",
        }),
      );
    } catch {
      setAbpTenantId("1");
      dispatch(
        tenantResolutionError({
          tenantId: "1",
          tenancyName: "",
          companyName: "",
          companyLogoUrl: "",
          source: "none",
        }),
      );
    }
  };

  return (
    <TenantResolutionStateContext.Provider value={state}>
      <TenantResolutionActionContext.Provider value={{ resolveTenant }}>
        {children}
      </TenantResolutionActionContext.Provider>
    </TenantResolutionStateContext.Provider>
  );
};

export const useTenantResolutionState = () => {
  return useContext(TenantResolutionStateContext);
};

export const useTenantResolutionAction = () => {
  return useContext(TenantResolutionActionContext);
};
