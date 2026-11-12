import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`display:grid;gap:${token.marginMD}px;min-width:0;`,
  filters: css`
    display:grid;grid-template-columns:minmax(0,1fr) 210px 220px;gap:${token.marginSM}px;
    >*{min-width:0;}.ant-select{width:100%;}
    @media(max-width:1100px){grid-template-columns:repeat(2,minmax(0,1fr));>*:first-child{grid-column:1/-1;}}
    @media(max-width:480px){grid-template-columns:1fr;}
  `,
}));
