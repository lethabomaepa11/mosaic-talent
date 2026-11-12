"use client";
import { SupportOptions } from "@/components/support/SupportOptions";
import { useStyles } from "./style";
const HelpPage = () => {
  const { styles } = useStyles();
  return <div className={styles.page}>
    <h1>Help &amp; support</h1>
    <SupportOptions />
  </div>;
};
export default HelpPage;
