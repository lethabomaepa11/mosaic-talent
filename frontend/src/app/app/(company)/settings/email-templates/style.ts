import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: 0 !important;
    color: ${token.colorTextSecondary};
  `,
  fullWidth: css`
    width: 100%;
  `,
  switchRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
  `,
  tokenWrap: css`
    margin-top: ${token.marginXS}px;
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  token: css`
    background: ${token.colorFillSecondary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusSM}px;
    padding: 4px 8px;
    font-size: 12px;
  `,
  loaderWrap: css`
    min-height: 50vh;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
}));
