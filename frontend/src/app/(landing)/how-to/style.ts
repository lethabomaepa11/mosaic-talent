import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`min-height: 100vh; padding: ${token.paddingLG}px; display: grid; align-content: start; gap: ${token.marginXL}px; background: ${token.colorBgLayout}; @media (min-width: 768px) { padding: calc(${token.paddingLG}px * 3); }`,
  header: css`display: grid; gap: ${token.marginSM}px; max-width: 760px;`,
  back: css`width: fit-content; color: ${token.colorPrimary}; font-weight: ${token.fontWeightStrong};`,
  eyebrow: css`color: ${token.colorPrimary}; font-weight: ${token.fontWeightStrong}; letter-spacing: 0.1em;`,
  title: css`margin: 0 !important;`,
  subtitle: css`margin: 0 !important; color: ${token.colorTextSecondary}; font-size: ${token.fontSizeLG}px;`,
  actions: css`display: flex; flex-wrap: wrap; gap: ${token.marginSM}px; margin-top: ${token.marginSM}px;`,
  steps: css`display: grid; gap: ${token.marginMD}px; grid-template-columns: 1fr; max-width: 1100px; article { display: grid; gap: ${token.marginSM}px; padding: ${token.paddingLG}px 0; border-top: 1px solid ${token.colorBorderSecondary}; color: ${token.colorTextSecondary}; } h2 { margin: 0; color: ${token.colorText}; font-size: ${token.fontSizeHeading4}px; } p { margin: 0; line-height: 1.6; } svg { color: ${token.colorPrimary}; } @media (min-width: 768px) { grid-template-columns: repeat(3, minmax(0, 1fr)); article { padding-right: ${token.paddingLG}px; } }`,
}));
