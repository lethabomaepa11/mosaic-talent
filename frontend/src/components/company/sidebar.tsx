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

export const CompanySidebar = () => {
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
    <aside className={styles.sidebar}>
      <div className={styles.logoRow}>
        {companyLogoUrl ? (
          <img
            src={companyLogoUrl}
            alt={`${companyName || tenancyName || "Company"} logo`}
            className={styles.companyLogo}
          />
        ) : (
          <Image
            src={defaultLogoSrc}
            alt="Mosaic Talent"
            width={144}
            height={28}
            className={styles.logoImage}
            priority
          />
        )}
      </div>

      <div className={styles.body}>
        {navigation.map((item) => {
          const active = isItemActive(pathname, item.href);

          return (
            <Link key={item.href} href={item.href} data-ai-route={item.href}>
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
        <Button
          type="text"
          className={styles.footerButton}
          icon={<LogOut size={16} />}
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );
};
