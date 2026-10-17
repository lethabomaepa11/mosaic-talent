import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  pageTitle: css`
    margin: 0 !important;
  `,
  pageSubtitle: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
  `,
  fullWidth: css`
    width: 100%;
  `,
  noMarginTitle: css`
    margin: 0 !important;
  `,
  mutedText: css`
    color: ${token.colorTextSecondary};
  `,
  detailsGrid: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${token.marginSM}px;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  `,
  fullSpan: css`
    grid-column: 1 / -1;
  `,
  fullControl: css`
    width: 100%;
  `,
  badges: css`
    margin-top: ${token.marginSM}px;
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  tagWrap: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
    margin-bottom: ${token.marginSM}px;
  `,
  tag: css`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding-inline-end: 4px;
  `,
  iconButton: css`
    border: none;
    background: transparent;
    cursor: pointer;
    color: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  `,
  inputRow: css`
    display: grid;
    grid-template-columns: 1fr auto;
    gap: ${token.marginXS}px;
    margin-bottom: ${token.marginSM}px;

    @media (max-width: 575px) {
      grid-template-columns: 1fr;
    }
  `,
  avatarInputRow: css`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: ${token.marginXS}px;

    @media (max-width: 575px) {
      grid-template-columns: 1fr;
    }
  `,
  suggestWrap: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
    margin-bottom: ${token.marginMD}px;
  `,
  suggestionLoading: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    margin-top: -${token.marginSM}px;
  `,
  goalList: css`
    display: grid;
    gap: ${token.marginXS}px;
    margin-bottom: ${token.marginSM}px;
  `,
  goalItem: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${token.marginSM}px;
    padding: ${token.paddingXS}px ${token.paddingSM}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillTertiary};
  `,
  readOnlyRating: css`
    display: grid;
    gap: ${token.marginXXS}px;
    margin-top: ${token.marginXXS}px;
    padding: ${token.paddingSM}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorFillTertiary};
  `,
  scanCard: css`
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid ${token.colorSuccessBorder};
    background: ${token.colorSuccessBg};
    color: ${token.colorSuccessText};
    padding: ${token.paddingSM}px;
  `,
  insights: css`
    margin: ${token.marginXS}px 0 0;
    padding-left: ${token.padding}px;
  `,
  spinIcon: css`
    animation: spin 1s linear infinite;

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `,
  statRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${token.marginXXS}px;
  `,
  learningPathLoading: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
  `,
  marketSignals: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
  `,
  learningPathItem: css`
    display: grid;
    gap: ${token.marginXXS}px;
    padding: ${token.paddingSM}px;
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorFillTertiary};
  `,
  learningPathHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  gamificationHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  badgeGrid: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
  `,
  profileTabs: css`
    margin-bottom: ${token.marginXS}px;
  `,
  profileTabPanel: css`
    display: grid;
    gap: ${token.marginMD}px;
    max-width: 760px;
  `,
  tabSection: css`
    display: grid;
    gap: ${token.marginLG}px;
  `,
  tabHeader: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: ${token.marginMD}px;
    flex-wrap: wrap;
  `,
  tabTitle: css`
    margin: 0 0 ${token.marginXXS}px !important;
  `,
  tabActions: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  tabEmpty: css`
    display: grid;
    place-items: center;
    min-height: 220px;
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  projectGroups: css`
    display: grid;
    gap: ${token.marginLG}px;
  `,
  projectGroup: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  groupTitle: css`
    margin: 0 !important;
  `,
  projectList: css`
    display: grid;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  projectRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${token.marginMD}px;
    padding: ${token.paddingMD}px 0;
    color: inherit;
    border-bottom: 1px solid ${token.colorBorderSecondary};

    &:hover {
      color: ${token.colorPrimary};
    }

    @media (max-width: 575px) {
      align-items: flex-start;
      flex-direction: column;
      gap: ${token.marginXS}px;
    }
  `,
  projectDescription: css`
    display: block;
    margin-top: ${token.marginXXS}px;
  `,
  projectMeta: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
    text-align: right;

    @media (max-width: 575px) {
      justify-content: flex-start;
      text-align: left;
    }
  `,
  learningTab: css`
    display: grid;
    gap: ${token.marginLG}px;
  `,
  learningLayout: css`
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: ${token.marginLG}px;

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  `,
  learningPanel: css`
    display: grid;
    align-content: start;
    gap: ${token.marginSM}px;
    padding: ${token.paddingLG}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
}));
