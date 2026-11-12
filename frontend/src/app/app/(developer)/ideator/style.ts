import { createStyles } from "antd-style";
export const useStyles = createStyles(({ token, css }) => ({
  page: css`max-width: 960px; margin: 0 auto; padding:0; display: flex; flex-direction: column; gap: ${token.marginLG}px; @media(max-width:767px){padding:0;}`,
  heading: css`display:flex; flex-direction:column; gap:${token.marginXS}px;`,
  composer: css`display:flex; flex-direction:column; gap:${token.marginSM}px; padding:${token.paddingMD}px 0; `,
  feed: css`display:flex; flex-direction:column;`,
  post: css`padding:${token.paddingLG}px 0; border-bottom:1px solid ${token.colorBorderSecondary}; display:flex; flex-direction:column; gap:${token.marginSM}px; min-width:0; overflow-wrap:anywhere;`,
  meta: css`display:flex; flex-wrap:wrap; align-items:center; gap:${token.marginXS}px; color:${token.colorTextSecondary}; font-size:${token.fontSizeSM}px;`,
  title: css`margin:0 !important;`,
  statement: css`border-left:3px solid ${token.colorPrimary}; padding-left:${token.paddingSM}px; white-space:pre-wrap; overflow-wrap:anywhere;`,
  actions: css`display:flex; flex-wrap:wrap; gap:${token.marginXS}px;`,
  comments: css`display:flex; flex-direction:column; gap:${token.marginXS}px; padding-left:${token.paddingSM}px; border-left:1px solid ${token.colorBorderSecondary};`,
  comment: css`display:flex; flex-wrap:wrap; min-width:0; gap:${token.marginXS}px; overflow-wrap:anywhere;`,
  formActions: css`display:flex; justify-content:flex-end; gap:${token.marginXS}px; @media(max-width:480px){flex-direction:column-reverse; &>*{width:100%;}}`,
}));

