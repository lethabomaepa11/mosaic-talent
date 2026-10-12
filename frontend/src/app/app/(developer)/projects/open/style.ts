import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
    min-width: 0;
    max-width: 100%;
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
  browseSection: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
    min-width: 0;
    max-width: 100%;
  `,
  filters: css`
    display: grid;
    grid-template-columns: minmax(220px, 2fr) minmax(180px, 1.4fr) minmax(160px, 1fr) minmax(170px, 1fr);
    gap: ${token.marginSM}px;
    min-width: 0;

    > * {
      min-width: 0;
      width: 100%;
    }

    @media (max-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 520px) {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  projectGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: ${token.marginLG}px;

    > * {
      min-width: 0;
    }
  `,
  loading: css`
    display: grid;
    place-items: center;
    min-height: 220px;
  `,
  resultCount: css`
    align-self: flex-end;
  `,
  swipeBoard: css`
    position: relative;
    width: min(100%, 620px);
    margin: 0 auto;
    min-height: clamp(520px, calc(100vh - 220px), 740px);
    border: 1px solid color-mix(in srgb, ${token.colorPrimary} 20%, ${token.colorBorderSecondary});
    border-radius: 30px;
    background:
      radial-gradient(
        circle at 10% 8%,
        color-mix(in srgb, ${token.colorPrimary} 16%, transparent) 0%,
        transparent 42%
      ),
      radial-gradient(
        circle at 85% 90%,
        color-mix(in srgb, ${token.colorInfo} 14%, transparent) 0%,
        transparent 44%
      ),
      color-mix(in srgb, ${token.colorFillTertiary} 62%, ${token.colorBgContainer});
    padding: ${token.paddingSM}px;
    box-shadow: ${token.boxShadowSecondary};

    @media (min-width: 768px) {
      padding: ${token.paddingLG}px;
    }
  `,
  swipeStack: css`
    position: relative;
    min-height: clamp(370px, calc(100vh - 390px), 520px);
  `,
  swipeCard: css`
    position: absolute;
    inset: 0;
    transition: filter 0.2s ease;
  `,
  swipeOverlayWrap: css`
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  `,
  swipeOverlay: css`
    position: absolute;
    top: ${token.marginLG}px;
    padding: 8px ${token.padding}px;
    border: 2px solid;
    border-radius: 10px;
    font-family: var(--font-dm-mono), monospace;
    font-size: ${token.fontSizeLG}px;
    letter-spacing: 0.08em;
    font-weight: ${token.fontWeightStrong};
    opacity: 0;
    transform: scale(0.92);
    transition: opacity 0.16s ease, transform 0.16s ease;

    @media (max-width: 767px) {
      top: ${token.marginSM}px;
      font-size: ${token.fontSize}px;
      padding: 6px ${token.paddingSM}px;
    }
  `,
  swipeOverlayLike: css`
    left: ${token.marginLG}px;
    border-color: ${token.colorSuccess};
    color: ${token.colorSuccess};
    transform: rotate(-14deg) scale(0.92);
  `,
  swipeOverlayNope: css`
    right: ${token.marginLG}px;
    border-color: ${token.colorError};
    color: ${token.colorError};
    transform: rotate(14deg) scale(0.92);
  `,
  swipeOverlayVisible: css`
    opacity: 1;
  `,
  swipeCardTop: css`
    filter: drop-shadow(0 14px 26px rgba(0, 0, 0, 0.18));
  `,
  swipeHint: css`
    margin: ${token.marginMD}px 0 ${token.marginXXS}px;
    text-align: center;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSize}px;
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
