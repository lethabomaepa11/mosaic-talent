import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  root: css`
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    transition: opacity 220ms ease;
    overflow: hidden;
    background:
      radial-gradient(circle at 20% 20%, ${token.colorPrimaryBg} 0%, transparent 45%),
      radial-gradient(circle at 80% 70%, ${token.colorSuccessBg} 0%, transparent 40%),
      linear-gradient(135deg, ${token.colorBgLayout} 0%, ${token.colorBgContainer} 100%);
  `,
  visible: css`
    opacity: 1;
  `,
  opening: css`
    animation: appOpeningSweep 1200ms cubic-bezier(0.2, 0.7, 0, 1) forwards;
  `,
  closing: css`
    animation: appClosingSweep 260ms cubic-bezier(0.2, 0.9, 0.1, 1) forwards;
    opacity: 1;
  `,
  ring: css`
    position: absolute;
    border-radius: 999px;
    border: 2px solid ${token.colorPrimary};
    opacity: 0.35;
    transform: translate(-50%, -50%) scale(0.6);
    left: 50%;
    top: 50%;
    animation: appRingPulse 1200ms ease-out forwards;
  `,
  ringSecondary: css`
    border-color: ${token.colorSuccess};
    animation-delay: 90ms;
  `,
  ringTertiary: css`
    border-color: ${token.colorWarning};
    animation-delay: 170ms;
  `,
  centerLabel: css`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-family: var(--font-syne), sans-serif;
    font-size: clamp(20px, 5vw, 44px);
    font-weight: ${token.fontWeightStrong};
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${token.colorTextBase};
    text-shadow: 0 8px 32px ${token.colorBgMask};
    opacity: 0;
    animation: appLabelReveal 900ms ease forwards;
    animation-delay: 120ms;
  `,
  shard: css`
    position: absolute;
    width: 22vmin;
    height: 4vmin;
    border-radius: ${token.borderRadiusLG}px;
    background: linear-gradient(
      90deg,
      ${token.colorPrimary} 0%,
      ${token.colorPrimaryHover} 100%
    );
    filter: blur(0.2px);
    opacity: 0;
    animation: appShardIn 700ms cubic-bezier(0.18, 0.72, 0.2, 1) forwards;
  `,
  shardA: css`
    left: -8vmin;
    top: 18%;
    transform: rotate(18deg);
  `,
  shardB: css`
    right: -12vmin;
    top: 62%;
    transform: rotate(-15deg);
    animation-delay: 80ms;
  `,
  shardC: css`
    left: 24%;
    bottom: -6vmin;
    transform: rotate(-28deg);
    animation-delay: 150ms;
  `,
  globalAnimations: css`
    @keyframes appOpeningSweep {
      0% {
        clip-path: inset(0 0 0 0 round 0);
        transform: scale(1);
      }
      75% {
        clip-path: inset(0 0 0 0 round 0);
        transform: scale(1);
      }
      100% {
        clip-path: inset(50% 50% 50% 50% round 999px);
        transform: scale(1.02);
      }
    }

    @keyframes appClosingSweep {
      0% {
        clip-path: inset(50% 50% 50% 50% round 999px);
        opacity: 0.15;
      }
      100% {
        clip-path: inset(0 0 0 0 round 0);
        opacity: 1;
      }
    }

    @keyframes appRingPulse {
      0% {
        width: 20px;
        height: 20px;
        opacity: 0.45;
      }
      100% {
        width: 110vmax;
        height: 110vmax;
        opacity: 0;
      }
    }

    @keyframes appLabelReveal {
      0% {
        opacity: 0;
        transform: translate(-50%, -46%) scale(0.9);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    @keyframes appShardIn {
      0% {
        opacity: 0;
        transform: translateX(0) scale(0.7);
      }
      100% {
        opacity: 0.95;
        transform: translateX(24vmin) scale(1);
      }
    }
  `,
}));
