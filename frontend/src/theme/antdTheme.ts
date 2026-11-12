import type { ThemeConfig } from "antd";

export type ThemeMode = "dark" | "light";

const brandTokens = {
  gold: "#E8A623",
  teal: "#2ABFAA",
  error: "#EF4444",
} as const;

const darkPalette = {
  ink: "#14161B",
  paper: "#F2F3F5",
  gold: brandTokens.gold,
  teal: brandTokens.teal,
  goldDim: "rgba(232,166,35,0.12)",
  goldMid: "rgba(232,166,35,0.35)",
  muted: "rgba(242,243,245,0.65)",
  border: "rgba(240,237,230,0.1)",
  cardBg: "rgba(240,237,230,0.04)",
  containerBg: "#1C1F26",
  layoutBg: "#14161B",
  textSecondary: "rgba(242,243,245,0.72)",
  inputBg: "rgba(240,237,230,0.08)",
  successBg: "rgba(42,191,170,0.16)",
  successBorder: "rgba(42,191,170,0.45)",
  successText: "#7BE3D4",
  warningBg: "rgba(232,166,35,0.16)",
  warningBorder: "rgba(232,166,35,0.45)",
  warningText: "#F6CD72",
  errorBg: "rgba(239,68,68,0.14)",
  errorBorder: "rgba(239,68,68,0.42)",
  errorText: "#FCA5A5",
} as const;

const lightPalette = {
  ink: "#F6F7F9",
  paper: "#24292F",
  gold: brandTokens.gold,
  teal: brandTokens.teal,
  goldDim: "rgba(232,166,35,0.2)",
  goldMid: "rgba(232,166,35,0.36)",
  muted: "#6E7781",
  border: "#D8DEE4",
  cardBg: "#FFFFFF",
  containerBg: "#FFFFFF",
  layoutBg: "#F6F7F9",
  textSecondary: "#57606A",
  inputBg: "#FFFFFF",
  successBg: "rgba(42,191,170,0.14)",
  successBorder: "rgba(42,191,170,0.4)",
  successText: "#0F766E",
  warningBg: "rgba(232,166,35,0.18)",
  warningBorder: "rgba(232,166,35,0.42)",
  warningText: "#92400E",
  errorBg: "rgba(239,68,68,0.14)",
  errorBorder: "rgba(239,68,68,0.38)",
  errorText: "#B91C1C",
} as const;

export const designTokens = {
  ...darkPalette,
  error: brandTokens.error,
} as const;

const resolvePalette = (mode: ThemeMode) => {
  return mode === "light" ? lightPalette : darkPalette;
};

export const getAntdTheme = (mode: ThemeMode): ThemeConfig => {
  const palette = resolvePalette(mode);

  return {
    token: {
      colorPrimary: palette.gold,
      colorInfo: palette.gold,
      colorSuccess: palette.teal,
      colorWarning: palette.gold,
      colorError: brandTokens.error,

      colorInfoBg: palette.warningBg,
      colorInfoBorder: palette.warningBorder,
      colorInfoText: palette.warningText,
      colorSuccessBg: palette.successBg,
      colorSuccessBorder: palette.successBorder,
      colorSuccessText: palette.successText,
      colorWarningBg: palette.warningBg,
      colorWarningBorder: palette.warningBorder,
      colorWarningText: palette.warningText,
      colorErrorBg: palette.errorBg,
      colorErrorBorder: palette.errorBorder,
      colorErrorText: palette.errorText,

      colorBgBase: palette.layoutBg,
      colorTextBase: palette.paper,

      colorBgLayout: palette.layoutBg,
      colorBgContainer: palette.containerBg,
      colorBgElevated: palette.containerBg,
      colorBorder: palette.border,

      colorText: palette.paper,
      colorLink: palette.paper,
      colorLinkHover: palette.successText,
      colorLinkActive: palette.paper,
      colorTextSecondary: palette.textSecondary,
      colorTextPlaceholder: palette.muted,

      controlOutline: palette.goldMid,
      colorPrimaryBg: palette.goldDim,
      colorFillAlter: palette.cardBg,

      borderRadius: 8,
      colorTextLightSolid: "#192B22",
      fontSize: 16,
      fontSizeSM: 14,
      controlHeight: 42,
      controlHeightLG: 44,
      fontFamily: "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif",
    },
    components: {
      Tabs: {
        itemSelectedColor: palette.paper,
        itemActiveColor: palette.paper,
        itemHoverColor: palette.paper,
        inkBarColor: palette.gold,
      },
      Layout: {
        bodyBg: palette.layoutBg,
        headerBg: palette.containerBg,
        siderBg: mode === "light" ? "#ECE6D8" : "rgba(10,11,15,0.95)",
        footerBg: palette.layoutBg,
      },
      Card: {
        colorBgContainer: palette.cardBg,
        colorBorderSecondary: palette.border,
      },
      Button: {
        primaryShadow: "0 0 0 0 transparent",
        defaultBorderColor: palette.border,
        defaultColor: palette.paper,
        defaultBg: palette.containerBg,
      },
      Input: {
        colorBgContainer: palette.inputBg,
        colorBorder: palette.border,
        colorTextPlaceholder: palette.muted,
        activeBorderColor: palette.gold,
        hoverBorderColor: palette.gold,
      },
    },
  };
};

export const antdTheme: ThemeConfig = getAntdTheme("dark");
