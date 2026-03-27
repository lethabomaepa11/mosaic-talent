import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    justify-content: space-between;

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
    }
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
  `,
  list: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginMD}px;
  `,
  cardHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
  `,
  cardMeta: css`
    color: ${token.colorTextSecondary};
  `,
  cardActions: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  modalGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  fullSpan: css`
    grid-column: 1 / -1;
  `,
  applicationItem: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
  `,
}));
