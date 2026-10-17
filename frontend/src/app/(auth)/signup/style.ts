import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  eyebrow: css`
    color: ${token.colorPrimary};
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
    margin-bottom: ${token.marginSM}px;
  `,
  page: css`
    min-height: 100vh;
    padding: ${token.padding}px;
    background: ${token.colorBgLayout};
    @media (min-width: 768px) {
      padding: ${token.paddingLG}px;
    }
  `,
  shell: css`
    width: 100%;
    max-width: 620px;
    margin: 0 auto;
    padding: ${token.paddingXL}px 0;
  `,
  topRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    margin-bottom: ${token.marginXL}px;
  `,
  productName: css`
    color: ${token.colorText};
    font-weight: ${token.fontWeightStrong};
  `,
  heading: css`
    text-align: left;
    margin-bottom: ${token.marginLG}px;
  `,
  title: css`
    margin: 0;
    font-family: var(--font-syne), ${token.fontFamily};
    font-size: ${token.fontSizeHeading4}px;

    @media (min-width: 768px) {
      font-size: ${token.fontSizeHeading3}px;
    }
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
  `,
  form: css`
    display: grid;
    gap: ${token.margin}px;
    max-width: 480px;
  `,
  row: css`
    display: grid;
    gap: ${token.margin}px;

    @media (min-width: 640px) {
      grid-template-columns: 1fr 1fr;
    }
  `,
  field: css`
    display: grid;
    gap: ${token.marginXXS}px;
  `,
  label: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextSecondary};
    font-weight: ${token.fontWeightStrong};
  `,
  input: css`
    background: color-mix(in srgb, ${token.colorText} 7%, transparent);
    border-color: ${token.colorBorder};
  `,
  actions: css`
    margin-top: ${token.marginSM}px;
    display: grid;
    gap: ${token.marginSM}px;
  `,
  buttonIconEnd: css`
    margin-left: ${token.marginXXS}px;
    vertical-align: middle;
  `,
  helper: css`
    text-align: left;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  statusError: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorError};
  `,
  statusSuccess: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorSuccess};
  `,
}));
