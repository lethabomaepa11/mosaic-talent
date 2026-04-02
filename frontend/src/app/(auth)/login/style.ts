import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${token.padding}px;
    background: ${token.colorBgLayout};
    position: relative;
    overflow: hidden;
    @media (min-width: 768px) {
      padding: ${token.paddingLG}px;
    }
  `,
  glow: css`
    position: absolute;
    top: 22%;
    left: 50%;
    transform: translateX(-50%);
    width: min(640px, 90vw);
    height: 420px;
    border-radius: 999px;
    background: color-mix(in srgb, ${token.colorPrimary} 14%, transparent);
    filter: blur(100px);
    pointer-events: none;
  `,
  shell: css`
    width: 100%;
    max-width: 460px;
    position: relative;
    z-index: 1;
  `,
  logoWrap: css`
    text-align: center;
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
  card: css`
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG + 6}px;
    background: color-mix(in srgb, ${token.colorFillAlter} 86%, transparent);
    padding: ${token.paddingLG}px;
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 16px;
      right: 16px;
      height: 1px;
      background: linear-gradient(90deg, transparent, ${token.colorPrimary}, transparent);
    }
    @media (min-width: 768px) {
      padding: ${token.paddingXL}px;
    }
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
    text-align: center;
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
    text-align: center;
    color: color-mix(in srgb, ${token.colorText} 45%, transparent);
    font-size: 12px;
    line-height: 1.6;
  `,
}));
