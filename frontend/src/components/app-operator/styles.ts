import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  trigger: css`
    position: fixed;
    right: ${token.marginLG}px;
    bottom: ${token.marginLG}px;
    z-index: 1050;

    @media (max-width: 767px) {
      right: ${token.marginSM}px;
      bottom: calc(${token.marginXL}px + 64px);
    }
  `,
  drawerBody: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    height: 100%;
    padding-bottom: ${token.paddingSM}px;
  `,
  history: css`
    flex: 1;
    overflow-y: auto;
    padding: ${token.paddingSM}px;
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
    min-height: 240px;
  `,
  message: css`
    padding: ${token.paddingXS}px ${token.paddingSM}px;
    border-radius: ${token.borderRadius}px;
    margin-bottom: ${token.marginXS}px;
    line-height: 1.45;
    white-space: pre-wrap;
  `,
  userMessage: css`
    background: ${token.colorPrimaryBg};
  `,
  assistantMessage: css`
    background: ${token.colorFillTertiary};
  `,
  footerRow: css`
    display: flex;
    gap: ${token.marginXS}px;
    align-items: center;
  `,
  input: css`
    flex: 1;
  `,
  confirmBox: css`
    border: 1px solid ${token.colorWarningBorder};
    background: ${token.colorWarningBg};
    border-radius: ${token.borderRadius}px;
    padding: ${token.paddingSM}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  confirmActions: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  statusRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
  `,
  statusOn: css`
    color: ${token.colorSuccess};
  `,
  statusOff: css`
    color: ${token.colorTextSecondary};
  `,
}));
