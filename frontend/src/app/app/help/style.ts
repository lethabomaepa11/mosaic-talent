import {createStyles} from "antd-style";
export const useStyles=createStyles(({token,css})=>({page:css`display:grid;gap:${token.marginLG}px;max-width:760px;`}));
