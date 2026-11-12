import type { PropsWithChildren } from "react";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("/", "mosaic.talent");
const PublicLayout = ({ children }: PropsWithChildren) => children;
export default PublicLayout;
