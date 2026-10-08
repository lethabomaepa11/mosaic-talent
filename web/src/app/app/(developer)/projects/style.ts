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
  toggleRow: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    margin-top: ${token.marginSM}px;
  `,
  emptyCard: css`
    text-align: center;
    padding: ${token.paddingXL}px ${token.paddingLG}px;
  `,
  projectGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginMD}px;

    @media (min-width: 992px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  swipeBoard: css`
    position: relative;
    min-height: 440px;
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
  matchingOverlay: css`
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, ${token.colorBgBase} 88%, transparent);
    backdrop-filter: blur(2px);
  `,
  matchingContent: css`
    text-align: center;
  `,
  matchingDot: css`
    width: 72px;
    height: 72px;
    margin: 0 auto ${token.marginSM}px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, ${token.colorPrimary} 24%, transparent);
  `,
  formGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  fullWidth: css`
    width: 100%;
  `,
}));
