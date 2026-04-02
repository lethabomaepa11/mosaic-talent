import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  contentGrid: css`
    display: grid;
    gap: ${token.marginMD}px;

    @media (min-width: 992px) {
      grid-template-columns: 320px minmax(0, 1fr);
      align-items: start;
    }
  `,
  typesCard: css`
    height: fit-content;
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: 0 !important;
    color: ${token.colorTextSecondary};
  `,
  fullWidth: css`
    width: 100%;
  `,
  switchRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${token.marginSM}px;
  `,
  typeButton: css`
    text-align: left;
    width: 100%;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    display: grid;
    gap: ${token.marginXXS}px;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;

    &:hover {
      border-color: color-mix(in srgb, ${token.colorPrimary} 35%, ${token.colorBorder});
    }
  `,
  typeButtonActive: css`
    border-color: color-mix(in srgb, ${token.colorPrimary} 55%, ${token.colorBorder});
    background: color-mix(in srgb, ${token.colorPrimaryBg} 45%, ${token.colorBgContainer});
  `,
  tokenWrap: css`
    margin-top: ${token.marginXS}px;
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  token: css`
    background: ${token.colorFillSecondary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusSM}px;
    padding: 4px 8px;
    font-size: 12px;
  `,
  loaderWrap: css`
    min-height: 50vh;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
}));
