import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: grid;
    gap: ${token.marginLG}px;
    padding-bottom: ${token.paddingXL}px;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  headerTitle: css`
    margin: 0 !important;
  `,
  headerMeta: css`
    color: ${token.colorTextSecondary};
    margin: 0;
    max-width: 860px;
  `,
  card: css`
    border-radius: ${token.borderRadiusLG}px;
  `,
  aiCard: css`
    border-radius: ${token.borderRadiusLG}px;
    display: grid;
    gap: ${token.marginSM}px;
  `,
  aiTitle: css`
    margin: 0 !important;
  `,
  aiDescription: css`
    margin: 0;
    color: ${token.colorTextSecondary};
    max-width: 860px;
  `,
  formGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  twoCol: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: 1fr;

    @media (min-width: 960px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  actionRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  statusRow: css`
    display: grid;
    gap: ${token.marginXS}px;
  `,
  markdownPreview: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: ${token.colorFillTertiary};
    min-height: 120px;
    white-space: pre-wrap;
    color: ${token.colorTextSecondary};
  `,
  markdownEditor: css`
    :global(.w-md-editor) {
      border-radius: ${token.borderRadiusLG}px;
      overflow: hidden;
      background: ${token.colorBgContainer};
      color: ${token.colorText};
      border: 1px solid ${token.colorBorderSecondary};
    }

    :global(.w-md-editor-text, .w-md-editor-preview) {
      font-size: ${token.fontSizeSM}px;
    }

    :global(.w-md-editor-toolbar) {
      flex-wrap: wrap;
      row-gap: ${token.marginXXS}px;
      background: ${token.colorBgElevated};
      border-bottom: 1px solid ${token.colorBorderSecondary};
    }

    :global(.w-md-editor-text-input) {
      color: ${token.colorText} !important;
      -webkit-text-fill-color: ${token.colorText} !important;
      caret-color: ${token.colorPrimary};
    }

    :global(.w-md-editor-text-input::placeholder) {
      color: ${token.colorTextTertiary} !important;
      -webkit-text-fill-color: ${token.colorTextTertiary} !important;
    }

    :global(.w-md-editor-text-pre > code) {
      color: ${token.colorText} !important;
    }

    :global(.w-md-editor-preview) {
      background: ${token.colorBgContainer};
      color: ${token.colorText};
    }

    :global(.wmde-markdown, .wmde-markdown p, .wmde-markdown li, .wmde-markdown strong) {
      color: ${token.colorText};
    }

    :global(.wmde-markdown code, .wmde-markdown pre) {
      color: ${token.colorText};
      background: ${token.colorFillSecondary};
    }

    :global(.w-md-editor-toolbar) {
      color: ${token.colorText};
    }
  `,
  sectionField: css`
    display: grid;
    gap: ${token.marginXS}px;
  `,
  fullWidth: css`
    width: 100%;
  `,
  footerRow: css`
    display: flex;
    gap: ${token.marginSM}px;
    justify-content: flex-end;
    flex-wrap: wrap;
  `,
  githubStatusLoader: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
    padding: ${token.paddingSM}px;
  `,
}));
