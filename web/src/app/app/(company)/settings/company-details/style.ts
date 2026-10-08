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
  loaderWrap: css`
    min-height: 50vh;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  logoActions: css`
    margin-top: ${token.marginSM}px;
    display: flex;
    gap: ${token.marginSM}px;
    align-items: center;
    flex-wrap: wrap;
  `,
  logoPreview: css`
    max-height: 40px;
    width: auto;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusSM}px;
    padding: 4px;
    background: ${token.colorBgContainer};
  `,
}));
