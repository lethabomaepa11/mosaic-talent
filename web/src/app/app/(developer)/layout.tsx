import { PropsWithChildren } from "react";
import { WorkspaceRouteGuard } from "@/components/guards";

const DeveloperRoutesLayout = ({ children }: PropsWithChildren) => {
  return (
    <WorkspaceRouteGuard audience="developer">
      {children}
    </WorkspaceRouteGuard>
  );
};

export default DeveloperRoutesLayout;
