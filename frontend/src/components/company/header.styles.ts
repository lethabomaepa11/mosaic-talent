import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
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
    justify-content: space-between;
    gap: ${token.marginXXS}px;
    width: 100%;
    padding-top: ${token.paddingXXS}px;

    @media (min-width: 768px) {
      width: auto;
      justify-content: flex-end;
      padding-top: 0;
      gap: ${token.marginXS}px;
    }
  `,
  menuButton: css`
    color: ${token.colorTextSecondary};
    width: 34px;
    min-width: 34px;
    height: 34px;

    @media (min-width: 992px) {
      display: none;
    }
  `,
  iconButton: css`
    color: ${token.colorTextSecondary};
    width: 34px;
    min-width: 34px;
    height: 34px;
  `,
  userButton: css`
    height: 38px;
    padding-inline: ${token.paddingXS}px;
    border: 1px solid color-mix(in srgb, ${token.colorPrimary} 30%, transparent);
    max-width: 164px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-radius: 999px;
    background: color-mix(in srgb, ${token.colorPrimaryBg} 35%, transparent);
    box-shadow: ${token.boxShadowTertiary};

    @media (max-width: 767px) {
      width: 38px;
      min-width: 38px;
      padding-inline: 0;
      justify-content: center;
    }
  `,
  userButtonLabel: css`
    display: inline-block;
    max-width: 104px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (max-width: 767px) {
      display: none;
    }
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
