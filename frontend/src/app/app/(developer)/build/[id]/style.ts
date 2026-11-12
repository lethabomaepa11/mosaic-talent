import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`display:grid;gap:${token.marginMD}px;min-width:0;`,
  back: css`display:inline-flex;align-items:center;gap:${token.marginXS}px;font-size:${token.fontSizeSM}px;color:${token.colorTextSecondary};width:fit-content;&:hover{text-decoration:underline;}`,
  header: css`display:flex;justify-content:space-between;align-items:flex-start;gap:${token.marginMD}px;flex-wrap:wrap;`,
  heading: css`font-family:${token.fontFamily};font-size:${token.fontSizeHeading3}px;line-height:1.3;margin:0 0 ${token.marginXS}px;font-weight:600;overflow-wrap:anywhere;`,
  meta: css`display:flex;gap:${token.marginXS}px ${token.marginMD}px;flex-wrap:wrap;font-size:${token.fontSizeSM}px;color:${token.colorTextSecondary};`,
  tabs: css`min-width:0;.ant-tabs-nav{margin:0;}.ant-tabs-tab{font-size:${token.fontSizeSM}px;padding-block:${token.paddingSM}px;}
    @media(max-width:767px){
      .ant-tabs-nav-list{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;transform:none!important;}
      .ant-tabs-nav-wrap{overflow:visible;}
      .ant-tabs-nav-operations{display:none!important;}
      .ant-tabs-tab{margin:0!important;min-width:0;justify-content:center;min-height:44px;padding:${token.paddingXS}px ${token.paddingXXS}px;}
      .ant-tabs-tab-btn{white-space:normal!important;text-align:center;line-height:1.4;}
      .ant-tabs-tab-active{background:${token.colorFillQuaternary};box-shadow:inset 0 -2px ${token.colorPrimary};}
      .ant-tabs-ink-bar{display:none;}
    }`,
  overview: css`display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:${token.marginXL}px;@media(max-width:900px){grid-template-columns:1fr;gap:${token.marginLG}px;}`,
  detailsSection: css`display:grid;gap:${token.marginXS}px;padding-bottom:${token.paddingMD}px;h2{font-size:${token.fontSizeLG}px;font-weight:600;margin:0;}`,
  projectFacts: css`align-self:start;display:grid;gap:${token.marginSM}px;padding:${token.paddingMD}px;border:1px solid ${token.colorBorderSecondary};border-radius:${token.borderRadius}px;background:${token.colorBgContainer};dl{margin:0;display:grid;gap:${token.marginXS}px;}dt{font-size:${token.fontSizeSM}px;color:${token.colorTextSecondary};}dd{margin:0 0 ${token.marginXS}px;font-size:${token.fontSizeSM}px;overflow-wrap:anywhere;}`,
  prose: css`white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65;color:${token.colorTextSecondary};margin:0;`,
  board: css`display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${token.marginSM}px;@media(max-width:900px){grid-template-columns:1fr;[data-empty="true"]{display:none;}}`,
  mobileEmpty: css`display:none;color:${token.colorTextSecondary};font-size:${token.fontSizeSM}px;margin:0;@media(max-width:900px){display:block;}`,
  column: css`display:grid;align-content:start;gap:${token.marginSM}px;background:${token.colorFillQuaternary};padding:${token.paddingSM}px;border:1px solid ${token.colorBorderSecondary};border-radius:${token.borderRadius}px;min-width:0;h2{font-size:${token.fontSizeSM}px;margin:0;font-weight:600;}`,
  task: css`scroll-margin-top:120px;box-shadow:${token.boxShadowTertiary};&[data-focused="true"]{border-color:${token.colorPrimary};outline:2px solid ${token.colorPrimaryBg};}background:${token.colorBgContainer};border:1px solid ${token.colorBorderSecondary};border-radius:${token.borderRadius}px;padding:${token.paddingSM}px;display:grid;gap:${token.marginXS}px;min-width:0;h3{margin:0;font-size:${token.fontSize}px;font-weight:500;overflow-wrap:anywhere;}p{margin:0;font-size:${token.fontSizeSM}px;line-height:1.5;color:${token.colorTextSecondary};white-space:pre-wrap;overflow-wrap:anywhere;}.ant-select{width:100%;}`,
  taskFilter: css`width:180px;@media(max-width:480px){width:100%;}`,
  taskForm: css`display:grid;gap:${token.marginMD}px;label{display:block;font-weight:500;margin-bottom:${token.marginXS}px;}`,
  people: css`border:1px solid ${token.colorBorderSecondary};border-radius:${token.borderRadius}px;background:${token.colorBgContainer};`,
  member: css`display:flex;align-items:center;gap:${token.marginSM}px;padding:${token.paddingSM}px ${token.paddingMD}px;border-bottom:1px solid ${token.colorBorderSecondary};&:last-child{border:0;}`,
  actionRow: css`display:flex;gap:${token.marginXS}px;flex-wrap:wrap;align-items:center;`,
}));
