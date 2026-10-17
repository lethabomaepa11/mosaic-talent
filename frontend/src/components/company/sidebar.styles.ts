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
  companyLogo: css`
    width: auto;
    max-width: 100%;
    max-height: 36px;
    object-fit: contain;
  `,
  companyLogoCollapsed: css`
    max-width: 32px;
    max-height: 32px;
  `,
  body: css`
    flex: 1;
    padding: ${token.paddingMD}px ${token.paddingSM}px;
    overflow-y: auto;
  `,
  navButton: css`
    justify-content: flex-start;
    width: 100%;
    color: ${token.colorTextSecondary};

    &:hover {
      color: ${token.colorText};
    }
  `,
  iconButton: css`
    justify-content: center;
    width: 100%;
    padding-inline: 0;
  `,
  navButtonActive: css`
    color: ${token.colorPrimary};
    background: color-mix(in srgb, ${token.colorPrimary} 12%, transparent);
  `,
  footer: css`
    border-top: 1px solid ${token.colorBorder};
    padding: ${token.paddingMD}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  footerButton: css`
    justify-content: flex-start;
    width: 100%;
  `,
}));
