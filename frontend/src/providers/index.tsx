"use client";

import { PropsWithChildren } from "react";
import { AuthProvider } from "./auth-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}
