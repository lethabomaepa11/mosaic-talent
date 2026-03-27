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
    height: calc(100dvh - 8rem);
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    min-height: 0;
    overflow: hidden;

    @media (max-width: 1024px) {
      height: calc(100dvh - 6.5rem);
    }
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
  toggleWrap: css`
    display: inline-flex;
    align-items: center;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: 0 ${token.paddingXS}px;
    min-height: 32px;
  `,
  chatCard: css`
    flex: 1;
    min-height: 0;
    overflow: hidden;

    :global(.ant-card-body) {
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 0;
    }
  `,
  callModeContainer: css`
    padding: ${token.paddingSM}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    background: color-mix(in srgb, ${token.colorBgContainer} 80%, ${token.colorPrimaryBg});
    max-height: 42vh;
    overflow: auto;
  `,
  comparisonPanel: css`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
    margin-bottom: ${token.marginSM}px;
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextSecondary};
  `,
  callGrid: css`
    display: grid;
    gap: ${token.marginXS}px;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    @media (min-width: 768px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (min-width: 1280px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  `,
  participantCard: css`
    border: 1px solid ${token.colorBorderSecondary};
    background: color-mix(in srgb, ${token.colorBgContainer} 84%, transparent);
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    display: grid;
    gap: ${token.marginXXS}px;
    justify-items: center;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  `,
  participantSpeaking: css`
    border-color: color-mix(in srgb, ${token.colorPrimary} 45%, ${token.colorBorderSecondary});
    box-shadow: 0 0 0 2px color-mix(in srgb, ${token.colorPrimary} 20%, transparent);
    transform: translateY(-1px);
  `,
  participantAvatar: css`
    background: color-mix(in srgb, ${token.colorPrimaryBg} 70%, ${token.colorBgContainer});
    color: ${token.colorPrimary};
    font-weight: ${token.fontWeightStrong};
  `,
  avatarVariant0: css`
    background: color-mix(in srgb, #f59e0b 24%, ${token.colorBgContainer});
    color: #f59e0b;
  `,
  avatarVariant1: css`
    background: color-mix(in srgb, #06b6d4 24%, ${token.colorBgContainer});
    color: #06b6d4;
  `,
  avatarVariant2: css`
    background: color-mix(in srgb, #22c55e 24%, ${token.colorBgContainer});
    color: #22c55e;
  `,
  avatarVariant3: css`
    background: color-mix(in srgb, #f97316 24%, ${token.colorBgContainer});
    color: #f97316;
  `,
  avatarVariant4: css`
    background: color-mix(in srgb, #3b82f6 24%, ${token.colorBgContainer});
    color: #3b82f6;
  `,
  avatarVariant5: css`
    background: color-mix(in srgb, #ec4899 24%, ${token.colorBgContainer});
    color: #ec4899;
  `,
  participantRole: css`
    font-size: ${token.fontSizeSM}px;
    text-align: center;
  `,
  speakingTag: css`
    margin-top: ${token.marginXXS}px;
  `,
  mutedTag: css`
    margin-top: ${token.marginXXS}px;
    border-color: ${token.colorBorderSecondary} !important;
    color: ${token.colorTextSecondary} !important;
    background: color-mix(in srgb, ${token.colorFillSecondary} 70%, transparent) !important;
  `,
  messagePane: css`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: ${token.paddingMD}px;
    display: grid;
    gap: ${token.marginSM}px;
  `,
  bubbleRow: css`
    display: flex;
    gap: ${token.marginXS}px;
    align-items: flex-start;
    min-width: 0;
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
    max-width: min(82%, 760px);
    min-width: 0;
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
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
  `,
  bubbleMeta: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    overflow-wrap: anywhere;
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

    @media (max-width: 767px) {
      flex-wrap: wrap;
    }

    :global(.ant-input-affix-wrapper),
    :global(.ant-input) {
      min-width: 0;
      flex: 1 1 240px;
    }
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
