import { createStyles } from "antd-style";
export const useStyles=createStyles(({token,css})=>({
  page:css`display:grid;gap:${token.marginLG}px;max-width:800px;min-width:0;`,
  form:css`display:grid;gap:${token.marginLG}px;min-width:0;`,
  fields:css`display:grid;gap:${token.marginLG}px;label{display:block;font-weight:500;margin-bottom:${token.marginXS}px;}.ant-select{width:100%;}`,
}));
