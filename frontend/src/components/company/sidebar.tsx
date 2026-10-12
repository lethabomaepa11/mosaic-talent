"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Briefcase,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "antd";
import { useAuthAction } from "@/providers/auth-provider";
import { useAppearanceState } from "@/providers/appearance-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./sidebar.styles";

interface INavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: INavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/profile", label: "My Profile", icon: User },
  { href: "/app/jobs", label: "Job Postings", icon: Briefcase },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const cx = (...values: Array<string | false | undefined>) =>
  values.filter(Boolean).join(" ");

const isItemActive = (pathname: string, href: string) => {
  if (pathname === href) {
    return true;
  }

  if (href === "/app") {
    return false;
  }

  return pathname.startsWith(href);
};

interface ICompanySidebarProps {
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

export const CompanySidebar = ({ collapsed = false, onCollapseToggle }: ICompanySidebarProps) => {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { logout } = useAuthAction();
  const { mode } = useAppearanceState();
  const { companyLogoUrl, companyName, tenancyName } = useTenantResolutionState();
  const { styles } = useStyles();
  const defaultLogoSrc =
    mode === "light" ? "/text-logo-light.svg" : "/text-logo.svg";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <aside className={cx(styles.sidebar, collapsed && styles.sidebarCollapsed)}>
      <div className={cx(styles.logoRow, collapsed && styles.logoRowCollapsed)}>
        {companyLogoUrl ? (
          <img
            src={companyLogoUrl}
            alt={`${companyName || tenancyName || "Company"} logo`}
            className={cx(styles.companyLogo, collapsed && styles.companyLogoCollapsed)}
          />
        ) : (
          <Image
            src={collapsed ? "/logo.svg" : defaultLogoSrc}
            alt="Mosaic Talent"
            width={144}
            height={28}
            className={cx(styles.logoImage, collapsed && styles.logoImageCollapsed)}
            priority
          />
        )}
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
        {navigation.map((item) => {
          const active = isItemActive(pathname, item.href);

          return (
            <Link key={item.href} href={item.href} data-ai-route={item.href} aria-label={item.label} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined}>
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

      <div className={styles.footer}>
        <Button
          type="text"
          className={cx(styles.footerButton, collapsed && styles.iconButton)}
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
