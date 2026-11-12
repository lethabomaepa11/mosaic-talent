import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo";

// Only public editorial pages belong here; no account or project data is queried.
const sitemap = (): MetadataRoute.Sitemap => ["/", "/how-to"].map(path => ({ url: new URL(path, siteOrigin).href }));
export default sitemap;
