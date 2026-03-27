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
      grid-template-columns: minmax(0, 1fr) 180px 220px;
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
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  appRow: css`
    display: flex;
    gap: ${token.marginMD}px;
    align-items: flex-start;
    flex-wrap: wrap;
  `,
  appMain: css`
    flex: 1 1 340px;
    min-width: 0;
  `,
  scorePanel: css`
    min-width: 130px;
    border-left: 1px solid ${token.colorBorderSecondary};
    border-right: 1px solid ${token.colorBorderSecondary};
    padding: 0 ${token.paddingSM}px;
    text-align: center;
  `,
  scoreValueHigh: css`
    font-size: 30px;
    font-weight: ${token.fontWeightStrong};
    color: ${token.colorSuccess};
  `,
  scoreValueMid: css`
    font-size: 30px;
    font-weight: ${token.fontWeightStrong};
    color: ${token.colorWarning};
  `,
  scoreValueLow: css`
    font-size: 30px;
    font-weight: ${token.fontWeightStrong};
    color: ${token.colorTextSecondary};
  `,
  breakdownPanel: css`
    min-width: 220px;
    width: 220px;
  `,
  breakdownRow: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
  `,
  breakdownLabel: css`
    width: 94px;
    color: ${token.colorTextSecondary};
    font-size: 12px;
  `,
  breakdownValue: css`
    width: 30px;
    text-align: right;
    font-size: 12px;
    font-weight: ${token.fontWeightStrong};
  `,
  appMeta: css`
    display: flex;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
    color: ${token.colorTextSecondary};
    font-size: 12px;
    margin-top: ${token.marginXS}px;
  `,
  appSkills: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
    margin-top: ${token.marginSM}px;
    padding-top: ${token.paddingSM}px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  appActions: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
    min-width: 140px;
  `,
  statusNew: css`
    background: rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.35);
    color: #60a5fa;
  `,
  statusReviewing: css`
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.35);
    color: #f59e0b;
  `,
  statusShortlisted: css`
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.35);
    color: #22c55e;
  `,
  statusInterviewing: css`
    background: rgba(168, 85, 247, 0.12);
    border-color: rgba(168, 85, 247, 0.35);
    color: #a855f7;
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
  avatar: css`
    width: 56px;
    height: 56px;
    border-radius: ${token.borderRadiusLG}px;
    background: linear-gradient(160deg, ${token.colorPrimaryBg}, ${token.colorBgContainer});
    color: ${token.colorPrimary};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: ${token.fontWeightStrong};
    font-size: 18px;
    flex-shrink: 0;
  `,
}));
