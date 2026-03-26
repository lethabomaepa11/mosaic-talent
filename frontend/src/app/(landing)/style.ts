import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    min-height: 100vh;
    color: ${token.colorText};
    background: ${token.colorBgLayout};

    @media (max-width: 767px) {
      overflow: visible;
    }
  `,
  nav: css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    border-bottom: 1px solid ${token.colorBorder};
    background: color-mix(in srgb, ${token.colorBgLayout} 82%, transparent);
    backdrop-filter: blur(10px);
  `,
  container: css`
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding-left: ${token.padding}px;
    padding-right: ${token.padding}px;

    @media (min-width: 768px) {
      padding-left: ${token.paddingLG}px;
      padding-right: ${token.paddingLG}px;
    }
  `,
  navInner: css`
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.margin}px;

    @media (min-width: 768px) {
      height: 72px;
    }
  `,
  brand: css`
    display: inline-flex;
    align-items: center;
    color: ${token.colorText};
  `,
  brandLogo: css`
    width: auto;
    height: 28px;
    max-width: 100%;
  `,
  navLinks: css`
    display: none;
    gap: ${token.marginLG}px;

    @media (min-width: 768px) {
      display: inline-flex;
      align-items: center;
    }
  `,
  navActions: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginSM}px;
    flex-shrink: 0;

    :global(.ant-btn) {
      height: 34px;
      padding-inline: ${token.paddingSM}px;
      font-size: ${token.fontSizeSM}px;
    }

    @media (min-width: 768px) {
      :global(.ant-btn) {
        height: 40px;
        padding-inline: ${token.padding}px;
        font-size: ${token.fontSize}px;
      }
    }
  `,
  signInButton: css`
    @media (max-width: 520px) {
      display: none;
    }
  `,
  getStartedButton: css`
    white-space: nowrap;
  `,
  hero: css`
    position: relative;
    overflow: hidden;
    padding-top: 116px;
    padding-bottom: 72px;

    @media (min-width: 768px) {
      padding-top: 152px;
      padding-bottom: 96px;
    }

    @media (max-width: 767px) {
      overflow: visible;
    }
  `,
  heroGlowPrimary: css`
    position: absolute;
    top: 0;
    left: 50%;
    width: 760px;
    height: 540px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: color-mix(in srgb, ${token.colorPrimary} 16%, transparent);
    filter: blur(120px);
    pointer-events: none;
  `,
  heroGlowSecondary: css`
    position: absolute;
    top: 140px;
    right: -120px;
    width: 380px;
    height: 380px;
    border-radius: 999px;
    background: color-mix(in srgb, ${token.colorSuccess} 16%, transparent);
    filter: blur(96px);
    pointer-events: none;
  `,
  heroContent: css`
    position: relative;
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
  `,
  heroBadge: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXS}px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, ${token.colorPrimary} 38%, transparent);
    background: color-mix(in srgb, ${token.colorPrimary} 12%, transparent);
    padding: 6px ${token.padding}px;
    margin-bottom: ${token.marginLG}px;
    color: ${token.colorPrimary};
    font-family: var(--font-dm-mono), monospace;
    font-size: ${token.fontSizeSM}px;
  `,
  heroTitle: css`
    margin: 0 0 ${token.marginLG}px;
    font-family: var(--font-syne), ${token.fontFamily};
    font-size: clamp(38px, 8vw, 78px);
    line-height: 1.05;
    letter-spacing: -0.025em;
  `,
  gradientText: css`
    color: transparent;
    background-image: linear-gradient(
      135deg,
      ${token.colorPrimary} 0%,
      color-mix(in srgb, ${token.colorPrimary} 65%, white) 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
  `,
  heroText: css`
    margin: 0 auto ${token.marginXL}px;
    max-width: 820px;
    font-size: ${token.fontSizeLG}px;
    color: ${token.colorTextSecondary};

    @media (min-width: 768px) {
      font-size: ${token.fontSizeHeading4}px;
    }
  `,
  heroActions: css`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: ${token.marginSM}px;
  `,
  buttonIcon: css`
    margin-left: ${token.marginXXS}px;
    vertical-align: middle;
  `,
  heroChecks: css`
    margin-top: ${token.marginXL}px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: ${token.margin}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  checkItem: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
  `,
  stats: css`
    border-top: 1px solid ${token.colorBorder};
    border-bottom: 1px solid ${token.colorBorder};
    background: color-mix(in srgb, ${token.colorFillAlter} 70%, transparent);
    padding: ${token.paddingXL}px 0;
  `,
  statsGrid: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${token.marginLG}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  `,
  statItem: css`
    text-align: center;
  `,
  statValue: css`
    margin: 0;
    color: ${token.colorPrimary};
    font-family: var(--font-syne), ${token.fontFamily};
    font-size: ${token.fontSizeHeading2}px;
    line-height: 1.1;
  `,
  statLabel: css`
    margin-top: ${token.marginXXS}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  section: css`
    padding: 76px 0;

    @media (min-width: 768px) {
      padding: 104px 0;
    }
  `,
  sectionAlt: css`
    padding: 76px 0;
    border-top: 1px solid ${token.colorBorder};
    border-bottom: 1px solid ${token.colorBorder};
    background: color-mix(in srgb, ${token.colorFillAlter} 70%, transparent);

    @media (min-width: 768px) {
      padding: 104px 0;
    }
  `,
  sectionHeader: css`
    max-width: 780px;
    margin: 0 auto ${token.marginXL}px;
    text-align: center;
  `,
  sectionTitle: css`
    margin: 0 0 ${token.marginSM}px;
    font-family: var(--font-syne), ${token.fontFamily};
    font-size: clamp(34px, 5vw, 54px);
    line-height: 1.1;
  `,
  sectionText: css`
    margin: 0;
    font-size: ${token.fontSizeLG}px;
    color: ${token.colorTextSecondary};
  `,
  tabsWrap: css`
    max-width: 460px;
    margin: 0 auto ${token.marginXL}px;
  `,
  cardsGrid: css`
    display: grid;
    gap: ${token.margin}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `,
  featureCard: css`
    position: relative;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG + 4}px;
    background: color-mix(in srgb, ${token.colorFillAlter} 80%, transparent);
    backdrop-filter: blur(8px);
    padding: ${token.paddingXL}px;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 16px;
      right: 16px;
      height: 1px;
      background: linear-gradient(90deg, transparent, ${token.colorPrimary}, transparent);
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 40px color-mix(in srgb, ${token.colorPrimary} 15%, transparent);
    }

    @media (max-width: 767px) {
      overflow: visible;
    }
  `,
  iconBox: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: ${token.borderRadiusLG}px;
    margin-bottom: ${token.margin}px;
    background: color-mix(in srgb, ${token.colorPrimary} 12%, transparent);
    color: ${token.colorPrimary};
  `,
  iconBoxTeal: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: ${token.borderRadiusLG}px;
    margin-bottom: ${token.margin}px;
    background: color-mix(in srgb, ${token.colorSuccess} 12%, transparent);
    color: ${token.colorSuccess};
  `,
  cardTitle: css`
    margin: 0 0 ${token.marginXXS}px;
    font-size: ${token.fontSizeHeading4}px;
    font-family: var(--font-syne), ${token.fontFamily};
  `,
  cardText: css`
    margin: 0;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSize}px;
  `,
  simulatorGrid: css`
    display: grid;
    gap: ${token.marginLG}px;

    @media (min-width: 1024px) {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  `,
  simulatorCard: css`
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG + 4}px;
    background: color-mix(in srgb, ${token.colorFillAlter} 80%, transparent);
    overflow: hidden;
  `,
  simulatorTop: css`
    border-bottom: 1px solid ${token.colorBorder};
    padding: ${token.paddingSM}px ${token.padding}px;
    display: flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    color: ${token.colorTextSecondary};
    font-family: var(--font-dm-mono), monospace;
    font-size: ${token.fontSizeSM}px;
    flex-wrap: wrap;
  `,
  simulatorLabel: css`
    margin-left: ${token.marginSM}px;
  `,
  traffic: css`
    width: 10px;
    height: 10px;
    border-radius: 999px;
  `,
  simulatorBody: css`
    padding: ${token.paddingLG}px;
    display: grid;
    gap: ${token.margin}px;
  `,
  chatRow: css`
    display: flex;
    gap: ${token.marginSM}px;
    align-items: flex-start;
  `,
  chatRowRight: css`
    display: flex;
    justify-content: flex-end;
    gap: ${token.marginSM}px;
    align-items: flex-start;
  `,
  avatar: css`
    width: 32px;
    height: 32px;
    border-radius: 999px;
    flex-shrink: 0;
    background: color-mix(in srgb, ${token.colorText} 18%, transparent);
  `,
  avatarPrimary: css`
    width: 32px;
    height: 32px;
    border-radius: 999px;
    flex-shrink: 0;
    background: color-mix(in srgb, ${token.colorPrimary} 22%, transparent);
  `,
  bubble: css`
    max-width: 90%;
    border-radius: ${token.borderRadiusLG}px;
    border-top-left-radius: ${token.borderRadiusSM}px;
    background: color-mix(in srgb, ${token.colorText} 7%, transparent);
    padding: ${token.paddingSM}px ${token.padding}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSize}px;
    @media (min-width: 768px) {
      max-width: 80%;
    }
  `,
  bubblePrimary: css`
    max-width: 90%;
    border-radius: ${token.borderRadiusLG}px;
    border-top-right-radius: ${token.borderRadiusSM}px;
    background: color-mix(in srgb, ${token.colorPrimary} 14%, transparent);
    padding: ${token.paddingSM}px ${token.padding}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSize}px;
    @media (min-width: 768px) {
      max-width: 80%;
    }
  `,
  simulatorList: css`
    display: grid;
    gap: ${token.margin}px;
  `,
  simulatorCta: css`
    margin-top: ${token.marginLG}px;
  `,
  simulatorItem: css`
    display: flex;
    gap: ${token.marginSM}px;
    align-items: flex-start;
  `,
  simulatorItemIcon: css`
    width: 40px;
    height: 40px;
    border-radius: ${token.borderRadius}px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: color-mix(in srgb, ${token.colorPrimary} 12%, transparent);
    color: ${token.colorPrimary};
  `,
  ctaBox: css`
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG + 8}px;
    padding: clamp(24px, 4vw, 52px);
    text-align: center;
    background: color-mix(in srgb, ${token.colorFillAlter} 84%, transparent);
    position: relative;
    overflow: hidden;
    box-shadow: 0 0 60px color-mix(in srgb, ${token.colorPrimary} 20%, transparent);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 16px;
      right: 16px;
      height: 1px;
      background: linear-gradient(90deg, transparent, ${token.colorPrimary}, transparent);
    }

    @media (max-width: 767px) {
      overflow: visible;
    }
  `,
  footer: css`
    border-top: 1px solid ${token.colorBorder};
    padding: ${token.paddingXL}px 0;
  `,
  footerInner: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${token.margin}px;

    @media (min-width: 768px) {
      flex-direction: row;
      justify-content: space-between;
    }
  `,
  footerLinks: css`
    display: inline-flex;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
    justify-content: center;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  footerBadge: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  muted: css`
    color: ${token.colorTextSecondary};
  `,
  center: css`
    text-align: center;
  `,
}));
