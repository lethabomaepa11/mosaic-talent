import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  triggerButton: css`
    color: ${token.colorTextSecondary};
  `,
  drawerBody: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
    padding-bottom: ${token.paddingXS}px;
  `,
  topActions: css`
    display: flex;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
  `,
  hintText: css`
    margin: 0;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    line-height: 1.5;
  `,
  itemMessage: css`
    margin: 0 !important;
    font-weight: ${token.fontWeightStrong};
  `,
  itemMeta: css`
    margin: 0 !important;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  itemActions: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  severityTag: css`
    margin-inline-end: 0 !important;
  `,
}));
