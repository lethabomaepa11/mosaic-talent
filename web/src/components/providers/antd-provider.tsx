"use client";

import { PropsWithChildren, useMemo } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp, ConfigProvider } from "antd";
import { StyleProvider } from "antd-style";
import { useAppearanceState } from "@/providers/appearance-provider";
import { getAntdTheme } from "@/theme/antdTheme";

export function AntdProvider({ children }: PropsWithChildren) {
  const { mode } = useAppearanceState();
  const theme = useMemo(() => getAntdTheme(mode), [mode]);

  return (
    <AntdRegistry>
      <StyleProvider>
        <ConfigProvider
          theme={theme}
          componentSize="middle"
          wave={{ disabled: true }}
        >
          <AntdApp>{children}</AntdApp>
        </ConfigProvider>
      </StyleProvider>
    </AntdRegistry>
  );
}

