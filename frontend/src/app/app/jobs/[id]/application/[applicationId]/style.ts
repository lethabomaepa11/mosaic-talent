import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  pageLoader: css`
    min-height: calc(100vh - 140px);
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  backLink: css`
    width: fit-content;
  `,
  header: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginMD}px;
    justify-content: space-between;
    align-items: flex-start;
  `,
  candidateBlock: css`
    display: flex;
    gap: ${token.marginMD}px;
    align-items: flex-start;
    min-width: 0;
    flex: 1 1 520px;
  `,
  avatar: css`
    width: 72px;
    height: 72px;
    border-radius: ${token.borderRadiusLG}px;
    background: linear-gradient(160deg, ${token.colorPrimaryBg}, ${token.colorBgContainer});
    color: ${token.colorPrimary};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: ${token.fontWeightStrong};
    font-size: 24px;
    flex-shrink: 0;
  `,
  candidateMeta: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    color: ${token.colorTextSecondary};
    font-size: 13px;
    margin-top: ${token.marginXS}px;
  `,
  linkRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
    margin-top: ${token.marginSM}px;
  `,
  sideActions: css`
    display: flex;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
    align-items: flex-start;
  `,
  matchCard: css`
    min-width: 160px;
  `,
  scoreHigh: css`
    color: ${token.colorSuccess};
    font-size: 36px;
    font-weight: ${token.fontWeightStrong};
    line-height: 1;
  `,
  scoreMid: css`
    color: ${token.colorWarning};
    font-size: 36px;
    font-weight: ${token.fontWeightStrong};
    line-height: 1;
  `,
  scoreLow: css`
    color: ${token.colorTextSecondary};
    font-size: 36px;
    font-weight: ${token.fontWeightStrong};
    line-height: 1;
  `,
  tabs: css`
    .ant-tabs-tab {
      padding-top: ${token.paddingXS}px;
      padding-bottom: ${token.paddingXS}px;
    }
  `,
  twoCol: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginMD}px;

    @media (min-width: 992px) {
      grid-template-columns: 2fr 1fr;
    }
  `,
  summaryGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginMD}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  timelineRow: css`
    display: flex;
    gap: ${token.marginSM}px;
    align-items: flex-start;
  `,
  timelineDotDone: css`
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: rgba(34, 197, 94, 0.16);
    color: #22c55e;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `,
  timelineDotCurrent: css`
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: ${token.colorPrimaryBg};
    color: ${token.colorPrimary};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `,
  timelineDotPending: css`
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: ${token.colorFillSecondary};
    color: ${token.colorTextQuaternary};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `,
  stickyActions: css`
    position: sticky;
    bottom: ${token.marginSM}px;
    z-index: 5;
  `,
  stickyRow: css`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: ${token.marginSM}px;
  `,
  actionGroup: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
}));
