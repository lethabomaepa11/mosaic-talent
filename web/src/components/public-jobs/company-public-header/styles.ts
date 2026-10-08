import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
    padding: ${token.paddingSM}px ${token.paddingMD}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
  `,
  brand: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    min-width: 0;
  `,
  logo: css`
    width: 42px;
    height: 42px;
    object-fit: cover;
    border-radius: ${token.borderRadius}px;
    border: 1px solid ${token.colorBorderSecondary};
  `,
  companyName: css`
    margin: 0 !important;
  `,
  meta: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    align-items: center;
  `,
  metaLink: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  contactButton: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    border-radius: ${token.borderRadius}px;
    padding: 8px 14px;
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
    text-decoration: none;
    border: none;
  `,
}));
