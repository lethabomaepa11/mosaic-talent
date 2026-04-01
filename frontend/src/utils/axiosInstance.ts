"use client";

import axios, { AxiosInstance } from "axios";

const AUTH_TOKEN_KEY = "mosaic-talent.access-token";
const TENANT_ID_KEY = "mosaic-talent.abp-tenant-id";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const DEFAULT_ABP_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_ABP_TENANT_ID ?? "1";

let axiosInstance: AxiosInstance | null = null;

export async function fetchAccessTokenFromApi(): Promise<string> {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/TokenAuth/GetAccessToken`);
    return res.data?.result ?? "";
  } catch {
    return "";
  }
}

function getTokenFromCookie() {
  if (typeof document === "undefined") {
    return "";
  }

  const tokenCookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${AUTH_TOKEN_KEY}=`));

  if (!tokenCookie) {
    return "";
  }

  return decodeURIComponent(tokenCookie.split("=")[1] ?? "");
}

function getCookieValue(key: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${key}=`));

  if (!cookie) {
    return "";
  }

  return decodeURIComponent(cookie.split("=")[1] ?? "");
}

function resolveTenantId() {
  const cookieTenantId = getCookieValue(TENANT_ID_KEY);

  if (!cookieTenantId) {
    return DEFAULT_ABP_TENANT_ID;
  }

  // "host" is used to represent null tenant (host context).
  if (cookieTenantId.toLowerCase() === "host") {
    return null;
  }

  return cookieTenantId;
}

export const AbpAuthHeader = () => {
  const tenantId = resolveTenantId();

  if (!tenantId) {
    return { headers: {} };
  }

  return {
    headers: {
      "Abp-TenantId": tenantId,
    },
  };
};

export function getAuthToken() {
  return getCookieValue(AUTH_TOKEN_KEY);
}

export function getAxiosInstance(): AxiosInstance {
  if (axiosInstance) {
    return axiosInstance;
  }

  axiosInstance = axios.create({
    baseURL: API_BASE_URL,
  });

  axiosInstance.interceptors.request.use((config) => {
    const token = getTokenFromCookie();
    const tenantId = resolveTenantId();

    config.headers = config.headers ?? {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
      config.headers["Abp-TenantId"] = tenantId;
    } else {
      delete config.headers["Abp-TenantId"];
    }

    return config;
  });

  return axiosInstance;
}

export function setAuthToken(token: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
}

export function removeAuthToken() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_TOKEN_KEY}=; Max-Age=0; path=/; SameSite=Lax`;
}

export function setAbpTenantId(tenantId: string | null) {
  if (typeof document === "undefined") {
    return;
  }

  const value = tenantId === null ? "host" : tenantId;
  document.cookie = `${TENANT_ID_KEY}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}
