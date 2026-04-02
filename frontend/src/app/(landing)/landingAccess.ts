import { TenantResolutionSource } from "@/providers/tenant-provider/context";

interface ILandingAccessInput {
  isResolved: boolean;
  tenancyName: string;
  source: TenantResolutionSource;
}

export const shouldRestrictLandingOnTenantSubdomain = ({
  isResolved,
  tenancyName,
  source,
}: ILandingAccessInput): boolean => {
  if (!isResolved) {
    return false;
  }

  if (!tenancyName) {
    return false;
  }

  return source === "subdomain" || source === "vercel";
};
