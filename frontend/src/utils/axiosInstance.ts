"use client";

import axios, { AxiosInstance } from "axios";

const AUTH_TOKEN_KEY = "mosaic-talent.access-token";
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

export function getAuthToken() {
  return getTokenFromCookie();
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
