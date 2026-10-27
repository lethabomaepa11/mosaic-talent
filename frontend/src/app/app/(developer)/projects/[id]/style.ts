import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: grid;
    gap: ${token.marginLG}px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;

    > * {
      min-width: 0;
    }
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
  headerContent: css`
    min-width: 0;
    width: 100%;
  `,
  headerPrimaryActions: css`
    display: flex;
    justify-content: flex-start;
    margin-bottom: ${token.marginSM}px;

    @media (min-width: 992px) {
      justify-content: flex-end;
    }
  `,
  titleRow: css`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
  `,
  projectTitle: css`
    margin: 0 !important;
  `,
  problemStatement: css`
    display: grid;
    gap: ${token.marginXXS}px;
    margin-top: ${token.marginSM}px;
    max-width: 860px;
    border-left: 3px solid ${token.colorPrimary};
    padding-left: ${token.paddingSM}px;
  `,
  problemStatementText: css`
    margin: 0 !important;
    color: ${token.colorTextSecondary};
    overflow-wrap: anywhere;
  `,
  contentGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginMD}px;

    @media (min-width: 1200px) {
      grid-template-columns: 300px minmax(0, 1fr);
    }
  `,
  description: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: ${token.colorFillTertiary};
    overflow-x: auto;
  `,
  markdownBody: css`
    :global(.wmde-markdown) {
      background: transparent;
      color: ${token.colorText};
      font-size: ${token.fontSizeSM}px;
    }

    :global(.wmde-markdown pre) {
      background: ${token.colorBgContainer};
      border-radius: ${token.borderRadiusSM}px;
      padding: ${token.paddingXS}px;
      overflow-x: auto;
    }

    :global(.wmde-markdown code) {
      background: color-mix(in srgb, ${token.colorPrimaryBg} 45%, transparent);
      border-radius: ${token.borderRadiusSM}px;
      padding: 0 ${token.paddingXXS}px;
    }

    :global(.wmde-markdown ul) {
      padding-left: ${token.paddingMD}px;
    }
  `,
  actionRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
    min-width: 0;
  `,
  repoLink: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
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
  skillWrap: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
    margin-top: ${token.marginXS}px;
  `,
  tabContent: css`
    display: grid;
    gap: ${token.marginMD}px;
  `,
  tabs: css`
    min-width: 0;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;

    :global(.ant-tabs-nav) {
      margin-bottom: ${token.marginSM}px;
    }

    :global(.ant-tabs-tab) {
      border-radius: ${token.borderRadiusLG}px;
      transition: all 0.2s ease;
    }

    :global(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab) {
      border-radius: ${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0;
      border-color: ${token.colorBorderSecondary};
      background: ${token.colorBgContainer};
      margin-right: ${token.marginXXS}px;
    }

    :global(.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active) {
      border-color: color-mix(in srgb, ${token.colorPrimary} 38%, ${token.colorBorder});
      background: color-mix(in srgb, ${token.colorPrimaryBg} 55%, ${token.colorBgContainer});
    }

    :global(.ant-tabs-card > .ant-tabs-content-holder) {
      border: none;
    }

    @media (max-width: 767px) {
      :global(.ant-tabs-nav) {
        max-width: 100%;
        width: 100%;
        overflow: hidden;
      }

      :global(.ant-tabs-nav-wrap) {
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
        -webkit-overflow-scrolling: touch;
      }

      :global(.ant-tabs-nav-list) {
        display: flex;
        flex-wrap: nowrap;
        width: max-content;
        min-width: max-content;
      }

      :global(.ant-tabs-tab) {
        flex: 0 0 auto;
        margin: 0 ${token.marginXXS}px 0 0;
        padding: 8px ${token.paddingSM}px;
        border: 1px solid ${token.colorBorderSecondary};
        background: ${token.colorBgContainer};
      }

      :global(.ant-tabs-nav-operations) {
        display: none;
      }

      :global(.ant-tabs-content-holder) {
        min-width: 0;
      }

      :global(.ant-tabs-tab-btn) {
        white-space: nowrap;
        font-size: ${token.fontSizeSM}px;
      }

      :global(.ant-tabs-tab-active) {
        border-color: color-mix(in srgb, ${token.colorPrimary} 50%, ${token.colorBorder});
        background: color-mix(in srgb, ${token.colorPrimaryBg} 65%, ${token.colorBgContainer});
      }
    }
  `,
  tabLabel: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
  `,
  tabIcon: css`
    display: inline-flex;
    align-items: center;
    color: ${token.colorTextSecondary};

    @media (max-width: 767px) {
      color: ${token.colorPrimary};
    }
  `,
  tabLabelFull: css`
    display: inline;

    @media (max-width: 767px) {
      display: none;
    }
  `,
  tabLabelShort: css`
    display: none;

    @media (max-width: 767px) {
      display: inline;
    }
  `,
  splitGrid: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: 1fr;

    @media (min-width: 1080px) {
      grid-template-columns: 320px minmax(0, 1fr);
    }
  `,
  memberItem: css`
    display: flex;
    flex-wrap: wrap;
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
    color: ${token.colorPrimary};
  `,
  memberRoleSelect: css`
    min-width: 110px;
  `,
  membersCard: css`
    height: fit-content;
  `,
  repoSafetyCard: css`
    height: fit-content;
  `,
  openSpots: css`
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    text-align: center;
    color: ${token.colorTextSecondary};
  `,
  invitesSection: css`
    display: grid;
    gap: ${token.marginXS}px;
    padding: ${token.paddingSM}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorFillTertiary};
  `,
  inviteItem: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    padding: ${token.paddingXS}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgContainer};
    flex-wrap: wrap;
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
  repoSafetyList: css`
    margin: 0;
    padding-left: ${token.paddingMD}px;
    color: ${token.colorTextSecondary};
  `,
  repoMeta: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
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
  taskHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
  `,
  teamHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
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
    align-items: start;

    @media (min-width: 900px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `,
  column: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: ${token.colorFillTertiary};
    display: flex;
    flex-direction: column;
    align-self: start;
    align-content: flex-start;
    gap: ${token.marginXS}px;
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
    background: ${token.colorBgContainer};
    padding: ${token.paddingSM}px;
    display: grid;
    gap: ${token.marginXXS}px;
    cursor: grab;
  `,
  taskDragging: css`
    opacity: 0.6;
  `,
  taskTitle: css`
    margin: 0;
    color: ${token.colorText};
    word-break: break-word;
  `,
  taskRow: css`
    display: flex;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    align-items: flex-start;
  `,
  taskDescription: css`
    margin: 0;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  taskAssigneeSelect: css`
    margin-top: ${token.marginXXS}px;
    width: 100%;
    max-width: 240px;
  `,
  emptyColumn: css`
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    text-align: center;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  meetingsList: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  meetingCard: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: ${token.colorFillTertiary};
    display: grid;
    gap: ${token.marginXS}px;
  `,
  meetingHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  meetingMeta: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  reminderRow: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
    align-items: center;
  `,
  modalBody: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  fullWidth: css`
    width: 100%;
  `,
  notFound: css`
    text-align: center;
    padding: ${token.paddingXL}px 0;
  `,
  projectLoading: css`
    width: 100%;
  `,
  projectLoadingCard: css`
    border-radius: ${token.borderRadiusLG}px;
  `,
  addFirstTaskRow: css`
    margin-top: ${token.marginSM}px;
  `,
  joiningModalBody: css`
    display: grid;
    justify-items: center;
    text-align: center;
    gap: ${token.marginSM}px;
    padding: ${token.paddingSM}px 0;
  `,
  joiningTitle: css`
    margin: 0 !important;
  `,
}));
