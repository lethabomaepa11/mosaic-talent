import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  section: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
    min-width: 0;
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginMD}px;

    @media (max-width: 600px) {
      align-items: stretch;
      flex-direction: column;
    }
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 0 !important;
    color: ${token.colorTextSecondary};
  `,
  loading: css`
    display: grid;
    place-items: center;
    min-height: 180px;
  `,
  matchGrid: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: ${token.marginMD}px;

    @media (max-width: 991px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  matchCard: css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: ${token.marginSM}px;
    min-width: 0;
    height: 100%;
    padding: ${token.paddingLG}px 0;
    border-block: 1px solid ${token.colorBorderSecondary};
  `,
  cardHeading: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${token.marginXS}px;
    width: 100%;
  `,
  projectTitle: css`
    margin: 0 !important;
    min-width: 0;
    overflow-wrap: anywhere;
  `,
  insight: css`
    min-height: 3em;
    margin: 0 !important;
  `,
  problem: css`
    display: grid;
    gap: ${token.marginXXS}px;
    border-left: 3px solid ${token.colorPrimary};
    padding-left: ${token.paddingSM}px;
  `,
  problemText: css`
    margin: 0 !important;
    color: ${token.colorTextSecondary};
  `,
  tags: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
  `,
  outcomes: css`
    margin: ${token.marginXS}px 0 0;
    padding-left: ${token.paddingLG}px;
    color: ${token.colorTextSecondary};
  `,
  actions: css`
    margin-top: auto;
    width: 100%;
    padding-top: ${token.marginSM}px;

    @media (max-width: 420px) {
      flex-direction: column;
      align-items: stretch;

      > * {
        width: 100%;
      }

      a, button {
        width: 100%;
      }
    }
  `,
}));
