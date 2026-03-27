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
  loader: css`
    min-height: 70vh;
    display: grid;
    place-items: center;
  `,
  headerCard: css`
    border-radius: ${token.borderRadiusLG}px;
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
  inputCol: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  actions: css`
    display: flex;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
  `,
  testsGrid: css`
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: ${token.marginSM}px;

    @media (min-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
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
