import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    justify-content: space-between;

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
    }
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
  `,
  actionRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  swipeBoard: css`
    position: relative;
    min-height: 460px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: color-mix(in srgb, ${token.colorFillTertiary} 55%, ${token.colorBgContainer});
    padding: ${token.paddingLG}px;
  `,
  swipeStack: css`
    position: relative;
    min-height: 340px;
  `,
  swipeCard: css`
    position: absolute;
    inset: 0;
    transition: filter 0.2s ease;
  `,
  swipeCardTop: css`
    filter: drop-shadow(0 14px 26px rgba(0, 0, 0, 0.18));
  `,
  swipeActions: css`
    margin-top: ${token.marginLG}px;
    display: flex;
    justify-content: center;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
  `,
  swipeHint: css`
    margin: 0;
    text-align: center;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
}));
