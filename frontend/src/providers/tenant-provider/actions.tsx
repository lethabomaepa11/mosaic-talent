import { createAction } from "redux-actions";
import {
  ITenantResolutionStateContext,
  TenantResolutionSource,
} from "./context";

type TenantStatePatch = Partial<ITenantResolutionStateContext>;

export enum TenantResolutionStateEnums {
  TENANT_RESOLUTION_PENDING = "TENANT_RESOLUTION_PENDING",
  TENANT_RESOLUTION_SUCCESS = "TENANT_RESOLUTION_SUCCESS",
  TENANT_RESOLUTION_ERROR = "TENANT_RESOLUTION_ERROR",
}

export const tenantResolutionPending = createAction<TenantStatePatch>(
  TenantResolutionStateEnums.TENANT_RESOLUTION_PENDING,
  () => ({
    isPending: true,
    isSuccess: false,
    isError: false,
    isResolved: false,
  }),
);

export const tenantResolutionSuccess = createAction<
  TenantStatePatch,
  {
    tenantId: string;
    tenancyName: string;
    source: TenantResolutionSource;
    companyName?: string;
    companyLogoUrl?: string;
  }
>(TenantResolutionStateEnums.TENANT_RESOLUTION_SUCCESS, (payload) => ({
  isPending: false,
  isSuccess: true,
  isError: false,
  isResolved: true,
  ...payload,
}));

export const tenantResolutionError = createAction<
  TenantStatePatch,
  {
    tenantId: string;
    tenancyName: string;
    source: TenantResolutionSource;
    companyName?: string;
    companyLogoUrl?: string;
  }
>(TenantResolutionStateEnums.TENANT_RESOLUTION_ERROR, (payload) => ({
  isPending: false,
  isSuccess: false,
  isError: true,
  isResolved: true,
  ...payload,
}));
