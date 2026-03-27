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
    margin: 0 !important;
  `,
  subtitle: css`
    margin: ${token.marginXXS}px 0 0;
    color: ${token.colorTextSecondary};
  `,
  headerActions: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  body: css`
    display: grid;
    gap: ${token.marginLG}px;
    grid-template-columns: 1fr;

    @media (min-width: 1024px) {
      grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
    }
  `,
  projectList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  projectCard: css`
    border: 1px solid ${token.colorBorderSecondary};
    transition: all 0.2s ease;
  `,
  selectedProjectCard: css`
    border-color: ${token.colorPrimary} !important;
    background: color-mix(in srgb, ${token.colorPrimary} 8%, ${token.colorBgContainer});
  `,
  reviewBoard: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
    min-width: 0;
  `,
  reviewSection: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  reviewCard: css`
    border: 1px solid ${token.colorBorderSecondary};
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
  mutedText: css`
    color: ${token.colorTextSecondary};
  `,
}));
