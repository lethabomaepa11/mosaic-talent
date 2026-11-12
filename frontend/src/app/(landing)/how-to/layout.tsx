import type { PropsWithChildren } from "react";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("/how-to", "Getting started", "How to join a developer team, build a project together, share your contribution, and receive peer feedback on mosaic.talent.");
const GuideLayout = ({ children }: PropsWithChildren) => children;
export default GuideLayout;
