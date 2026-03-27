import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  footer: css`
    margin-top: ${token.marginXL}px;
    padding-top: ${token.paddingMD}px;
    border-top: 1px solid ${token.colorBorderSecondary};
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  links: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
  `,
  link: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  note: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    margin: 0;
  `,
}));

