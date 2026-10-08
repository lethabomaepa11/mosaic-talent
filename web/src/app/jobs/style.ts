import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  pageLoader: css`
    min-height: calc(100vh - 140px);
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  page: css`
    width: min(1100px, 100%);
    margin: 0 auto;
    padding: ${token.paddingLG}px ${token.paddingMD}px ${token.paddingXL}px;
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingLG}px;
    background: ${token.colorBgContainer};
  `,
  logo: css`
    width: 56px;
    height: 56px;
    border-radius: ${token.borderRadiusLG}px;
    object-fit: cover;
    border: 1px solid ${token.colorBorderSecondary};
  `,
  heroCompany: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
  `,
  heroImage: css`
    width: 100%;
    max-height: 240px;
    object-fit: cover;
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid ${token.colorBorderSecondary};
  `,
  title: css`
    margin: 0 !important;
  `,
  subtitle: css`
    margin: 0;
    color: ${token.colorTextSecondary};
  `,
  section: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  sectionTitle: css`
    margin: 0 !important;
  `,
  multilineText: css`
    margin: 0;
    color: ${token.colorTextSecondary};
    white-space: pre-line;
  `,
  list: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginMD}px;

    @media (min-width: 992px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  cardHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
  `,
  jobItem: css`
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px;
    background: ${token.colorBgContainer};
  `,
  meta: css`
    color: ${token.colorTextSecondary};
  `,
  iconText: css`
    display: inline-flex;
    align-items: center;
    gap: ${token.marginXXS}px;
    color: ${token.colorTextSecondary};
  `,
  description: css`
    margin-top: ${token.marginSM}px;
    margin-bottom: 0;
    color: ${token.colorTextSecondary};
  `,
  actions: css`
    margin-top: ${token.marginMD}px;
    display: flex;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
  modalGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${token.marginSM}px;
  `,
  fullSpan: css`
    grid-column: 1 / -1;
  `,
  bannerImage: css`
    width: 100%;
    max-height: 280px;
    object-fit: cover;
    border-radius: ${token.borderRadiusLG}px;
    border: 1px solid ${token.colorBorderSecondary};
  `,
}));
