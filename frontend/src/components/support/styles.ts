import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  trigger: css`
    position: fixed;
    right: ${token.marginLG}px;
    bottom: calc(${token.marginLG}px + env(safe-area-inset-bottom, 0px));
    z-index: 100;
    min-width: 44px;
    min-height: 44px;
    box-shadow: ${token.boxShadowSecondary};
    @media (max-width: 991px) {
      right: ${token.marginSM}px;
      bottom: calc(80px + ${token.marginSM}px + env(safe-area-inset-bottom, 0px));
    }
  `,
  options: css`
    display: grid;
    gap: ${token.marginMD}px;
    a { color: ${token.colorLink}; }
    p { margin: 0; color: ${token.colorTextSecondary}; }
  `,
}));
