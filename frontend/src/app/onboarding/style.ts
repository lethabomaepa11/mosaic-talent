import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  eyebrow: css`
    color: ${token.colorPrimary};
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
  `,
  progress: css`margin-bottom: ${token.marginLG}px;`,
  steps: css`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 0;
    gap: ${token.marginXS}px;
    list-style: none;
    margin: ${token.marginXS}px 0;
    font-size: ${token.fontSizeSM}px;
  `,
  step: css`color: ${token.colorTextSecondary}; overflow-wrap: anywhere;`,
  currentStep: css`color: ${token.colorPrimary}; font-weight: ${token.fontWeightStrong};`,
  stepTitle: css`
    margin: 0;
    font-size: ${token.fontSizeHeading4}px;
    @media (min-width: 768px) { font-size: ${token.fontSizeHeading3}px; }
  `,
  accountDetails: css`
    display: grid;
    gap: ${token.marginXS}px;
    margin: 0;
    dt { color: ${token.colorTextSecondary}; font-size: ${token.fontSizeSM}px; }
    dd { margin: 0 0 ${token.marginSM}px; overflow-wrap: anywhere; }
  `,
  fullWidth: css`width: 100%; min-width: 0;`,
  page: css`
    min-height: 100vh;
    padding: ${token.paddingLG}px ${token.padding}px;
    background: ${token.colorBgLayout};

    @media (min-width: 768px) {
      padding: ${token.paddingXL}px ${token.paddingLG}px;
    }
  `,
  shell: css`
    max-width: 960px;
    margin: 0 auto;
  `,
  heading: css`
    margin-bottom: ${token.marginLG}px;
  `,
  title: css`
    margin: 0;
    font-family: var(--font-syne), ${token.fontFamily};
    font-size: ${token.fontSizeHeading3}px;

    @media (min-width: 768px) {
      font-size: ${token.fontSizeHeading2}px;
    }
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
  `,
  content: css`
    max-width: 700px;
    border-top: 1px solid ${token.colorBorderSecondary};
    padding-top: ${token.paddingLG}px;
  `,
  form: css`
    display: grid;
    gap: ${token.margin}px;
    max-width: 560px;
  `,
  row: css`
    display: grid;
    gap: ${token.margin}px;

    @media (min-width: 768px) {
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
  fieldHint: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextSecondary};
    line-height: 1.5;
  `,
  input: css`
    background: color-mix(in srgb, ${token.colorText} 7%, transparent);
    border-color: ${token.colorBorder};
  `,
  uploadActions: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  avatarPreview: css`
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 999px;
    border: 1px solid ${token.colorBorder};
  `,
  fullWidthInputNumber: css`
    width: 100%;
  `,
  systemRatingNotice: css`
    border: 1px solid ${token.colorInfoBorder};
    background: ${token.colorInfoBg};
    color: ${token.colorInfoText};
    border-radius: ${token.borderRadius}px;
    padding: ${token.paddingSM}px;
    font-size: ${token.fontSizeSM}px;
    line-height: ${token.lineHeight}px;
  `,
  actions: css`
    margin-top: ${token.marginSM}px;
    display: grid;
    gap: ${token.marginSM}px;

    @media (min-width: 768px) {
      display: flex;
      justify-content: flex-end;
    }
  `,
  buttonIconEnd: css`
    margin-left: ${token.marginXXS}px;
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
}));
