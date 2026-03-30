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
    height: calc(100vh - 220px);
    min-height: 700px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
    overflow: hidden;
  `,
  workspaceToolbar: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid ${token.colorBorderSecondary};
    border-bottom: none;
    background: ${token.colorBgContainer};
    padding: ${token.paddingXS}px ${token.paddingSM}px;
  `,
  copilotRail: css`
    height: 100%;
  `,
  panelGroup: css`
    width: 100%;
    height: 100%;
    min-height: 700px;
  `,
  resizeHandle: css`
    width: 1px;
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
    height: 100%;
    min-height: 0;
    background: ${token.colorBgContainer};
    overflow: hidden;
    position: relative;
  `,
  panelHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    padding: ${token.paddingXS}px ${token.paddingSM}px;
    background: ${token.colorBgContainerDisabled};
  `,
  workspacePanel: css`
    height: 100%;
    background: ${token.colorBgContainer};
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,
  workbenchRoot: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 700px;
    background: ${token.colorBgContainer};
  `,
  workbenchTopBar: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${token.paddingXS}px ${token.paddingSM}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
  `,
  filePanelBody: css`
    padding: ${token.paddingSM}px;
    overflow: auto;
    min-width: 0;
  `,
  previewColumn: css`
    height: 100%;
    overflow: auto;
    padding: ${token.paddingXS}px;
    background: ${token.colorBgContainer};
    min-width: 0;
  `,
  apiPlaygroundBody: css`
    padding: ${token.paddingSM}px;
    overflow: auto;
  `,
  editorHost: css`
    position: relative;
    height: clamp(320px, 52vh, 640px);
    min-height: 320px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    min-width: 0;
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
    padding: ${token.paddingXS}px ${token.paddingSM}px ${token.paddingSM}px;
    background: ${token.colorBgLayout};
    min-height: 140px;
  `,
  terminalShell: css`
    margin-top: ${token.marginXS}px;
    height: 130px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusSM}px;
    overflow: hidden;
  `,
  workbenchPanel: css`
    min-height: 460px;
  `,
  previewFrame: css`
    width: 100%;
    min-height: 460px;
    border: none;
    background: ${token.colorBgBase};
  `,
  copilotPanel: css`
    height: 100%;
    display: flex;
    flex-direction: column;
    background: ${token.colorBgContainer};
    min-width: 0;
  `,
  copilotBody: css`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  `,
  copilotMessages: css`
    flex: 1;
    overflow: auto;
    padding: ${token.paddingSM}px;
  `,
  chatItem: css`
    border: 1px solid ${token.colorBorderSecondary};
    padding: ${token.paddingSM}px;
    background: ${token.colorBgContainer};
  `,
  chatItemHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginXS}px;
    margin-bottom: ${token.marginXS}px;
  `,
  copilotComposer: css`
    border-top: 1px solid ${token.colorBorderSecondary};
    padding: ${token.paddingSM}px;
    background: ${token.colorBgContainer};
  `,
  copilotInput: css`
    width: 100%;
  `,
  sendButton: css`
    width: 38px;
    min-width: 38px;
    padding-inline: 0 !important;
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
