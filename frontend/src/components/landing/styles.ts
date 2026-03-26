import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  root: css`
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG + 4}px;
    overflow: hidden;
    background: color-mix(in srgb, ${token.colorFillAlter} 82%, transparent);
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 16px;
      right: 16px;
      height: 1px;
      background: linear-gradient(90deg, transparent, ${token.colorPrimary}, transparent);
      z-index: 1;
    }
  `,
  header: css`
    border-bottom: 1px solid ${token.colorBorder};
    padding: ${token.paddingLG}px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.margin}px;
  `,
  userWrap: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginSM}px;
  `,
  avatar: css`
    width: 56px;
    height: 56px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-dm-mono), monospace;
    font-size: ${token.fontSizeHeading4}px;
    font-weight: ${token.fontWeightStrong};
    background: linear-gradient(
      145deg,
      ${token.colorPrimary},
      color-mix(in srgb, ${token.colorPrimary} 50%, transparent)
    );
    color: ${token.colorBgBase};
  `,
  title: css`
    margin: 0;
    font-family: var(--font-syne), ${token.fontFamily};
    font-size: ${token.fontSizeHeading4}px;
  `,
  subtitle: css`
    margin: 0;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  scoreLabel: css`
    color: ${token.colorTextSecondary};
    font-family: var(--font-dm-mono), monospace;
    font-size: ${token.fontSizeSM}px;
    text-align: right;
  `,
  scoreValue: css`
    margin: 0;
    text-align: right;
    font-family: var(--font-syne), ${token.fontFamily};
    font-size: ${token.fontSizeHeading2}px;
    color: ${token.colorPrimary};
    line-height: 1;
  `,
  grid: css`
    display: grid;
    gap: ${token.marginSM}px;
    padding: ${token.paddingLG}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `,
  scoreCard: css`
    border-radius: ${token.borderRadius}px;
    background: color-mix(in srgb, ${token.colorText} 7%, transparent);
    padding: ${token.paddingSM}px;
  `,
  scoreHead: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${token.marginXXS}px;
  `,
  scoreMeta: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  scoreNumber: css`
    color: ${token.colorText};
    font-family: var(--font-dm-mono), monospace;
    font-weight: ${token.fontWeightStrong};
    font-size: ${token.fontSizeSM}px;
  `,
  section: css`
    border-top: 1px solid ${token.colorBorder};
    padding: ${token.paddingLG}px;
  `,
  sectionTitle: css`
    margin: 0 0 ${token.marginSM}px;
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    font-size: ${token.fontSizeLG}px;
    font-weight: ${token.fontWeightStrong};
  `,
  projection: css`
    display: flex;
    align-items: flex-start;
    gap: ${token.margin}px;
  `,
  projectionMain: css`
    flex: 1;
  `,
  projectionMeta: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: ${token.marginXXS}px;
    color: ${token.colorTextSecondary};
    font-size: 12px;
  `,
  growthBox: css`
    text-align: right;
    flex-shrink: 0;
  `,
  growthValue: css`
    margin: 0;
    color: ${token.colorSuccess};
    font-family: var(--font-dm-mono), monospace;
    font-size: ${token.fontSizeHeading3}px;
    line-height: 1;
  `,
  insightsGrid: css`
    display: grid;
    border-top: 1px solid ${token.colorBorder};

    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
    }
  `,
  insightsCol: css`
    padding: ${token.paddingLG}px;
  `,
  insightsColSplit: css`
    padding: ${token.paddingLG}px;
    border-top: 1px solid ${token.colorBorder};

    @media (min-width: 768px) {
      border-top: 0;
      border-left: 1px solid ${token.colorBorder};
    }
  `,
  list: css`
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: ${token.marginXXS}px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSize}px;
  `,
  listItem: css`
    display: flex;
    align-items: flex-start;
    gap: ${token.marginXXS}px;
  `,
  dot: css`
    width: 6px;
    height: 6px;
    border-radius: 999px;
    margin-top: 8px;
    flex-shrink: 0;
    background: ${token.colorSuccess};
  `,
  dotWarn: css`
    width: 6px;
    height: 6px;
    border-radius: 999px;
    margin-top: 8px;
    flex-shrink: 0;
    background: ${token.colorPrimary};
  `,
  recommendation: css`
    border-top: 1px solid ${token.colorBorder};
    background: color-mix(in srgb, ${token.colorSuccess} 10%, transparent);
    padding: ${token.paddingLG}px;
    display: flex;
    gap: ${token.marginSM}px;
  `,
  recIcon: css`
    width: 32px;
    height: 32px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: color-mix(in srgb, ${token.colorSuccess} 22%, transparent);
    color: ${token.colorSuccess};
  `,
  recTitle: css`
    margin: 0;
    color: ${token.colorSuccess};
    font-size: ${token.fontSizeLG}px;
    font-weight: ${token.fontWeightStrong};
  `,
  recText: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSize}px;
  `,
  titleSuccess: css`
    color: ${token.colorSuccess};
  `,
  titlePrimary: css`
    color: ${token.colorPrimary};
  `,
}));
