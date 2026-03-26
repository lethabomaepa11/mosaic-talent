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
  TenantResolutionSource,
  TenantResolutionStateContext,
} from "./context";
import { TenantResolutionReducer } from "./reducer";

interface IIsTenantAvailableResult {
  state: number;
  tenantId?: number | null;
}

interface ICompanyBrandingResult {
  name?: string;
  logoStoredFileId?: string;
}

interface ITenantCandidate {
  tenancyName: string;
  source: TenantResolutionSource;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const normalizeHost = (hostname: string) => hostname.toLowerCase().split(":")[0];

const parseVercelTenancy = (host: string) => {
  if (!host.endsWith(".mosaic-talent.vercel.app")) {
    return "";
  }

  const label = host.replace(".mosaic-talent.vercel.app", "");
  if (!label) {
    return "";
  }

  const marker = "-mosaic-talent";
  const markerIndex = label.indexOf(marker);
  if (markerIndex <= 0) {
    return "";
  }

  return label.slice(0, markerIndex);
};

const parseGenericSubdomainTenancy = (host: string) => {
  const parts = host.split(".").filter(Boolean);

  if (parts.length < 3) {
    return "";
  }

  return parts[parts.length - 3] ?? "";
};

const parseLocalhostTenancy = (host: string) => {
  if (!host.endsWith(".localhost")) {
    return "";
  }

  const parts = host.split(".").filter(Boolean);
  if (parts.length < 2) {
    return "";
  }

  const candidate = parts[parts.length - 2];
  return candidate === "localhost" ? "" : candidate;
};

const getTenancyCandidateFromHost = (host: string): ITenantCandidate | null => {
  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  const vercelTenancy = parseVercelTenancy(host);
  if (vercelTenancy) {
    return {
      tenancyName: vercelTenancy,
      source: "vercel",
    };
  }

  const localhostTenancy = parseLocalhostTenancy(host);
  if (localhostTenancy) {
    return {
      tenancyName: localhostTenancy,
      source: "subdomain",
    };
  }

  const subdomainTenancy = parseGenericSubdomainTenancy(host);
  if (subdomainTenancy) {
    return {
      tenancyName: subdomainTenancy,
      source: "subdomain",
    };
  }

  return null;
};

const resolveTenantWithApi = async (tenancyName: string) => {
  const rawClient = axios.create({
    baseURL: API_BASE_URL,
  });

  const response = await rawClient.post("/api/services/app/Account/IsTenantAvailable", {
    tenancyName,
  });

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
