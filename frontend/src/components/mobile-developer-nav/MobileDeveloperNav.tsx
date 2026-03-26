"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, FolderKanban, User, MessageSquare } from "lucide-react";
import { useStyles } from "./styles";

const navItems = [
  { href: "/app/projects/open", label: "Discover", icon: Compass },
  { href: "/app/projects/my", label: "Projects", icon: FolderKanban },
  { href: "/app/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/app/profile", label: "Profile", icon: User },
];

const cx = (...values: Array<string | false | undefined>) =>
  values.filter(Boolean).join(" ");

export const MobileDeveloperNav = () => {
  const pathname = usePathname() ?? "";
  const { styles } = useStyles();

  return (
    <div className={styles.wrap}>
      <nav className={styles.nav} aria-label="Developer mobile navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(styles.item, isActive && styles.itemActive)}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
