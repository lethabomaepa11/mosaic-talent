"use client";

import { PropsWithChildren, useEffect } from "react";
import { Spin } from "antd";
import { useRouter } from "next/navigation";
import { useTenantResolutionState } from "@/providers/tenant-provider";

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
  const { tenancyName, isResolved } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);
  const isAuthorized = audience === "company" ? isCompanyTenant : !isCompanyTenant;
  const deniedRedirect = deniedRedirectByAudience[audience];

  useEffect(() => {
    if (!isResolved || isAuthorized) {
      return;
    }

    router.replace(deniedRedirect);
  }, [deniedRedirect, isAuthorized, isResolved, router]);

  if (!isResolved || !isAuthorized) {
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
