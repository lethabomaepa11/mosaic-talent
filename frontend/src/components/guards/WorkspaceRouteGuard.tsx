"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { Spin } from "antd";
import { useRouter } from "next/navigation";
import {
  useTenantResolutionAction,
  useTenantResolutionState,
} from "@/providers/tenant-provider";

type WorkspaceAudience = "company" | "developer";

interface IWorkspaceRouteGuardProps extends PropsWithChildren {
  audience: WorkspaceAudience;
}

const deniedRedirectByAudience: Record<WorkspaceAudience, string> = {
  company: "/app/projects/open",
  developer: "/app",
};

export const WorkspaceRouteGuard = ({
  audience,
  children,
}: IWorkspaceRouteGuardProps) => {
  const router = useRouter();
  const { tenancyName, isResolved, isPending } = useTenantResolutionState();
  const { resolveTenant } = useTenantResolutionAction();
  const isCompanyTenant = Boolean(tenancyName);
  const isAuthorized = audience === "company" ? isCompanyTenant : !isCompanyTenant;
  const deniedRedirect = deniedRedirectByAudience[audience];
  const hostName =
    typeof window === "undefined" ? "" : window.location.hostname.split(":")[0];
  const isLocalHost = hostName === "localhost" || hostName === "127.0.0.1";
  const isE2E =
    typeof document !== "undefined" &&
    document.cookie.includes("mosaic-talent.e2e=1");
  const [hasHydrated, setHasHydrated] = useState(false);
  const canRenderChildren =
    !hasHydrated || isResolved || isE2E || (isLocalHost && !isPending);

  useEffect(() => {
    if (!isResolved && !isPending) {
      resolveTenant();
    }
  }, [isPending, isResolved, resolveTenant]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!isResolved || isAuthorized) {
      return;
    }

    router.replace(deniedRedirect);
  }, [deniedRedirect, isAuthorized, isResolved, router]);

  if (!canRenderChildren || !isAuthorized) {
    return (
      <div
        data-ai-guard-loading={audience}
        style={{ minHeight: "40vh", display: "grid", placeItems: "center" }}
      >
        <Spin />
      </div>
    );
  }

  return <>{children}</>;
};
