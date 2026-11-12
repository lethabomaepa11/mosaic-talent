import { createStyles } from "antd-style";
export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: grid;
    gap: ${token.marginLG}px;
    max-width: 640px;
    h1 { margin: 0; font-size: ${token.fontSizeHeading2}px; }
  `,
}));
