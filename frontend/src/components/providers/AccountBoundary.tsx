"use client";
import { Fragment, type PropsWithChildren } from "react";
import { useAuthState } from "@/providers/auth-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";

// Reset cached workspace data on account/tenant changes while preserving real auth and appearance.
export const AccountBoundary = ({ children }: PropsWithChildren) => {
  const { user } = useAuthState();
  const { tenancyName } = useTenantResolutionState();
  return <Fragment key={`${tenancyName || "developer"}:${user?.userId ?? "guest"}`}>{children}</Fragment>;
};
