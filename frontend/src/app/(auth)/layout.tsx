"use client";

import { PropsWithChildren } from "react";
import { WithAuth } from "@/hoc/WithAuth/WithAuth";

const AuthLayoutContent = ({ children }: PropsWithChildren) => {
  return <>{children}</>;
};

const AuthLayout = WithAuth(AuthLayoutContent);

export default AuthLayout;
