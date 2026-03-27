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
    margin: 0 !important;
    color: ${token.colorTextSecondary};
  `,
  cardLink: css`
    display: block;
    text-decoration: none;
  `,
  optionCard: css`
    height: 100%;
    border: 1px solid ${token.colorBorderSecondary};
    transition: border-color 0.2s ease, transform 0.2s ease;

    &:hover {
      border-color: ${token.colorPrimary};
      transform: translateY(-2px);
    }
  `,
  optionHeader: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    margin-bottom: ${token.marginXS}px;
  `,
  optionTitle: css`
    margin: 0 !important;
  `,
  optionDescription: css`
    margin: 0 !important;
    color: ${token.colorTextSecondary};
  `,
}));
