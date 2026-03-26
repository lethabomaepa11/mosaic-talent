import type { ThemeConfig } from "antd";

export const designTokens = {
  ink: "#0A0B0F",
  paper: "#F0EDE6",
  gold: "#E8A623",
  teal: "#2ABFAA",
  goldDim: "rgba(232,166,35,0.12)",
  goldMid: "rgba(232,166,35,0.35)",
  muted: "rgba(240,237,230,0.45)",
  border: "rgba(240,237,230,0.1)",
  cardBg: "rgba(240,237,230,0.04)",
} as const;

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: designTokens.gold,
    colorInfo: designTokens.gold,
    colorSuccess: designTokens.teal,
    colorWarning: designTokens.gold,
    colorError: "#ef4444",

    colorBgBase: designTokens.ink,
    colorTextBase: designTokens.paper,

    colorBgLayout: designTokens.ink,
    colorBgContainer: "#13141a",
    colorBgElevated: "#13141a",
    colorBorder: designTokens.border,

    colorText: designTokens.paper,
    colorTextSecondary: "rgba(240,237,230,0.6)",
    colorTextPlaceholder: designTokens.muted,

    controlOutline: designTokens.goldMid,
    colorPrimaryBg: designTokens.goldDim,
    colorFillAlter: designTokens.cardBg,

    borderRadius: 12,
    fontFamily: "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif",
  },
  components: {
    Layout: {
      bodyBg: designTokens.ink,
      headerBg: "#13141a",
      siderBg: "rgba(10,11,15,0.95)",
      footerBg: designTokens.ink,
    },
    Card: {
      colorBgContainer: designTokens.cardBg,
      colorBorderSecondary: designTokens.border,
    },
    Button: {
      primaryShadow: "0 0 0 0 transparent",
      defaultBorderColor: designTokens.border,
      defaultColor: designTokens.paper,
      defaultBg: "#13141a",
    },
    Input: {
      colorBgContainer: "rgba(240,237,230,0.08)",
      colorBorder: designTokens.border,
      colorTextPlaceholder: "rgba(240,237,230,0.45)",
      activeBorderColor: designTokens.gold,
      hoverBorderColor: designTokens.gold,
    },
  },
};
