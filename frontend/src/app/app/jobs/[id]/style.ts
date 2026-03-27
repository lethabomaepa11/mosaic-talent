import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  pageLoader: css`
    min-height: calc(100vh - 140px);
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: 0;
    color: ${token.colorTextSecondary};
  `,
  filtersRow: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginSM}px;

    @media (min-width: 992px) {
      grid-template-columns: minmax(0, 1fr) 220px;
    }
  `,
  statsGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginSM}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  `,
  cardHeader: css`
    display: flex;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
    align-items: flex-start;
  `,
  score: css`
    font-weight: ${token.fontWeightStrong};
  `,
  meta: css`
    color: ${token.colorTextSecondary};
  `,
  sidePanel: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: 1fr;

    @media (min-width: 992px) {
      grid-template-columns: minmax(0, 1fr) 220px;
    }
  `,
  applicationItem: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: ${token.colorBgContainer};
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  candidateGrid: css`
    margin-top: ${token.marginMD}px;
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginSM}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  candidateCard: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    padding: ${token.paddingSM}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  candidateAvatar: css`
    width: 40px;
    height: 40px;
    border-radius: ${token.borderRadiusSM}px;
    background: ${token.colorPrimaryBg};
    color: ${token.colorPrimary};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: ${token.fontWeightStrong};
    flex-shrink: 0;
  `,
}));
