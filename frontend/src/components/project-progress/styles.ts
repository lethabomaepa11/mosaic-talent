import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  layout: css`display: grid; grid-template-columns: minmax(0, 1fr); gap: ${token.marginLG}px; min-width: 0; @media (min-width: 992px) { grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr); align-items: start; }`,
  form: css`width: 100%;`,
  entries: css`display: grid; gap: ${token.marginMD}px; min-width: 0; > h4 { margin: 0; }`,
  entryTitle: css`display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: ${token.marginXS}px;`,
  review: css`border-top: 1px solid ${token.colorBorderSecondary}; padding-top: ${token.paddingSM}px;`,
  reviewForm: css`display: grid; gap: ${token.marginXS}px; @media (min-width: 768px) { grid-template-columns: minmax(0, 1fr) auto; align-items: start; }`,
}));
