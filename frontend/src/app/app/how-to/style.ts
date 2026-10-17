import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: grid;
    gap: ${token.marginXL}px;
    max-width: 960px;
  `,
  header: css`
    display: grid;
    gap: ${token.marginSM}px;
    max-width: 680px;
  `,
  eyebrow: css`
    color: ${token.colorPrimary};
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
    letter-spacing: 0.08em;
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: 0 !important;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeLG}px;
  `,
  steps: css`
    display: grid;
    gap: ${token.margin}px;
  `,
  step: css`
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    align-items: start;
    gap: ${token.marginSM}px;
    padding: ${token.paddingLG}px 0;
    border-top: 1px solid ${token.colorBorderSecondary};

    @media (max-width: 575px) {
      grid-template-columns: auto minmax(0, 1fr);
    }
  `,
  stepNumber: css`
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: ${token.borderRadiusSM}px;
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
    font-weight: ${token.fontWeightStrong};
  `,
  stepIcon: css`
    color: ${token.colorTextSecondary};

    @media (max-width: 575px) {
      display: none;
    }
  `,
  stepContent: css`
    display: grid;
    gap: ${token.marginXXS}px;
  `,
  stepTitle: css`
    margin: 0 !important;
  `,
  stepText: css`
    margin: 0 !important;
    color: ${token.colorTextSecondary};
  `,
  stepAction: css`
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: ${token.marginXXS}px;
    padding-inline: 0 !important;
  `,
}));
