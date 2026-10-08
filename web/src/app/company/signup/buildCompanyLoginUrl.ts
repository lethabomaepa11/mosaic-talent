const DEFAULT_ROOT_DOMAIN = "mosaictalent.co.za";
const VERCEL_ROOT = "mosaic-talent.vercel.app";

interface IBuildCompanyLoginUrlInput {
  tenancyName: string;
  protocol: string;
  hostname: string;
  port?: string;
  rootDomain?: string;
}

const normalizeLabel = (value: string) => value.trim().toLowerCase();

export const buildCompanyLoginUrl = ({
  tenancyName,
  protocol,
  hostname,
  port,
  rootDomain = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN ?? DEFAULT_ROOT_DOMAIN,
}: IBuildCompanyLoginUrlInput) => {
  const resolvedTenancyName = normalizeLabel(tenancyName);
  const resolvedHostname = normalizeLabel(hostname);
  const resolvedPort = port ? `:${port}` : "";

  if (resolvedHostname === "localhost" || resolvedHostname.endsWith(".localhost")) {
    return `${protocol}//${resolvedTenancyName}.localhost${resolvedPort}/login`;
  }

  if (resolvedHostname === VERCEL_ROOT || resolvedHostname.endsWith(`.${VERCEL_ROOT}`)) {
    return `${protocol}//${resolvedTenancyName}-${VERCEL_ROOT}/login`;
  }

  const resolvedRootDomain = normalizeLabel(rootDomain);
  if (
    resolvedRootDomain &&
    (resolvedHostname === resolvedRootDomain ||
      resolvedHostname.endsWith(`.${resolvedRootDomain}`))
  ) {
    return `${protocol}//${resolvedTenancyName}.${resolvedRootDomain}${resolvedPort}/login`;
  }

  const parts = resolvedHostname.split(".").filter(Boolean);
  if (parts.length >= 3) {
    parts[parts.length - 3] = resolvedTenancyName;
    return `${protocol}//${parts.join(".")}${resolvedPort}/login`;
  }

  return `${protocol}//${resolvedTenancyName}.${resolvedHostname}${resolvedPort}/login`;
};
