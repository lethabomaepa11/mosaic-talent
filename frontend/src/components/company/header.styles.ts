import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    min-height: 64px;
    padding: ${token.paddingSM}px ${token.paddingMD}px;
    border-bottom: 1px solid ${token.colorBorder};
    background: color-mix(in srgb, ${token.colorBgBase} 65%, transparent);
    backdrop-filter: blur(6px);

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: ${token.marginMD}px;
      padding: 0 ${token.paddingLG}px;
    }
  `,
  searchWrap: css`
    width: 100%;
    max-width: 100%;

    @media (min-width: 768px) {
      max-width: 420px;
    }
  `,
  actions: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
  `,
  menuButton: css`
    color: ${token.colorTextSecondary};

    @media (min-width: 992px) {
      display: none;
    }
  `,
  iconButton: css`
    color: ${token.colorTextSecondary};
  `,
  userButton: css`
    height: 36px;
    padding-inline: ${token.paddingSM}px;
    border: 1px solid color-mix(in srgb, ${token.colorPrimary} 30%, transparent);
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  avatar: css`
    background: ${token.colorPrimary};
    color: ${token.colorBgBase};
    font-weight: ${token.fontWeightStrong};
  `,
  userMeta: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  userName: css`
    margin: 0;
    font-weight: ${token.fontWeightStrong};
    color: ${token.colorText};
  `,
  userEmail: css`
    margin: 0;
    font-size: ${token.fontSizeSM}px;
    color: ${token.colorTextSecondary};
  `,
}));
