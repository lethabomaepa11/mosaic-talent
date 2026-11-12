import type { Metadata } from "next";

export const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mosaic-talent.vercel.app").origin;
export const siteDescription = "Learn by building real projects with other developers. Find teammates, meet future cofounders, and grow through shared work and feedback.";
export const privatePaths = ["/app", "/onboarding", "/login", "/signup", "/github", "/api", "/assessment", "/company/signup"];

export const publicMetadata = (path: string, title: string, description = siteDescription): Metadata => {
  const pageTitle = path === "/" ? title : `${title} | mosaic.talent`;
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: "mosaic.talent — build projects with other developers" };
  return {
    title: { absolute: pageTitle }, description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: { type: "website", siteName: "mosaic.talent", title: pageTitle, description, url: path, locale: "en_US", images: [image] },
    twitter: { card: "summary_large_image", title: pageTitle, description, images: [image] },
  };
};
