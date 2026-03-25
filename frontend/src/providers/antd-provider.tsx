"use client";

import { PropsWithChildren } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp, ConfigProvider } from "antd";
import { StyleProvider } from "antd-style";
import { antdTheme } from "@/theme/antdTheme";

export function AntdProvider({ children }: PropsWithChildren) {
  return (
    <AntdRegistry>
      <StyleProvider>
        <ConfigProvider
          theme={antdTheme}
          componentSize="middle"
          wave={{ disabled: true }}
        >
          <AntdApp>{children}</AntdApp>
        </ConfigProvider>
      </StyleProvider>
    </AntdRegistry>
  );
}
