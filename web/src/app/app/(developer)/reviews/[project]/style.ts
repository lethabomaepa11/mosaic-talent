import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    justify-content: space-between;

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
    }
  `,
  title: css`
    margin: ${token.marginXS}px 0 0 !important;
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
  `,
  reviewCard: css`
    border: 1px solid ${token.colorBorderSecondary};
  `,
  reviewItem: css`
    border: 1px solid ${token.colorBorderSecondary};
    margin-top: ${token.marginSM}px;
  `,
  fullWidth: css`
    width: 100%;
  `,
  mutedText: css`
    color: ${token.colorTextSecondary};
  `,
  questionRow: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
    margin-top: ${token.marginSM}px;
  `,
  questionMeta: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  feedbackGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginSM}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  tipsCard: css`
    margin-top: ${token.marginSM}px;
  `,
}));
