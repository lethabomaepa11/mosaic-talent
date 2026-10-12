"use client";

import { PropsWithChildren, useEffect, useRef } from "react";
import { Alert, Button } from "antd";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/providers/auth-provider";
import { useDeveloperAction, useDeveloperState } from "@/providers/developer-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

export const OnboardingGuard = ({ children }: PropsWithChildren) => {
  const { styles } = useStyles();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthState();
  const { tenancyName } = useTenantResolutionState();
  const { profile, profileStatus } = useDeveloperState();
  const { fetchMyProfile } = useDeveloperAction();
  const fetchProfileRef = useRef(fetchMyProfile);
  const isCompany = Boolean(tenancyName);
  const isCurrentProfile = profileStatus === "ready" && profile.userId === user?.userId;

  useEffect(() => {
    fetchProfileRef.current = fetchMyProfile;
  }, [fetchMyProfile]);

  useEffect(() => {
    if (isAuthenticated && !isCompany && profileStatus === "idle") void fetchProfileRef.current();
  }, [isAuthenticated, isCompany, profileStatus, user?.userId]);

  useEffect(() => {
    if (!isCompany && isCurrentProfile && !profile.hasCompletedOnboarding) router.replace("/onboarding");
  }, [isCompany, isCurrentProfile, profile.hasCompletedOnboarding, router]);

  if (isCompany) return <>{children}</>;
  if (profileStatus === "error") return (
    <div className={styles.loadingState}>
      <Alert title="Unable to load your profile" description="Try again to continue safely." type="error"
        action={<Button onClick={() => void fetchMyProfile()}>Try again</Button>} />
    </div>
  );
  if (!isAuthenticated || !isCurrentProfile || !profile.hasCompletedOnboarding) return (
    <div className={styles.loadingState}>Checking your onboarding...</div>
  );
  return <>{children}</>;
};
