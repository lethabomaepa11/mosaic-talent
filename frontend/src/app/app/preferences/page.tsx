"use client";
import { Segmented, Typography } from "antd";
import { Moon, Sun } from "lucide-react";
import { useAppearanceAction, useAppearanceState } from "@/providers/appearance-provider";
import { useStyles } from "./style";
const SettingsPage = () => { const { styles } = useStyles(); const { mode } = useAppearanceState(); const { setMode } = useAppearanceAction(); return <div className={styles.page}><Typography.Title level={2} className={styles.title}>Settings</Typography.Title><Typography.Paragraph className={styles.subtitle}>Choose how Mosaic Talent looks on this device.</Typography.Paragraph><section className={styles.section}><div><Typography.Title level={4}>Appearance</Typography.Title><Typography.Text type="secondary">Switch between light and dark mode any time.</Typography.Text></div><Segmented value={mode} onChange={(value) => setMode(value as "light" | "dark")} options={[{ value: "light", label: <span className={styles.option}><Sun size={16}/>Light</span> },{ value: "dark", label: <span className={styles.option}><Moon size={16}/>Dark</span> }]} aria-label="Appearance mode" /></section></div>; };
export default SettingsPage;
