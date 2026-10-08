import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  shell: css`
    height: 100vh;
    display: flex;
    background: ${token.colorBgLayout};
    overflow: hidden;

    @media (max-width: 991px) {
      flex-direction: column;
      height: auto;
      min-height: 100vh;
      overflow: visible;
    }
  `,
  main: css`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;

    @media (max-width: 991px) {
      height: auto;
      overflow: visible;
    }
  `,
  desktopSidebar: css`
    @media (max-width: 991px) {
      display: none;
    }
  `,
  content: css`
    flex: 1;
    padding: ${token.paddingLG}px;
    overflow-y: auto;

    @media (max-width: 767px) {
      padding: ${token.padding}px;
    }
  `,
  mobileDrawer: css`
    @media (min-width: 992px) {
      display: none;
    }

    :global(.ant-drawer-body) {
      padding: 0;
    }
  `,
  pageTitle: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 ${token.marginLG}px !important;
    color: ${token.colorTextSecondary};
  `,
  loadingState: css`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${token.colorTextSecondary};
    background: ${token.colorBgLayout};
  `,
}));
