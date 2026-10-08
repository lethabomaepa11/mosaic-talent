import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
    max-width: 1100px;
    margin: 0 auto;
    padding: ${token.paddingLG}px ${token.paddingSM}px;
  `,
  loadingWrap: css`
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${token.paddingLG}px;
  `,
  profileHeader: css`
    display: flex;
    gap: ${token.marginMD}px;
    align-items: flex-start;

    @media (max-width: 767px) {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  `,
  profileMeta: css`
    flex: 1;
    min-width: 0;
    display: grid;
    gap: ${token.marginXS}px;
  `,
  title: css`
    margin: 0 !important;
  `,
  bio: css`
    margin: 0;
    color: ${token.colorTextSecondary};
  `,
  metaRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
    align-items: center;
  `,
  githubLink: css`
    color: ${token.colorPrimary};
    word-break: break-all;
  `,
  skillWrap: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXXS}px;
  `,
  fullWidth: css`
    width: 100%;
  `,
  fullHeight: css`
    height: 100%;
  `,
  projectItem: css`
    display: grid;
    gap: ${token.marginXXS}px;
    padding: ${token.paddingSM}px;
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorFillTertiary};
  `,
  projectHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${token.marginXS}px;
    flex-wrap: wrap;
  `,
}));
