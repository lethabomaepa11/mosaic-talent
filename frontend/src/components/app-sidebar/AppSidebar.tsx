"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  User,
  Compass,
  FolderKanban,
  Brain,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { Button, Divider } from "antd";
import { useAuthAction } from "@/providers/auth-provider";
import { useStyles } from "./styles";

interface INavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const developerNav: INavItem[] = [
  { href: "/app/projects/open", label: "Discover", icon: Compass },
  { href: "/app/projects/my", label: "My Projects", icon: FolderKanban },
  { href: "/app/profile", label: "My Profile", icon: User },
  { href: "/app/simulator", label: "AI Simulator", icon: Brain },
  { href: "/app/reviews", label: "Peer Reviews", icon: MessageSquare },
];

const cx = (...values: Array<string | false | undefined>) =>
  values.filter(Boolean).join(" ");

const isItemActive = (pathname: string, href: string) => {
  if (pathname === href) {
    return true;
  }

  return pathname.startsWith(href);
};

export const AppSidebar = () => {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { logout } = useAuthAction();
  const { styles } = useStyles();
  const navItems = developerNav;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoRow}>
        <Image
          src="/text-logo.svg"
          alt="Mosaic Talent"
          width={144}
          height={28}
          className={styles.logoImage}
          priority
        />
      </div>

      <div className={styles.body}>
        <div className={styles.navGroup}>
          {navItems.map((item) => {
            const active = isItemActive(pathname, item.href);

            return (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                <Button
                  type="text"
                  className={cx(styles.navButton, active && styles.navButtonActive)}
                  icon={<item.icon className="h-4 w-4" />}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <Divider />

        <div className={styles.navGroup}>
          <p className={styles.sectionTitle}>Quick Actions</p>
          <Link href="/app/projects/my?create=true" className={styles.navLink}>
            <Button type="text" className={styles.quickButton}>
              + Create Project
            </Button>
          </Link>
          <Link href="/app/simulator" className={styles.navLink}>
            <Button type="text" className={styles.quickButton}>
              + Start Simulation
            </Button>
          </Link>
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          type="text"
          className={styles.signOut}
          icon={<LogOut size={16} />}
          onClick={handleLogout}
        >
          Sign Out
        </Button>
        <p className={styles.footerMeta}>Session secured via cookies</p>
      </div>
    </aside>
  );
};
