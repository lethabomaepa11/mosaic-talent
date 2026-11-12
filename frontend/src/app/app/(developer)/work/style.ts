import { createStyles } from "antd-style";
export const useStyles=createStyles(({token,css})=>({
  page:css`display:grid;gap:${token.marginLG}px;min-width:0;`,
  summary:css`line-height:1.7;color:${token.colorTextSecondary};white-space:pre-wrap;overflow-wrap:anywhere;`,
}));
