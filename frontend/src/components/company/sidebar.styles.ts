import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  sidebar: css`
    display: flex;
    flex-direction: column;
    width: 260px;
    min-width: 260px;
    min-height: 100vh;
    border-right: 1px solid ${token.colorBorder};
    background: color-mix(in srgb, ${token.colorBgContainer} 92%, ${token.colorBgBase});
  `,
  logoRow: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    height: 64px;
    padding: 0 ${token.paddingLG}px;
    border-bottom: 1px solid ${token.colorBorder};
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
