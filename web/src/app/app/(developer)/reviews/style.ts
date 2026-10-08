import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
  `,
  loaderWrap: css`
    min-height: 40vh;
    display: grid;
    place-items: center;
  `,
  grid: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  projectCard: css`
    border: 1px solid ${token.colorBorderSecondary};
  `,
  projectTitle: css`
    margin: 0 !important;
  `,
  metaRow: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
    margin: ${token.marginSM}px 0;
  `,
  cardSubtitle: css`
    color: ${token.colorTextSecondary};
    min-height: 44px;
  `,
}));
