import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${token.padding}px;
    background: ${token.colorBgLayout};
    @media (min-width: 768px) {
      padding: ${token.paddingLG}px;
    }
  `,
  shell: css`
    width: 100%;
    max-width: 520px;
  `,
  heading: css`
    text-align: center;
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
  card: css`
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG + 6}px;
    padding: ${token.paddingLG}px;
    background: color-mix(in srgb, ${token.colorFillAlter} 86%, transparent);

    @media (min-width: 768px) {
      padding: ${token.paddingXL}px;
    }
  `,
  form: css`
    display: grid;
    gap: ${token.margin}px;
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
    text-align: center;
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
