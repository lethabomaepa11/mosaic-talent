"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Dropdown, Input, MenuProps } from "antd";
import { Bell, Menu, Search, Settings } from "lucide-react";
import { useCompanyProfileState } from "@/providers/company-profile-provider";
import { useStyles } from "./header.styles";

interface ICompanyHeaderProps {
  onMenuClick?: () => void;
}

export const CompanyHeader = ({ onMenuClick }: ICompanyHeaderProps) => {
  const router = useRouter();
  const { styles } = useStyles();
  const { profile } = useCompanyProfileState();

  const displayName = useMemo(() => {
    const fullName = `${profile?.name ?? ""} ${profile?.surname ?? ""}`.trim();
    if (fullName) {
      return fullName;
    }

    if (profile?.userName) {
      return profile.userName;
    }

    return "Employee";
  }, [profile?.name, profile?.surname, profile?.userName]);

  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0])
        .join("")
        .toUpperCase(),
    [displayName],
  );

  const menuItems: MenuProps["items"] = [
    {
      key: "meta",
      label: (
        <div className={styles.userMeta}>
          <p className={styles.userName}>{displayName}</p>
          <p className={styles.userEmail}>
            {profile?.emailAddress || "No email loaded in session"}
          </p>
        </div>
      ),
    },
    { type: "divider" },
    { key: "profile", label: "Profile Settings" },
    { key: "team", label: "Team Members" },
    { key: "billing", label: "Billing" },
    { type: "divider" },
    { key: "logout", label: "Sign Out" },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.searchWrap}>
        <Input
          allowClear
          prefix={<Search size={16} />}
          placeholder="Search candidates, jobs..."
        />
      </div>

      <div className={styles.actions}>
        <Button
          type="text"
          shape="circle"
          icon={<Menu size={18} />}
          className={styles.menuButton}
          aria-label="Open company navigation menu"
          onClick={onMenuClick}
        />
        <Badge dot color="gold">
          <Button
            type="text"
            shape="circle"
            icon={<Bell size={18} />}
            className={styles.iconButton}
            aria-label="Company notifications"
          />
        </Badge>
        <Button
          type="text"
          shape="circle"
          icon={<Settings size={18} />}
          className={styles.iconButton}
          aria-label="Company settings"
          onClick={() => router.push("/app/settings")}
        />

        <Dropdown trigger={["click"]} menu={{ items: menuItems }} placement="bottomRight">
          <Button type="text" className={styles.userButton}>
            <Avatar size={26} src={profile?.avatarUrl || undefined} className={styles.avatar}>
              {initials}
            </Avatar>
            {displayName}
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};
