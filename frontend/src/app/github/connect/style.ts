import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  page: css`
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: ${token.margin}px;
    max-width: 640px;
    margin: auto;
    padding: ${token.paddingLG}px ${token.padding}px;
    @media (min-width: 768px) { padding: ${token.paddingXL}px; }
  `,
}));
