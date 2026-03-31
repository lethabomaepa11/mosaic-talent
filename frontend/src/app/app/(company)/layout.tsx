import { PropsWithChildren } from "react";
import { WorkspaceRouteGuard } from "@/components/guards";

const CompanyRoutesLayout = ({ children }: PropsWithChildren) => {
  return <WorkspaceRouteGuard audience="company">{children}</WorkspaceRouteGuard>;
};

export default CompanyRoutesLayout;
