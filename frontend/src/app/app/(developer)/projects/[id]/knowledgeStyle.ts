import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  workspace: css`
    display: grid;
    gap: ${token.marginXL}px;
    min-width: 0;
  `,
  section: css`
    display: grid;
    gap: ${token.marginSM}px;
    min-width: 0;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    padding: 0 0 ${token.paddingLG}px;
  `,
  loading: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    padding: ${token.paddingLG}px 0;
  `,
  wikiLayout: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: minmax(0, 1fr);

    @media (min-width: 768px) {
      grid-template-columns: minmax(180px, 0.7fr) minmax(0, 2fr);
    }
  `,
  pageList: css`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: ${token.marginXS}px;
  `,
  pageItem: css`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: ${token.marginXS}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    padding: ${token.paddingXS}px 0;
  `,
  rowActions: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  pageContent: css`
    min-width: 0;
    overflow-wrap: anywhere;
    padding: ${token.paddingSM}px 0;
  `,
  markdown: css`
    overflow-wrap: anywhere;
    background: transparent;

    &.wmde-markdown,
    &.wmde-markdown p,
    &.wmde-markdown li,
    &.wmde-markdown strong {
      color: ${token.colorText};
    }

    &.wmde-markdown pre,
    &.wmde-markdown code {
      background: ${token.colorFillSecondary};
    }
  `,
  editor: css`
    display: grid;
    gap: ${token.marginSM}px;
    max-width: 760px;
  `,
  resourceList: css`
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  `,
  resource: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${token.marginSM}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    padding: ${token.paddingSM}px 0;
    overflow-wrap: anywhere;

    & p {
      margin: ${token.marginXXS}px 0 0;
      color: ${token.colorTextSecondary};
    }
  `,
}));
