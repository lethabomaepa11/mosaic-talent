import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
    min-width: 0;
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
  actionRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  emptyCard: css`
    text-align: center;
    padding: ${token.paddingXL}px ${token.paddingLG}px;
  `,
  projectGrid: css`
    display: grid;
    gap: ${token.marginMD}px;
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
  `,
  projectControls: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  filters: css`
    display: grid;
    grid-template-columns: minmax(220px, 2fr) minmax(180px, 1.4fr) minmax(160px, 1fr) minmax(170px, 1fr);
    gap: ${token.marginSM}px;
    min-width: 0;

    > * {
      min-width: 0;
      width: 100%;
    }

    @media (max-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 520px) {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  loading: css`
    display: grid;
    place-items: center;
    min-height: 220px;
  `,
  resultCount: css`
    align-self: flex-end;
  `,
  formGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
  `,
  githubStatusLoader: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    padding: ${token.paddingSM}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
  `,
  githubActionRow: css`
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
    margin-bottom: ${token.marginSM}px;
  `,
  fullWidth: css`
    width: 100%;
  `,
}));
