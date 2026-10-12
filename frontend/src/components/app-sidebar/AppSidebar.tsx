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
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import { Button, Divider } from "antd";
import { useAuthAction } from "@/providers/auth-provider";
import { useAppearanceState } from "@/providers/appearance-provider";
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

interface IAppSidebarProps {
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

export const AppSidebar = ({ collapsed = false, onCollapseToggle }: IAppSidebarProps) => {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { logout } = useAuthAction();
  const { mode } = useAppearanceState();
  const { styles } = useStyles();
  const navItems = developerNav;
  const logoSrc = mode === "light" ? "/text-logo-light.svg" : "/text-logo.svg";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <aside className={cx(styles.sidebar, collapsed && styles.sidebarCollapsed)}>
      <div className={cx(styles.logoRow, collapsed && styles.logoRowCollapsed)}>
        <Image
          src={collapsed ? "/logo.svg" : logoSrc}
          alt="Mosaic Talent"
          width={144}
          height={28}
          className={cx(styles.logoImage, collapsed && styles.logoImageCollapsed)}
          priority
        />
        {onCollapseToggle ? (
          <Button
            type="text"
            className={styles.collapseButton}
            icon={collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={onCollapseToggle}
          />
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.navGroup}>
          {navItems.map((item) => {
            const active = isItemActive(pathname, item.href);

            return (
            <Link key={item.href} href={item.href} className={styles.navLink} data-ai-route={item.href} aria-label={item.label} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined}>
                <Button
                  type="text"
                  className={cx(styles.navButton, active && styles.navButtonActive, collapsed && styles.iconButton)}
                  icon={<item.icon className="h-4 w-4" />}
                  aria-label={item.label}
                >
                  {collapsed ? null : item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <Divider />

        <div className={styles.navGroup}>
          {collapsed ? null : <p className={styles.sectionTitle}>Quick Actions</p>}
          <Link href="/app/projects/my?create=true" className={styles.navLink} data-ai-route="/app/projects/my?create=true" aria-label="Create Project" title={collapsed ? "Create Project" : undefined}>
            <Button type="text" className={cx(styles.quickButton, collapsed && styles.iconButton)} icon={collapsed ? <Plus size={16} /> : undefined} aria-label="Create Project">
              {collapsed ? null : "+ Create Project"}
            </Button>
          </Link>
          <Link href="/app/simulator" className={styles.navLink} data-ai-route="/app/simulator">
            <Button type="text" className={styles.quickButton}>
              + Start Simulation
            </Button>
          </Link>
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          type="text"
          className={cx(styles.signOut, collapsed && styles.iconButton)}
          icon={<LogOut size={16} />}
          aria-label="Sign Out"
          onClick={handleLogout}
        >
          {collapsed ? null : "Sign Out"}
        </Button>
      </div>
    </aside>
  );
};
