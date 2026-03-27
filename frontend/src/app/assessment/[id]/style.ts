import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    width: 100%;
    max-width: none;
    margin: 0;
    padding: ${token.paddingSM}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;

    @media (min-width: 1024px) {
      padding: ${token.paddingMD}px;
    }
  `,
  loader: css`
    min-height: 70vh;
    display: grid;
    place-items: center;
  `,
  headerCard: css`
    border-radius: ${token.borderRadiusLG}px;
    background: linear-gradient(
      135deg,
      ${token.colorBgContainer} 0%,
      ${token.colorFillTertiary} 100%
    );
    border: 1px solid ${token.colorBorderSecondary};

    :global(.ant-card-body) {
      display: flex;
      flex-direction: column;
      gap: ${token.marginSM}px;
    }
  `,
  blockedCard: css`
    min-height: 70vh;
    display: grid;
    place-items: center;
    text-align: center;
  `,
  heading: css`
    margin: 0 !important;
  `,
  muted: css`
    color: ${token.colorTextSecondary};
  `,
  formCard: css`
    border-radius: ${token.borderRadiusLG}px;
  `,
  questionnaireAlert: css`
    background: ${token.colorFillQuaternary} !important;
    border: 1px solid ${token.colorBorderSecondary} !important;
    color: ${token.colorTextSecondary} !important;

    .ant-alert-icon {
      color: ${token.colorTextTertiary} !important;
    }
  `,
  inputCol: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  headerTop: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: ${token.marginMD}px;
    flex-wrap: wrap;
  `,
  headerIdentity: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
    min-width: 260px;
  `,
  headerActions: css`
    margin-left: auto;
  `,
  headerMeta: css`
    :global(.ant-tag) {
      margin-inline-end: 0;
      border-radius: 999px;
      padding: 2px 10px;
      border: 1px solid ${token.colorBorderSecondary};
      background: ${token.colorBgContainer};
    }
  `,
  testsGrid: css`
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: ${token.marginSM}px;

    @media (min-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  workbenchGrid: css`
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: ${token.marginSM}px;

    @media (min-width: 1024px) {
      grid-template-columns: 64px minmax(0, 1.6fr) minmax(0, 1fr);
    }
  `,
  workbenchWithCopilot: css`
    width: 100%;
    min-height: 640px;
  `,
  copilotRail: css`
    @media (min-width: 1280px) {
      position: sticky;
      top: ${token.paddingSM}px;
      max-height: calc(100vh - 120px);
      overflow: auto;
    }
  `,
  panelGroup: css`
    width: 100%;
    min-height: 640px;
  `,
  resizeHandle: css`
    width: 6px;
    background: ${token.colorBorderSecondary};
    cursor: col-resize;
  `,
  activityRail: css`
    display: none;
    @media (min-width: 1024px) {
      display: flex;
      flex-direction: column;
      gap: ${token.marginXS}px;
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: ${token.borderRadius}px;
      padding: ${token.paddingXS}px;
      background: ${token.colorBgContainer};
    }
  `,
  railButton: css`
    width: 100%;
    justify-content: flex-start;
  `,
  fileRow: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
  `,
  folderRow: css`
    display: flex;
    align-items: center;
    min-height: 28px;
  `,
  dragTarget: css`
    border: 1px dashed ${token.colorPrimaryBorder};
    border-radius: ${token.borderRadiusSM}px;
    background: ${token.colorPrimaryBg};
  `,
  fileButton: css`
    flex: 1;
    text-align: left;
    justify-content: flex-start;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  vscodeColumn: css`
    display: flex;
    flex-direction: column;
    min-height: 460px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
    overflow: hidden;
  `,
  panelHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    padding: ${token.paddingXS}px ${token.paddingSM}px;
    background: ${token.colorBgContainerDisabled};
  `,
  editorArea: css`
    flex: 1;
    min-height: 240px;
    border: none !important;
    textarea {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace !important;
      font-size: 12px !important;
      line-height: 1.6 !important;
    }
  `,
  terminalPanel: css`
    border-top: 1px solid ${token.colorBorderSecondary};
    padding: ${token.paddingSM}px;
    background: ${token.colorBgLayout};
    min-height: 120px;
  `,
  terminalShell: css`
    margin-top: ${token.marginXS}px;
    height: 140px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusSM}px;
    overflow: hidden;
  `,
  workbenchPanel: css`
    min-height: 460px;
  `,
  previewFrame: css`
    width: 100%;
    min-height: 420px;
    border: none;
    background: ${token.colorBgBase};
  `,
  terminalList: css`
    margin: 0;
    padding-left: ${token.paddingMD}px;
    max-height: 160px;
    overflow: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
  `,
  codeEditor: css`
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  `,
  resultGrid: css`
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: ${token.marginSM}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `,
  resultList: css`
    margin: 0;
    padding-left: ${token.paddingMD}px;
  `,
}));
