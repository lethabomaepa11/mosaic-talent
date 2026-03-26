"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { Button } from "antd";
import { useAuthAction } from "@/providers/auth-provider";
import { useStyles } from "./sidebar.styles";

interface INavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: INavItem[] = [
  { href: "/company", label: "Dashboard", icon: LayoutDashboard },
  { href: "/company/jobs", label: "Job Postings", icon: Briefcase },
  { href: "/company/candidates", label: "Candidates", icon: Users },
  { href: "/company/reports", label: "Reports", icon: FileText },
  { href: "/company/settings", label: "Settings", icon: Settings },
];

const cx = (...values: Array<string | false | undefined>) =>
  values.filter(Boolean).join(" ");

const isItemActive = (pathname: string, href: string) => {
  if (pathname === href) {
    return true;
  }

  if (href === "/company") {
    return false;
  }

  return pathname.startsWith(href);
};

export const CompanySidebar = () => {
  const pathname = usePathname() ?? "";
  const { logout } = useAuthAction();
  const { styles } = useStyles();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoRow}>
        <strong>mosaic talent</strong>
      </div>

      <div className={styles.body}>
        {navigation.map((item) => {
          const active = isItemActive(pathname, item.href);

          return (
            <Link key={item.href} href={item.href}>
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

      <div className={styles.footer}>
        <Link href="/app">
          <Button type="default" className={styles.footerButton} icon={<ChevronLeft size={16} />}>
            Switch to Developer
          </Button>
        </Link>
        <Button
          type="text"
          className={styles.footerButton}
          icon={<LogOut size={16} />}
          onClick={logout}
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );
};
