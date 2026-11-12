import { createStyles } from "antd-style";

export const useJourneyStyles = createStyles(({ token, css }) => ({
  preferenceFields: css`
    display:grid;gap:${token.marginMD}px;min-width:0;
    label{display:block;font-weight:500;margin-bottom:${token.marginXS}px;}
    small{display:block;color:${token.colorTextSecondary};line-height:1.5;margin-top:${token.marginXXS}px;}
    .ant-select,.ant-input-number{width:100%;}
  `,
  brand: css`display:inline-flex;align-items:center;flex:none;line-height:1;`,
  brandImage: css`display:block;width:144px;height:auto;`,
  brandCompactImage: css`display:block;width:32px;height:32px;`,
  eyebrow: css`font-size:${token.fontSizeSM}px;font-weight:500;color:${token.colorTextSecondary};margin:0;`,
  title: css`font-family:${token.fontFamily};font-size:${token.fontSizeHeading3}px;font-weight:600;line-height:1.3;letter-spacing:-.02em;margin:0 0 ${token.marginXXS}px;color:${token.colorText};`,
  lead: css`font-size:${token.fontSize}px;line-height:1.6;color:${token.colorTextSecondary};margin:0;max-width:680px;`,
  sectionTitle: css`font-size:${token.fontSizeLG}px;font-weight:600;margin:0;line-height:1.5;`,
  sectionHeader: css`display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:${token.marginSM}px;`,
  row: css`display:flex;align-items:center;gap:${token.marginXS}px;flex-wrap:wrap;`,
  stack: css`display:grid;gap:${token.marginSM}px;min-width:0;`,
  panel: css`padding:${token.paddingMD}px;border:1px solid ${token.colorBorderSecondary};border-radius:${token.borderRadius}px;background:${token.colorBgContainer};min-width:0;`,
  softPanel: css`padding:${token.paddingMD}px;border:1px solid ${token.colorBorderSecondary};border-radius:${token.borderRadius}px;background:${token.colorBgContainer};min-width:0;`,
  muted: css`color:${token.colorTextSecondary};line-height:1.6;margin:0;`,
  small: css`color:${token.colorTextSecondary};font-size:${token.fontSizeSM}px;line-height:1.5;margin:0;`,
  pill: css`display:inline-flex;align-items:center;padding:${token.paddingXXS}px ${token.paddingXS}px;border:1px solid ${token.colorBorderSecondary};border-radius:${token.borderRadiusSM}px;font-size:${token.fontSizeSM}px;color:${token.colorTextSecondary};background:${token.colorFillQuaternary};`,
  link: css`display:inline-flex;gap:${token.marginXS}px;align-items:center;font-weight:500;color:${token.colorText};text-decoration:underline;text-underline-offset:3px;`,
  divider: css`border:0;border-top:1px solid ${token.colorBorderSecondary};margin:${token.marginMD}px 0;`,
  projectList: css`border:1px solid ${token.colorBorderSecondary};border-radius:${token.borderRadius}px;background:${token.colorBgContainer};overflow:hidden;box-shadow:${token.boxShadowTertiary};`,
  card: css`padding:${token.paddingMD}px;min-width:0;border-bottom:1px solid ${token.colorBorderSecondary};&:last-child{border-bottom:0;}transition:background .15s ease;&:hover{background:${token.colorFillQuaternary};}&:focus-within{background:${token.colorFillQuaternary};}`,
  cardBody: css`display:grid;gap:${token.marginXS}px;min-width:0;h3{font-size:${token.fontSize}px;line-height:1.5;margin:0;font-weight:600;overflow-wrap:anywhere;}p{margin:0;line-height:1.5;color:${token.colorTextSecondary};overflow-wrap:anywhere;}`,
  projectDescription: css`display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:${token.fontSizeSM}px;`,
  projectMeta: css`display:flex;flex-wrap:wrap;gap:${token.marginXXS}px ${token.marginMD}px;font-size:${token.fontSizeSM}px;color:${token.colorTextSecondary};`,
  cardFooter: css`display:flex;justify-content:space-between;gap:${token.marginSM}px;align-items:center;flex-wrap:wrap;padding-top:${token.paddingXS}px;.ant-avatar{background:${token.colorFillSecondary};color:${token.colorText};}`,
  fit: css`font-size:${token.fontSizeSM}px;color:${token.colorTextSecondary};summary{cursor:pointer;padding-top:${token.paddingXXS}px;}ul{margin:${token.marginXS}px 0;padding-left:${token.paddingLG}px;line-height:1.6;}`,
  empty: css`display:grid;gap:${token.marginSM}px;text-align:left;padding:${token.paddingLG}px;border:1px solid ${token.colorBorderSecondary};border-radius:${token.borderRadius}px;background:${token.colorBgContainer};h2{margin:0;font-size:${token.fontSizeLG}px;font-weight:600;}p{margin:0;color:${token.colorTextSecondary};line-height:1.6;}@media(max-width:480px){padding:${token.paddingMD}px;}`,
}));
