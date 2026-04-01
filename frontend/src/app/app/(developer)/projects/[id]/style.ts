import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
    min-width: 0;
  `,
  backButton: css`
    width: fit-content;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;

    @media (min-width: 992px) {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
    }
  `,
  titleRow: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${token.marginSM}px;
  `,
  description: css`
    margin: ${token.marginXS}px 0 0;
    color: ${token.colorTextSecondary};
    max-width: 760px;
  `,
  repoLink: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    margin-top: ${token.marginXS}px;
    color: ${token.colorPrimary};
    font-size: ${token.fontSizeSM}px;
    word-break: break-all;
  `,
  skillPitch: css`
    margin: ${token.marginSM}px 0 0;
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  skillTitle: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  skillTagWrap: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
  `,
  skillEditRow: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  matchInsightBox: css`
    margin-top: ${token.marginSM}px;
    border: 1px solid color-mix(in srgb, ${token.colorPrimary} 28%, ${token.colorBorder});
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: color-mix(in srgb, ${token.colorPrimaryBg} 45%, ${token.colorBgContainer});
  `,
  matchInsightTitle: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorPrimary};
    font-weight: ${token.fontWeightStrong};
  `,
  matchInsightText: css`
    margin: ${token.marginXS}px 0 ${token.marginSM}px;
    color: ${token.colorText};
  `,
  matchInsightLearn: css`
    display: grid;
    gap: ${token.marginXXS}px;
  `,
  learnList: css`
    margin: 0;
    padding-left: ${token.paddingMD}px;
    color: ${token.colorTextSecondary};
  `,
  actionRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  contentGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginMD}px;

    @media (min-width: 1200px) {
      grid-template-columns: 300px minmax(0, 1fr);
    }
  `,
  membersCard: css`
    height: fit-content;
  `,
  repoSafetyCard: css`
    height: fit-content;
  `,
  repoSafetyBody: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  repoSafetyAlert: css`
    margin-bottom: ${token.marginXS}px;
  `,
  repoSafetyProgress: css`
    display: grid;
    gap: ${token.marginXS}px;
  `,
  repoSafetySummary: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  repoSafetyHeader: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${token.marginXS}px;
  `,
  repoSafetyMeta: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    color: ${token.colorTextSecondary};
  `,
  repoSafetyBadges: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
  `,
  repoSafetyFindings: css`
    display: grid;
    gap: ${token.marginXS}px;
  `,
  repoSafetyList: css`
    margin: 0;
    padding-left: ${token.paddingMD}px;
    color: ${token.colorTextSecondary};
  `,
  memberItem: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    padding: ${token.paddingSM}px;
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorFillTertiary};
  `,
  memberMeta: css`
    min-width: 0;
    flex: 1;
  `,
  memberLink: css`
    display: inline-flex;
    max-width: 100%;
    color: ${token.colorPrimary};
  `,
  openSpots: css`
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    text-align: center;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  taskHeader: css`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    width: 100%;
    flex: 1;
    min-width: 0;
    align-items: center;
  `,
  tasksCard: css`
    :global(.ant-card-head) {
      align-items: stretch;
    }

    :global(.ant-card-head-title) {
      width: 100%;
      flex: 1 1 100%;
      min-width: 0;
    }
  `,
  boardGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginSM}px;

    @media (min-width: 900px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `,
  column: css`
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    min-height: 220px;
    border: 1px solid ${token.colorBorderSecondary};
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  `,
  columnTodo: css`
    background: ${token.colorFillTertiary};
  `,
  columnInProgress: css`
    background: color-mix(in srgb, ${token.colorWarningBg} 72%, ${token.colorBgContainer});
  `,
  columnDone: css`
    background: color-mix(in srgb, ${token.colorSuccessBg} 66%, ${token.colorBgContainer});
  `,
  columnActive: css`
    border-color: ${token.colorPrimary};
    box-shadow: 0 0 0 2px color-mix(in srgb, ${token.colorPrimary} 24%, transparent);
  `,
  columnHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${token.marginSM}px;
  `,
  taskCard: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: ${token.colorBgContainer};
    cursor: grab;

  `,
  taskDragging: css`
    opacity: 0.6;
  `,
  taskRow: css`
    display: flex;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    align-items: flex-start;
  `,
  taskTitle: css`
    margin: 0;
    color: ${token.colorText};
    word-break: break-word;
  `,
  taskDescription: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  emptyColumn: css`
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    text-align: center;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  notFound: css`
    text-align: center;
    padding: ${token.paddingXL}px 0;
  `,
  fullWidth: css`
    width: 100%;
  `,
  addFirstTaskRow: css`
    margin-top: ${token.marginSM}px;
  `,
  modalBody: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  analysisCard: css`
    height: fit-content;
  `,
  analysisSection: css`
    display: grid;
    gap: ${token.marginMD}px;
  `,
  analysisScore: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    margin-bottom: ${token.marginSM}px;
  `,
  analysisCategories: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
    margin-bottom: ${token.marginMD}px;
  `,
  analysisRuleItem: css`
    padding: ${token.paddingXS}px;
    border-radius: ${token.borderRadiusSM}px;
    background: ${token.colorFillTertiary};
    margin-bottom: ${token.marginXS}px;
  `,
  analysisRecItem: css`
    padding: ${token.paddingSM}px;
    border-radius: ${token.borderRadiusSM}px;
    background: color-mix(in srgb, ${token.colorWarningBg} 40%, ${token.colorBgContainer});
    margin-bottom: ${token.marginXS}px;
  `,
}));
