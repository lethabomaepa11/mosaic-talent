import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    min-height: 100vh;
    padding: ${token.paddingLG}px ${token.padding}px;
    background: ${token.colorBgLayout};

    @media (min-width: 768px) {
      padding: ${token.paddingXL}px ${token.paddingLG}px;
    }
  `,
  shell: css`
    max-width: 860px;
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
