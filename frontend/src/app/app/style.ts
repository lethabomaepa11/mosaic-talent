import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  shell: css`display:flex;min-height:100dvh;background:${token.colorBgLayout};align-items:flex-start;`,
  main: css`flex:1;min-width:0;min-height:100dvh;display:flex;flex-direction:column;`,
  desktopSidebar: css`position:sticky;top:0;@media(max-width:991px){display:none;}`,
  content: css`width:100%;max-width:1120px;margin:0 auto;padding:${token.paddingLG}px;min-width:0;flex:1;@media(max-width:767px){padding:${token.paddingMD}px ${token.paddingMD}px calc(88px + env(safe-area-inset-bottom));}`,
  journeyPage: css`display:grid;gap:${token.marginLG}px;min-width:0;`,
  taskList: css`border:1px solid ${token.colorBorderSecondary};border-radius:${token.borderRadius}px;background:${token.colorBgContainer};`,
  taskRow: css`display:flex;align-items:center;justify-content:space-between;gap:${token.marginSM}px;padding:${token.paddingSM}px ${token.paddingMD}px;border-bottom:1px solid ${token.colorBorderSecondary};min-width:0;&:last-child{border:0;}div{min-width:0;}p{margin-top:${token.marginXXS}px;}@media(max-width:480px){align-items:flex-start;a>button{font-size:${token.fontSizeSM}px;padding-inline:${token.paddingSM}px;}}`,
  taskTitle: css`font-weight:500;line-height:1.5;overflow-wrap:anywhere;`,
  listEmpty: css`padding:${token.paddingMD}px;font-size:${token.fontSizeSM}px;line-height:1.6;p{margin:0 0 ${token.marginXXS}px;color:${token.colorTextSecondary};}`,
  moreTasks: css`padding:0 ${token.paddingMD}px ${token.paddingSM}px;margin:0;color:${token.colorTextSecondary};font-size:${token.fontSizeSM}px;`,
  pageTitle: css`margin:0!important;`,
  subtitle: css`margin:${token.marginXS}px 0 ${token.marginLG}px!important;color:${token.colorTextSecondary};`,
  mobileDrawer: css`@media(min-width:992px){display:none;}.ant-drawer-body{padding:0;}`,
  loadingState: css`min-height:60vh;display:grid;place-items:center;color:${token.colorTextSecondary};background:${token.colorBgLayout};`,
}));
