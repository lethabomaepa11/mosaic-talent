import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    border: 1px solid ${token.colorBorderSecondary};
    transition: transform 0.2s ease, border-color 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, ${token.colorPrimary} 40%, ${token.colorBorderSecondary});
    }
  `,
  cardTitleRow: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${token.marginSM}px;
  `,
  description: css`
    color: ${token.colorTextSecondary};
    margin-top: ${token.marginXXS}px;
  `,
  teamRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    margin-bottom: ${token.marginSM}px;
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
  `,
  dateText: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
}));
