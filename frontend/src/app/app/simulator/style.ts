import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: grid;
    gap: ${token.marginLG}px;
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
  `,
  sectionTitle: css`
    margin: 0 0 ${token.marginSM}px !important;
  `,
  scenarioGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1200px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `,
  scenarioCard: css`
    cursor: pointer;
    border: 1px solid ${token.colorBorderSecondary};
    transition: transform 0.2s ease, border-color 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, ${token.colorPrimary} 32%, ${token.colorBorderSecondary});
    }
  `,
  scenarioPrompt: css`
    color: ${token.colorTextSecondary};
    margin: ${token.marginXXS}px 0 ${token.marginSM}px;
  `,
  activeWrap: css`
    height: calc(100vh - 8rem);
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    min-height: 560px;
  `,
  activeHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
  `,
  activeTitle: css`
    margin: 0 !important;
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
  `,
  actionRow: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  chatCard: css`
    flex: 1;
    min-height: 0;

    :global(.ant-card-body) {
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 0;
    }
  `,
  messagePane: css`
    flex: 1;
    overflow: auto;
    padding: ${token.paddingMD}px;
    display: grid;
    gap: ${token.marginSM}px;
  `,
  bubbleRow: css`
    display: flex;
    gap: ${token.marginXS}px;
    align-items: flex-start;
  `,
  bubbleRowUser: css`
    justify-content: flex-end;
  `,
  avatar: css`
    width: 32px;
    height: 32px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: ${token.colorFillSecondary};
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
  `,
  userAvatar: css`
    background: color-mix(in srgb, ${token.colorPrimary} 24%, transparent);
    color: ${token.colorPrimary};
  `,
  bubble: css`
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    max-width: 80%;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
  `,
  userBubble: css`
    border-top-right-radius: ${token.borderRadiusXS}px;
    background: color-mix(in srgb, ${token.colorPrimaryBg} 60%, ${token.colorBgContainer});
    border-color: color-mix(in srgb, ${token.colorPrimary} 20%, ${token.colorBorderSecondary});
  `,
  bubbleText: css`
    margin: 0;
    color: ${token.colorText};
  `,
  bubbleMeta: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  typingRow: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;
  `,
  dot: css`
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: ${token.colorTextTertiary};
    animation: sim-bounce 1s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }
    &:nth-child(3) {
      animation-delay: 0.3s;
    }

    @keyframes sim-bounce {
      0%,
      80%,
      100% {
        transform: translateY(0);
        opacity: 0.5;
      }
      40% {
        transform: translateY(-4px);
        opacity: 1;
      }
    }
  `,
  composer: css`
    border-top: 1px solid ${token.colorBorderSecondary};
    padding: ${token.paddingSM}px;
    display: grid;
    gap: ${token.marginXXS}px;
  `,
  composerRow: css`
    display: flex;
    gap: ${token.marginXS}px;
  `,
  helperText: css`
    margin: 0;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  historyGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  scoreBig: css`
    margin: 0;
    font-size: 1.8rem;
    color: ${token.colorPrimary};
    font-weight: ${token.fontWeightStrong};
  `,
  fullWidth: css`
    width: 100%;
  `,
  modalGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
}));
