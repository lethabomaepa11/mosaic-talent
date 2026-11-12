import {createStyles} from "antd-style";
export const useStyles=createStyles(({token,css})=>({
  header:css`display:flex;align-items:center;justify-content:space-between;gap:${token.marginSM}px;min-height:64px;padding:${token.paddingXS}px ${token.paddingLG}px;background:${token.colorBgContainer};border-bottom:1px solid ${token.colorBorderSecondary};position:sticky;top:0;z-index:25;@media(max-width:767px){min-height:60px;padding:${token.paddingXS}px ${token.paddingMD}px;}`,
  mobileBrand:css`display:none;@media(max-width:991px){display:block;min-width:0;a{font-size:${token.fontSizeLG}px;}}`,
  context:css`color:${token.colorTextSecondary};font-size:${token.fontSizeSM}px;@media(max-width:991px){display:none;}`,
  actions:css`display:flex;align-items:center;gap:${token.marginXS}px;flex:none;.ant-btn{width:40px;height:40px;padding:0;}@media(max-width:480px){gap:0;.ant-btn{width:36px;height:44px;}}`,
  findLink:css`display:inline-flex;align-items:center;gap:${token.marginXS}px;margin-right:${token.marginMD}px;font-size:${token.fontSizeSM}px;@media(max-width:767px){display:none;}`,
  avatarButton:css`appearance:none;background:none;border:0;min-width:44px;min-height:44px;padding:0;display:grid;place-items:center;cursor:pointer;.ant-avatar{background:${token.colorFillSecondary};color:${token.colorText};font-size:${token.fontSizeSM}px;}`,
}));
