"use client";

import { createContext } from "react";

export type TenantResolutionSource =
  | "default"
  | "vercel"
  | "subdomain"
  | "none";

export interface ITenantResolutionStateContext {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isResolved: boolean;
  tenantId: string;
  tenancyName: string;
  companyName: string;
  companyLogoUrl: string;
  websiteUrl: string;
  source: TenantResolutionSource;
}

export interface ITenantResolutionActionContext {
  resolveTenant: () => Promise<void>;
}

export const INITIAL_STATE: ITenantResolutionStateContext = {
  isPending: false,
  isSuccess: false,
  isError: false,
  isResolved: false,
  tenantId: "1",
  tenancyName: "",
  companyName: "",
  companyLogoUrl: "",
  websiteUrl: "",
  source: "default",
};

export const TenantResolutionStateContext =
  createContext<ITenantResolutionStateContext>(INITIAL_STATE);

export const TenantResolutionActionContext =
  createContext<ITenantResolutionActionContext>({
    resolveTenant: async () => undefined,
  });
