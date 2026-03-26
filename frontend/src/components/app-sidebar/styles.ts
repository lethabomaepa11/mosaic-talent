import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  sidebar: css`
    display: flex;
    flex-direction: column;
    width: 260px;
    min-width: 260px;
    height: 100vh;
    position: sticky;
    top: 0;
    align-self: flex-start;
    border-right: 1px solid ${token.colorBorder};
    background: color-mix(in srgb, ${token.colorBgContainer} 92%, ${token.colorBgBase});

    @media (max-width: 991px) {
      position: static;
      width: 100%;
      min-width: 100%;
      height: auto;
      min-height: 100vh;
    }
  `,
  logoRow: css`
    display: flex;
    align-items: center;
    height: 64px;
    padding: 0 ${token.paddingLG}px;
    border-bottom: 1px solid ${token.colorBorder};
  `,
  logoImage: css`
    width: auto;
    max-width: 100%;
    height: 26px;
  `,
  body: css`
    flex: 1;
    overflow-y: auto;
    padding: ${token.paddingMD}px ${token.paddingSM}px;
  `,
  navGroup: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  navLink: css`
    display: block;
  `,
  navButton: css`
    justify-content: flex-start;
    width: 100%;
    height: 40px;
    color: ${token.colorTextSecondary};

    &:hover {
      color: ${token.colorText};
      background: color-mix(in srgb, ${token.colorText} 6%, transparent);
    }
  `,
  navButtonActive: css`
    color: ${token.colorPrimary};
    background: color-mix(in srgb, ${token.colorPrimary} 12%, transparent);

    &:hover {
      color: ${token.colorPrimary};
      background: color-mix(in srgb, ${token.colorPrimary} 12%, transparent);
    }
  `,
  sectionTitle: css`
    margin: 0 0 ${token.marginXS}px;
    padding: 0 ${token.paddingSM}px;
    color: ${token.colorTextTertiary};
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 11px;
    font-weight: ${token.fontWeightStrong};
  `,
  quickButton: css`
    width: 100%;
    justify-content: flex-start;
    color: ${token.colorTextSecondary};
    height: 34px;
    padding-left: ${token.paddingSM}px;

    &:hover {
      color: ${token.colorText};
      background: color-mix(in srgb, ${token.colorText} 6%, transparent);
    }
  `,
  footer: css`
    border-top: 1px solid ${token.colorBorder};
    padding: ${token.paddingMD}px;
  `,
  signOut: css`
    width: 100%;
    justify-content: flex-start;
    color: ${token.colorTextSecondary};

    &:hover {
      color: ${token.colorText};
      background: color-mix(in srgb, ${token.colorText} 6%, transparent);
    }
  `,
  footerMeta: css`
    margin: ${token.marginXS}px 0 0;
    padding-left: ${token.paddingSM}px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM - 1}px;
  `,
}));
