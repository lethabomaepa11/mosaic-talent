"use client";
import { useState } from "react";
import { Button, Drawer } from "antd";
import { SupportOptions } from "./SupportOptions";
import { useStyles } from "./styles";

export const SupportLauncher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { styles } = useStyles();
  return <>
    <Button shape="circle" className={styles.trigger} aria-label="Support" title="Support"
      aria-haspopup="dialog" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>?</Button>
    <Drawer title="Support" size={360} open={isOpen} onClose={() => setIsOpen(false)}>
      <SupportOptions onOpened={() => setIsOpen(false)} onNavigate={() => setIsOpen(false)} />
    </Drawer>
  </>;
};
