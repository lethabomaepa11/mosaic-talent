import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  header: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: 0;
    color: ${token.colorTextSecondary};
  `,
  layout: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: 1fr;
    align-items: start;

    @media (min-width: 1200px) {
      grid-template-columns: 300px minmax(0, 1fr) 260px;
      min-height: calc(100vh - 180px);
    }
  `,
  panel: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: ${token.colorBgContainer};
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    min-height: 460px;

    @media (min-width: 1200px) {
      position: sticky;
      top: ${token.marginMD}px;
      max-height: calc(100vh - 32px);
      overflow: auto;
    }
  `,
  paletteItem: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: ${token.colorBgContainer};
    cursor: grab;
    user-select: none;
  `,
  canvas: css`
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px;
    min-height: 520px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    background: ${token.colorBgLayout};

    @media (min-width: 1200px) {
      max-height: calc(100vh - 32px);
      overflow: auto;
    }
  `,
  canvasDropHint: css`
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    text-align: center;
    color: ${token.colorTextSecondary};
    background: ${token.colorBgContainer};
  `,
  canvasPreview: css`
    background: ${token.colorBgContainer};
  `,
  block: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
    padding: ${token.paddingSM}px;
    cursor: pointer;
  `,
  blockActive: css`
    border-color: ${token.colorPrimary};
    box-shadow: 0 0 0 1px ${token.colorPrimary};
  `,
  blockRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  heroPreview: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px;
    background: ${token.colorBgContainer};
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  jobListDemo: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginSM}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  jobCardDemo: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: ${token.colorBgContainer};
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  formDropZone: css`
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    color: ${token.colorTextSecondary};
    background: ${token.colorBgContainer};
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  formFieldsPreview: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  formFieldPreview: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  formFieldLabel: css`
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextSecondary};
  `,
  fieldEditor: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  customButton: css`
    border-radius: ${token.borderRadius}px;
    padding: 8px 14px;
    border: none;
    cursor: pointer;
    font-weight: ${token.fontWeightStrong};
  `,
  heroImage: css`
    width: 100%;
    max-height: 180px;
    object-fit: cover;
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid ${token.colorBorderSecondary};
  `,
  helperText: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  actionRow: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  aiChat: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    max-height: 240px;
    overflow: auto;
  `,
  aiBubble: css`
    padding: ${token.paddingXS}px ${token.paddingSM}px;
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorFillTertiary};
  `,
}));
