import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  sidebar: css`
    display: flex;
    flex-direction: column;
    width: 240px;
    min-width: 240px;
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
  sidebarCollapsed: css`
    width: 76px;
    min-width: 76px;

    @media (max-width: 991px) {
      width: 100%;
      min-width: 100%;
    }
  `,
  logoRow: css`
    display: flex;
    align-items: center;
    height: 64px;
    padding: 0 ${token.paddingLG}px;
    border-bottom: 1px solid ${token.colorBorder};
    justify-content: space-between;
  `,
  logoRowCollapsed: css`
    flex-direction: column;
    justify-content: center;
    gap: ${token.marginXXS}px;
    height: 92px;
    padding: ${token.paddingXS}px;
  `,
  logoImage: css`
    width: auto;
    max-width: 100%;
    height: 26px;
  `,
  logoImageCollapsed: css`
    width: 32px;
    height: 32px;
  `,
  collapseButton: css`
    flex: none;
    color: ${token.colorTextSecondary};
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
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    padding: ${token.paddingSM}px;
    border-radius: ${token.borderRadius}px;
    justify-content: flex-start;
    width: 100%;
    min-height: 48px;
    color: ${token.colorTextSecondary};

    &:hover {
      color: ${token.colorText};
      background: color-mix(in srgb, ${token.colorText} 6%, transparent);
    }
  `,
  iconButton: css`
    justify-content: center;
    width: 100%;
    padding-inline: 0;
  `,
  navButtonActive: css`
    color: ${token.colorText};
    background: color-mix(in srgb, ${token.colorPrimary} 12%, transparent);

    &:hover {
      color: ${token.colorText};
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
  startBuild: css`margin-top:${token.marginLG}px;border:1px solid ${token.colorBorder};font-weight:600;`,
  footerMotto: css`font-family:var(--font-syne),sans-serif;font-size:${token.fontSizeXL}px;letter-spacing:-.04em;line-height:1.35;margin:0 0 ${token.marginLG}px;color:${token.colorText};`,
}));
