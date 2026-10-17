"use client";

import { PropsWithChildren } from "react";
import { AppOperatorPanel } from "@/components/app-operator";
import { WithAuth } from "@/hoc/WithAuth/WithAuth";

const AuthLayoutContent = ({ children }: PropsWithChildren) => {
  return <>{children}<AppOperatorPanel /></>;
};

const AuthLayout = WithAuth(AuthLayoutContent);

export default AuthLayout;
