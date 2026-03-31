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
    margin: 0 !important;
    color: ${token.colorTextSecondary};
  `,
  loaderWrap: css`
    min-height: 50vh;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  grid: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: 1fr;

    @media (min-width: 1024px) {
      grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
    }
  `,
  form: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
}));

