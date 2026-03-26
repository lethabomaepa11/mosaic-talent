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
    position: relative;
    width: 100%;
    max-width: 100%;

    @media (min-width: 768px) {
      max-width: 460px;
    }
  `,
  searchInput: css`
    width: 100%;
  `,
  actions: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    flex-wrap: wrap;
    width: 100%;

    @media (min-width: 768px) {
      width: auto;
      flex-wrap: nowrap;
      justify-content: flex-end;
    }
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
  avatarButton: css`
    padding: 0;
    width: 36px;
    min-width: 36px;
    height: 36px;
    border: 1px solid color-mix(in srgb, ${token.colorPrimary} 35%, transparent);
  `,
  avatar: css`
    background: ${token.colorPrimary};
    color: ${token.colorBgBase};
    font-weight: ${token.fontWeightStrong};
  `,
  dropdown: css`
    min-width: 220px;
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
