"use client";

import { ComponentType } from "react";
import { useEffect } from "react";
import { Spin } from "antd";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/providers/auth-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";

const AUTHENTICATED_REDIRECT = "/app";

export const WithAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const GuardedAuthRoute = (props: P) => {
    const router = useRouter();
    const { isAuthenticated, isPending: isAuthPending } = useAuthState();
    const { isResolved, isPending: isTenantPending } = useTenantResolutionState();

    const isBootstrappingAuth = !isResolved || isTenantPending || isAuthPending;

    useEffect(() => {
      if (isBootstrappingAuth || !isAuthenticated) {
        return;
      }

      router.replace(AUTHENTICATED_REDIRECT);
    }, [isBootstrappingAuth, isAuthenticated]);

    if (isBootstrappingAuth || isAuthenticated) {
      return (
        <div
          data-testid="with-auth-loader"
          data-ai-guard-loading="auth"
          style={{ minHeight: "40vh", display: "grid", placeItems: "center" }}
        >
          <Spin />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  GuardedAuthRoute.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return GuardedAuthRoute;
};
