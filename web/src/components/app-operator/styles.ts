import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  trigger: css`
    position: fixed;
    right: ${token.marginLG}px;
    bottom: ${token.marginLG}px;
    z-index: 1050;
    box-shadow: ${token.boxShadowSecondary};

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
  metaRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  statusRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
  `,
  statusOn: css`
    color: ${token.colorSuccess};
  `,
  statusOff: css`
    color: ${token.colorTextSecondary};
  `,
  guidedCard: css`
    border: 1px solid ${token.colorPrimaryBorder};
    background: linear-gradient(
      135deg,
      ${token.colorBgContainer},
      ${token.colorPrimaryBg}
    );
  `,
  stepRow: css`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
    padding: ${token.paddingXS}px 0;
  `,
  stepsList: css`
    display: flex;
    flex-direction: column;
  `,
  stepIndex: css`
    font-weight: ${token.fontWeightStrong};
    color: ${token.colorTextSecondary};
    min-width: 24px;
  `,
  stepTitle: css`
    flex: 1;
    min-width: 180px;
  `,
  executionOffer: css`
    border: 1px solid ${token.colorInfoBorder};
    background: ${token.colorInfoBg};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  executionOfferActions: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  history: css`
    flex: 1;
    overflow-y: auto;
    padding: ${token.paddingSM}px;
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
    min-height: 220px;
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
  cursorHalo: css`
    position: fixed;
    pointer-events: none;
    border: 2px solid ${token.colorPrimary};
    border-radius: ${token.borderRadiusLG}px;
    z-index: 1300;
    box-shadow: ${token.boxShadowSecondary};
    transition:
      left 0.18s ease,
      top 0.18s ease,
      width 0.18s ease,
      height 0.18s ease;
  `,
  cursorDot: css`
    position: fixed;
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: ${token.colorPrimary};
    border: 2px solid ${token.colorWhite};
    pointer-events: none;
    z-index: 1301;
    box-shadow: ${token.boxShadow};
    transition:
      left 0.16s ease,
      top 0.16s ease;
  `,
  cursorLabel: css`
    position: fixed;
    pointer-events: none;
    z-index: 1302;
    background: ${token.colorBgElevated};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
    padding: 2px ${token.paddingXS}px;
    color: ${token.colorText};
    font-size: ${token.fontSizeSM}px;
    box-shadow: ${token.boxShadowSecondary};
    max-width: min(260px, 80vw);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
}));
