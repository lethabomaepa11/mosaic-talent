"use client";

import axios, { AxiosInstance } from "axios";

const AUTH_TOKEN_KEY = "mosaic-talent.access-token";
const AUTH_USER_KEY = "mosaic-talent.auth-user";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

let axiosInstance: AxiosInstance | null = null;

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

export function getAxiosInstance(): AxiosInstance {
  if (axiosInstance) {
    return axiosInstance;
  }

  axiosInstance = axios.create({
    baseURL: API_BASE_URL,
  });

  axiosInstance.interceptors.request.use((config) => {
    const token = getTokenFromCookie();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

export function setAuthUser(user: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthUser<T>() {
  if (typeof window === "undefined") {
    return undefined as T | undefined;
  }

  const rawUser = window.localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return undefined as T | undefined;
  }

  try {
    return JSON.parse(rawUser) as T;
  } catch {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return undefined as T | undefined;
  }
}

export function removeAuthUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_USER_KEY);
}
