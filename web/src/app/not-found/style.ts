import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${token.paddingXL}px ${token.paddingLG}px;
    background:
      radial-gradient(
        circle at 12% 20%,
        color-mix(in srgb, ${token.colorPrimary} 26%, transparent) 0%,
        transparent 46%
      ),
      radial-gradient(
        circle at 86% 78%,
        color-mix(in srgb, ${token.colorInfo} 22%, transparent) 0%,
        transparent 45%
      ),
      linear-gradient(
        130deg,
        color-mix(in srgb, ${token.colorBgLayout} 88%, ${token.colorPrimaryBg}) 0%,
        ${token.colorBgLayout} 54%,
        color-mix(in srgb, ${token.colorInfoBg} 65%, ${token.colorBgLayout}) 100%
      );

    @media (max-width: 767px) {
      padding: ${token.paddingLG}px ${token.padding}px;
      align-items: flex-start;
      padding-top: ${token.paddingXL * 1.5}px;
    }
  `,
  gridOverlay: css`
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(
        color-mix(in srgb, ${token.colorBorderSecondary} 38%, transparent) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        color-mix(in srgb, ${token.colorBorderSecondary} 38%, transparent) 1px,
        transparent 1px
      );
    background-size: 36px 36px;
    mask-image: radial-gradient(circle at center, black 40%, transparent 86%);
    pointer-events: none;
    opacity: 0.7;
  `,
  content: css`
    position: relative;
    width: min(1100px, 100%);
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: ${token.marginXL}px;
    align-items: center;
    z-index: 1;

    @media (max-width: 980px) {
      grid-template-columns: 1fr;
      gap: ${token.marginXL}px;
    }
  `,
  copyCard: css`
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid color-mix(in srgb, ${token.colorBorderSecondary} 70%, transparent);
    background: color-mix(in srgb, ${token.colorBgContainer} 84%, transparent);
    box-shadow: ${token.boxShadowSecondary};
    backdrop-filter: blur(8px);
    padding: ${token.paddingXL}px;

    @media (max-width: 767px) {
      padding: ${token.paddingLG}px;
    }
  `,
  label: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXS}px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, ${token.colorPrimary} 40%, transparent);
    background: color-mix(in srgb, ${token.colorPrimaryBg} 72%, transparent);
    color: ${token.colorPrimary};
    padding: 4px ${token.paddingSM}px;
    margin-bottom: ${token.marginLG}px;
    font-family: var(--font-dm-mono), monospace;
    font-size: ${token.fontSizeSM}px;
  `,
  title: css`
    margin: 0 0 ${token.margin}px;
    font-family: var(--font-syne), ${token.fontFamily};
    font-size: clamp(32px, 5vw, 60px);
    line-height: 1.06;
    letter-spacing: -0.02em;
    color: ${token.colorText};
  `,
  gradientWord: css`
    color: transparent;
    background-image: linear-gradient(
      135deg,
      ${token.colorPrimary} 0%,
      color-mix(in srgb, ${token.colorInfo} 62%, ${token.colorPrimary}) 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
  `,
  subtitle: css`
    margin: 0 0 ${token.marginXL}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeLG}px;
    max-width: 56ch;

    @media (max-width: 767px) {
      font-size: ${token.fontSize}px;
      margin-bottom: ${token.marginLG}px;
    }
  `,
  actions: css`
    display: flex;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;

    :global(.ant-btn) {
      min-width: 136px;
    }

    @media (max-width: 767px) {
      :global(.ant-btn) {
        flex: 1 1 100%;
      }
    }
  `,
  visualWrap: css`
    display: flex;
    justify-content: center;
    align-items: center;
    perspective: 1200px;
    min-height: 320px;
  `,
  cubeFrame: css`
    position: relative;
    width: 210px;
    height: 210px;
    transform-style: preserve-3d;

    @media (max-width: 767px) {
      width: 170px;
      height: 170px;
    }
  `,
  cube: css`
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    animation: cubeSpin 13s linear infinite;

    @keyframes cubeSpin {
      0% {
        transform: rotateX(-24deg) rotateY(0deg);
      }
      100% {
        transform: rotateX(-24deg) rotateY(360deg);
      }
    }
  `,
  face: css`
    position: absolute;
    inset: 0;
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid color-mix(in srgb, ${token.colorPrimary} 58%, transparent);
    background: color-mix(in srgb, ${token.colorPrimaryBg} 74%, transparent);
    box-shadow: ${token.boxShadowSecondary};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${token.colorPrimary};
    font-family: var(--font-dm-mono), monospace;
    font-size: clamp(24px, 4.5vw, 34px);
    font-weight: ${token.fontWeightStrong};
  `,
  faceFront: css`
    transform: translateZ(72px);
  `,
  faceBack: css`
    transform: rotateY(180deg) translateZ(72px);
  `,
  faceLeft: css`
    transform: rotateY(-90deg) translateZ(72px);
  `,
  faceRight: css`
    transform: rotateY(90deg) translateZ(72px);
  `,
  faceTop: css`
    transform: rotateX(90deg) translateZ(72px);
  `,
  faceBottom: css`
    transform: rotateX(-90deg) translateZ(72px);
  `,
  ring: css`
    position: absolute;
    inset: -30px;
    border-radius: 999px;
    border: 1px dashed color-mix(in srgb, ${token.colorInfo} 46%, transparent);
    animation: ringPulse 4.6s ease-in-out infinite;

    @keyframes ringPulse {
      0%,
      100% {
        transform: scale(0.94);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.04);
        opacity: 0.95;
      }
    }
  `,
  shard: css`
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: ${token.borderRadiusSM}px;
    border: 1px solid color-mix(in srgb, ${token.colorInfo} 55%, transparent);
    background: color-mix(in srgb, ${token.colorInfoBg} 72%, transparent);
    box-shadow: ${token.boxShadowTertiary};
  `,
  shardOne: css`
    top: 0;
    left: 20px;
  `,
  shardTwo: css`
    top: 26px;
    right: 14px;
  `,
  shardThree: css`
    bottom: 8px;
    left: 0;
  `,
  shardFour: css`
    right: 40px;
    bottom: -6px;
  `,
}));
