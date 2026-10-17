import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
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
  logoWrap: css`
    text-align: left;
    margin-bottom: ${token.marginXL}px;
  `,
  companyLogo: css`
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid ${token.colorBorder};
    margin: 0 auto ${token.marginSM}px;
    display: block;
  `,
  logoRow: css`
    display: inline-flex;
    align-items: center;
    margin-bottom: ${token.marginSM}px;
  `,
  logoImage: css`
    width: auto;
    max-width: 100%;
    height: 30px;
  `,
  tenantLabel: css`
    margin: 0 0 ${token.marginXS}px;
    color: ${token.colorText};
    font-size: ${token.fontSizeLG}px;
    font-weight: ${token.fontWeightStrong};
  `,
  subtitle: css`
    color: ${token.colorTextSecondary};
    margin: 0;
  `,
  form: css`
    display: grid;
    gap: ${token.margin}px;
    max-width: 480px;
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
    color: ${token.colorText};

    &::placeholder {
      color: color-mix(in srgb, ${token.colorText} 34%, transparent);
    }
  `,
  divider: css`
    margin: ${token.marginSM}px 0;
    color: ${token.colorTextSecondary};
    border-color: ${token.colorBorder};
  `,
  actions: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  helper: css`
    text-align: left;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  buttonIcon: css`
    margin-right: ${token.marginXXS}px;
    vertical-align: middle;
  `,
  statusError: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorError};
  `,
  statusSuccess: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorSuccess};
  `,
  footer: css`
    margin-top: ${token.marginLG}px;
    text-align: left;
    color: color-mix(in srgb, ${token.colorText} 45%, transparent);
    font-size: 12px;
    line-height: 1.6;
  `,
}));
