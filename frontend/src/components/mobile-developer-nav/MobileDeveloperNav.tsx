"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "antd";
import { Compass, Menu, MessageSquare, Settings, User, FolderKanban, CircleHelp } from "lucide-react";
import { useStyles } from "./styles";

const navItems = [
  { href: "/app/projects/open", label: "Discover", icon: Compass },
  { href: "/app/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/app/profile", label: "Profile", icon: User },
];
const moreItems = [
  { href: "/app/projects/my", label: "Projects", icon: FolderKanban },
  { href: "/app/how-to", label: "How to use", icon: CircleHelp },
  { href: "/app/preferences", label: "Settings", icon: Settings },
];
const cx = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(" ");

export const MobileDeveloperNav = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const { styles } = useStyles();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return <div className={styles.wrap}>
    <nav className={styles.nav} aria-label="Developer mobile navigation">
      {navItems.map((item) => <Link key={item.href} href={item.href} className={cx(styles.item, isActive(item.href) && styles.itemActive)}><item.icon size={16}/><span>{item.label}</span></Link>)}
      <button type="button" className={cx(styles.item, isMoreOpen && styles.itemActive)} onClick={() => setIsMoreOpen(true)} aria-label="Open more navigation"><Menu size={18}/><span>More</span></button>
    </nav>
    <Drawer open={isMoreOpen} onClose={() => setIsMoreOpen(false)} placement="bottom" height="auto" title="More" className={styles.moreDrawer}>
      <nav className={styles.moreLinks} aria-label="More developer navigation">
        {moreItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setIsMoreOpen(false)} className={cx(styles.moreLink, isActive(item.href) && styles.itemActive)}><item.icon size={18}/><span>{item.label}</span></Link>)}
      </nav>
    </Drawer>
  </div>;
};
