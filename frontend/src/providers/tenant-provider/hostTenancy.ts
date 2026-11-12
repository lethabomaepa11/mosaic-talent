import { TenantResolutionSource } from "./context";

interface ITenantCandidate {
  tenancyName: string;
  source: TenantResolutionSource;
}

interface IHostTenancyOptions {
  rootDomain?: string;
}

const DEFAULT_ROOT_DOMAIN = "mosaictalent.co.za";

export const normalizeHost = (hostname: string) => {
  const host = hostname.trim().toLowerCase();
  if (host.startsWith("[")) return host.slice(1, host.indexOf("]"));
  return host.split(":").length > 2 ? host : host.split(":")[0];
};

const parseVercelTenancy = (host: string) => {
  if (!host.endsWith("-mosaic-talent.vercel.app")) {
    return "";
  }

  const label = host.slice(0, -"-mosaic-talent.vercel.app".length);
  if (!label || label === host) {
    return "";
  }

  return label;
};

const parseLocalhostTenancy = (host: string) => {
  if (!host.endsWith(".localhost")) {
    return "";
  }

  const parts = host.split(".").filter(Boolean);
  if (parts.length < 2) {
    return "";
  }

  const candidate = parts[parts.length - 2];
  return candidate === "localhost" ? "" : candidate;
};

const parseRootDomainTenancy = (host: string, rootDomain: string) => {
  const normalizedRoot = rootDomain.trim().toLowerCase();
  if (!normalizedRoot || host === normalizedRoot) {
    return "";
  }

  const suffix = `.${normalizedRoot}`;
  if (!host.endsWith(suffix)) {
    return "";
  }

  const prefix = host.slice(0, -suffix.length);
  if (!prefix) {
    return "";
  }

  const segments = prefix.split(".").filter(Boolean);
  return segments[segments.length - 1] ?? "";
};

const parseGenericSubdomainTenancy = (host: string) => {
  const parts = host.split(".").filter(Boolean);

  if (parts.length < 3) {
    return "";
  }

  return parts[parts.length - 3] ?? "";
};

export const getTenancyCandidateFromHost = (
  host: string,
  options?: IHostTenancyOptions,
): ITenantCandidate | null => {
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) && host.split(".").every((part) => Number(part) <= 255);
  if (!host || host === "localhost" || isIpv4 || host.includes(":")) {
    return null;
  }

  if (host === "mosaic-talent.vercel.app") {
    return null;
  }

  const vercelTenancy = parseVercelTenancy(host);
  if (vercelTenancy) {
    return {
      tenancyName: vercelTenancy,
      source: "vercel",
    };
  }

  const localhostTenancy = parseLocalhostTenancy(host);
  if (localhostTenancy) {
    return {
      tenancyName: localhostTenancy,
      source: "subdomain",
    };
  }

  const rootDomain =
    options?.rootDomain ??
    process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN ??
    DEFAULT_ROOT_DOMAIN;
  const normalizedRootDomain = rootDomain.trim().toLowerCase();
  if (host === normalizedRootDomain) {
    return null;
  }

  const rootDomainTenancy = parseRootDomainTenancy(host, normalizedRootDomain);
  if (rootDomainTenancy) {
    return {
      tenancyName: rootDomainTenancy,
      source: "subdomain",
    };
  }

  const subdomainTenancy = parseGenericSubdomainTenancy(host);
  if (subdomainTenancy) {
    return {
      tenancyName: subdomainTenancy,
      source: "subdomain",
    };
  }

  return null;
};
