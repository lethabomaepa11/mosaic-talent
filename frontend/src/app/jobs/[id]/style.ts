import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    width: min(960px, 100%);
    margin: 0 auto;
    padding: ${token.paddingLG}px ${token.paddingMD}px ${token.paddingXL}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingLG}px;
    background: ${token.colorBgContainer};
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: 0;
    color: ${token.colorTextSecondary};
  `,
  formGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginSM}px;
  `,
  fullSpan: css`
    grid-column: 1 / -1;
  `,
  actions: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
    justify-content: flex-end;
  `,
  metaRow: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
    color: ${token.colorTextSecondary};
  `,
  resumeUploadRow: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  resumeName: css`
    color: ${token.colorTextSecondary};
    word-break: break-word;
  `,
  resumeHint: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
}));
