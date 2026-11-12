import type { MetadataRoute } from "next";
import { privatePaths, siteOrigin } from "@/lib/seo";

const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: "*", allow: "/", disallow: privatePaths },
  sitemap: `${siteOrigin}/sitemap.xml`,
});
export default robots;
