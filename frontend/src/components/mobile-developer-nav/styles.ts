import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  wrap: css`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    display: none;
    background: color-mix(in srgb, ${token.colorBgContainer} 94%, ${token.colorBgBase});
    border-top: 1px solid ${token.colorBorderSecondary};
    backdrop-filter: blur(8px);

    @media (max-width: 991px) {
      display: block;
    }
  `,
  nav: css`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: ${token.marginXXS}px;
    padding: ${token.paddingXS}px ${token.paddingSM}px;
  `,
  item: css`
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 2px;
    border-radius: ${token.borderRadiusSM}px;
    color: ${token.colorTextSecondary};
    text-decoration: none;
    font-size: 11px;

    &:hover {
      background: color-mix(in srgb, ${token.colorText} 6%, transparent);
      color: ${token.colorText};
    }
  `,
  itemActive: css`
    color: ${token.colorPrimary};
    background: color-mix(in srgb, ${token.colorPrimary} 12%, transparent);
  `,
}));
