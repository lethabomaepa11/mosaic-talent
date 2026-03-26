import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${token.padding}px;
    background: ${token.colorBgLayout};
  `,
  shell: css`
    width: 100%;
    max-width: 480px;
  `,
  heading: css`
    text-align: center;
    margin-bottom: ${token.marginLG}px;
  `,
  title: css`
    margin: 0;
    font-family: var(--font-syne), ${token.fontFamily};
    font-size: ${token.fontSizeHeading3}px;
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
  `,
  card: css`
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG + 6}px;
    padding: ${token.paddingLG}px;
    background: color-mix(in srgb, ${token.colorFillAlter} 86%, transparent);
  `,
  form: css`
    display: grid;
    gap: ${token.margin}px;
  `,
  field: css`
    display: grid;
    gap: ${token.marginXXS}px;
  `,
  label: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
  `,
  input: css`
    background: color-mix(in srgb, ${token.colorText} 7%, transparent);
    border-color: ${token.colorBorder};
  `,
  statusError: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorError};
  `,
  helper: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  actions: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  tenantHint: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextSecondary};
    line-height: 1.6;
  `,
}));
