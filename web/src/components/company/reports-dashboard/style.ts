import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: 0 !important;
    color: ${token.colorTextSecondary};
  `,
  headerActions: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  kpiGrid: css`
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: ${token.marginSM}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1280px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  `,
  kpiCard: css`
    border: 1px solid ${token.colorBorderSecondary};
    background: linear-gradient(
      135deg,
      ${token.colorBgContainer} 0%,
      ${token.colorFillTertiary} 100%
    );
  `,
  kpiBody: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${token.marginSM}px;
  `,
  kpiMeta: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    margin-top: ${token.marginXXS}px;
  `,
  badgeUp: css`
    color: ${token.colorSuccess};
    background: ${token.colorSuccessBg};
    border: 1px solid ${token.colorSuccessBorder};
  `,
  badgeDown: css`
    color: ${token.colorError};
    background: ${token.colorErrorBg};
    border: 1px solid ${token.colorErrorBorder};
  `,
  tabs: css`
    :global(.ant-tabs-nav) {
      margin-bottom: ${token.marginSM}px !important;
    }
  `,
  panelGrid: css`
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: ${token.marginSM}px;

    @media (min-width: 1200px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  chartCard: css`
    border: 1px solid ${token.colorBorderSecondary};
  `,
  rows: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  row: css`
    display: grid;
    grid-template-columns: minmax(80px, 120px) minmax(0, 1fr) auto;
    gap: ${token.marginSM}px;
    align-items: center;
  `,
  rowLabel: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  rowValue: css`
    font-weight: ${token.fontWeightStrong};
    font-size: ${token.fontSizeSM}px;
  `,
  progressWrap: css`
    width: 100%;
  `,
  sourceHint: css`
    margin-top: ${token.marginSM}px;
    border: 1px solid ${token.colorPrimaryBorder};
    background: ${token.colorPrimaryBg};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
  `,
  sourceHintTitle: css`
    color: ${token.colorPrimary};
    font-weight: ${token.fontWeightStrong};
  `,
  sourceHintText: css`
    margin: 0;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  emptyWrap: css`
    min-height: 40vh;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  aiTabWrap: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  aiPromptRow: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  aiError: css`
    margin-top: ${token.marginSM}px;
  `,
  aiSummary: css`
    margin: ${token.marginSM}px 0 0 0 !important;
    color: ${token.colorTextSecondary};
  `,
  aiLoadingWrap: css`
    min-height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  aiChartsGrid: css`
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: ${token.marginSM}px;

    @media (min-width: 1200px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  aiChartDescription: css`
    margin: 0 0 ${token.marginSM}px 0 !important;
    color: ${token.colorTextSecondary};
  `,
  aiChartCanvas: css`
    width: 100%;
    min-height: 300px;
    height: 340px;
  `,
}));

