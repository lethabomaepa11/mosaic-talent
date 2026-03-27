import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: 0;
    color: ${token.colorTextSecondary};
  `,
  twoCol: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginMD}px;

    @media (min-width: 992px) {
      grid-template-columns: minmax(0, 1fr) 360px;
    }
  `,
  dragList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  dragItem: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingSM}px;
    background: ${token.colorBgContainer};
    cursor: grab;
    user-select: none;
  `,
  actions: css`
    display: flex;
    gap: ${token.marginSM}px;
    flex-wrap: wrap;
  `,
  previewCard: css`
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  previewImage: css`
    width: 100%;
    max-height: 180px;
    object-fit: cover;
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid ${token.colorBorderSecondary};
  `,
}));
