import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    padding: ${token.paddingLG}px 0;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
    overflow: hidden;
  `,
  cardSwipe: css`
    height: 100%;
    padding: ${token.paddingLG}px;
    border: 1px solid color-mix(in srgb, ${token.colorPrimary} 28%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
  `,
  title: css`
    margin: 0 !important;
  `,
  cardTitleRow: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${token.marginSM}px;
  `,
  description: css`
    color: ${token.colorTextSecondary};
    margin: ${token.marginXXS}px 0 0 !important;
  `,
  statusGroup: css`
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: ${token.marginXS}px;
  `,
  problem: css`
    border-left: 3px solid ${token.colorPrimary};
    padding-left: ${token.paddingSM}px;
  `,
  problemLabel: css`
    color: ${token.colorText};
    font-size: ${token.fontSizeSM}px;
  `,
  repoLink: css`
    display: inline-block;
    margin: 0 0 ${token.marginXS}px;
    color: ${token.colorPrimary};
    font-size: ${token.fontSizeSM}px;
    word-break: break-all;
  `,
  repoSafetyRow: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${token.marginXS}px;
    margin: 0 0 ${token.marginSM}px;
  `,
  repoSafetyProgress: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
  `,
  repoSafetyStep: css`
    font-size: ${token.fontSizeSM}px;
  `,
  repoSafetyError: css`
    color: ${token.colorError};
    font-size: ${token.fontSizeSM}px;
  `,
  matchLine: css`
    margin: 0 0 ${token.marginSM}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  matchSkills: css`
    display: inline-flex;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
    margin-left: ${token.marginXXS}px;
  `,
  teamRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    margin-bottom: ${token.marginSM}px;
  `,
  scoreRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 ${token.marginSM}px;
  `,
  memberRow: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
  `,
  avatarStack: css`
    display: flex;
    align-items: center;
  `,
  avatarItem: css`
    margin-left: -8px;

    &:first-child {
      margin-left: 0;
    }
  `,
  footerRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
    margin-top: auto;
  `,
  footerRowCompact: css`
    padding-top: ${token.paddingSM}px;
  `,
  dateText: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
}));
