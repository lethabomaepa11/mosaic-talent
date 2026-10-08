const DEFAULT_ROOT_DOMAIN = "mosaictalent.co.za";
const VERCEL_ROOT = "mosaic-talent.vercel.app";

const normalizeLabel = (value: string) => value.trim().toLowerCase();

interface IBuildTenantJobsUrlInput {
  tenancyName: string;
  protocol: string;
  hostname: string;
  port?: string;
  rootDomain?: string;
}

export type SharePlatform = "linkedin" | "x" | "facebook" | "whatsapp";

interface IBuildSocialShareUrlInput {
  platform: SharePlatform;
  publicJobsUrl: string;
  jobTitle: string;
  companyLabel: string;
}

export const buildTenantJobsUrl = ({
  tenancyName,
  protocol,
  hostname,
  port,
  rootDomain = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN ?? DEFAULT_ROOT_DOMAIN,
}: IBuildTenantJobsUrlInput) => {
  const resolvedTenancyName = normalizeLabel(tenancyName);
  const resolvedHostname = normalizeLabel(hostname);
  const resolvedPort = port ? `:${port}` : "";

  if (!resolvedTenancyName) {
    return `${protocol}//${resolvedHostname}${resolvedPort}/jobs`;
  }

  if (resolvedHostname === "localhost" || resolvedHostname.endsWith(".localhost")) {
    return `${protocol}//${resolvedTenancyName}.localhost${resolvedPort}/jobs`;
  }

  if (resolvedHostname === VERCEL_ROOT || resolvedHostname.endsWith(`.${VERCEL_ROOT}`)) {
    return `${protocol}//${resolvedTenancyName}-${VERCEL_ROOT}/jobs`;
  }

  const resolvedRootDomain = normalizeLabel(rootDomain);
  if (
    resolvedRootDomain &&
    (resolvedHostname === resolvedRootDomain ||
      resolvedHostname.endsWith(`.${resolvedRootDomain}`))
  ) {
    return `${protocol}//${resolvedTenancyName}.${resolvedRootDomain}${resolvedPort}/jobs`;
  }

  const parts = resolvedHostname.split(".").filter(Boolean);
  if (parts.length >= 3) {
    parts[parts.length - 3] = resolvedTenancyName;
    return `${protocol}//${parts.join(".")}${resolvedPort}/jobs`;
  }

  return `${protocol}//${resolvedTenancyName}.${resolvedHostname}${resolvedPort}/jobs`;
};

export const buildSocialShareUrl = ({
  platform,
  publicJobsUrl,
  jobTitle,
  companyLabel,
}: IBuildSocialShareUrlInput) => {
  const encodedUrl = encodeURIComponent(publicJobsUrl);
  const encodedText = encodeURIComponent(
    `We're hiring for ${jobTitle} at ${companyLabel}. Apply here:`,
  );

  if (platform === "linkedin") {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  }

  if (platform === "facebook") {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  }

  if (platform === "whatsapp") {
    return `https://wa.me/?text=${encodeURIComponent(
      `We're hiring for ${jobTitle} at ${companyLabel}. Apply here: ${publicJobsUrl}`,
    )}`;
  }

  return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
};
