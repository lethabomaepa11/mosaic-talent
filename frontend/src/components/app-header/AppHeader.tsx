"use client";

import { useMemo, useState } from "react";
import { Avatar, Button, Dropdown, Input, MenuProps } from "antd";
import { Menu, Moon, Search, Settings, Sun } from "lucide-react";
import {
  useAppearanceAction,
  useAppearanceState,
} from "@/providers/appearance-provider";
import { useAuthState } from "@/providers/auth-provider";
import { useCompanyProfileState } from "@/providers/company-profile-provider";
import { useDeveloperState } from "@/providers/developer-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { NotificationCenter } from "@/components/notification-center";
import { useStyles } from "./styles";

interface IAppHeaderProps {
  onSearchChange?: (value: string) => void;
  onMenuClick?: () => void;
}

export const AppHeader = ({
  onSearchChange,
  onMenuClick,
}: IAppHeaderProps) => {
  const [searchValue, setSearchValue] = useState("");

  const { styles } = useStyles();
  const { mode } = useAppearanceState();
  const { toggleMode } = useAppearanceAction();
  const { user } = useAuthState();
  const { tenancyName } = useTenantResolutionState();
  const { currentUser, profile } = useDeveloperState();
  const { profile: companyProfile } = useCompanyProfileState();
  const isCompanyTenant = Boolean(tenancyName);

  const selectedName = isCompanyTenant
    ? `${companyProfile?.name ?? ""} ${companyProfile?.surname ?? ""}`.trim()
    : `${currentUser?.name ?? ""} ${currentUser?.surname ?? ""}`.trim();
  const selectedUserName = isCompanyTenant
    ? companyProfile?.userName
    : currentUser?.userName;
  const selectedEmail = isCompanyTenant
    ? companyProfile?.emailAddress
    : currentUser?.emailAddress;
  const selectedAvatarUrl = isCompanyTenant
    ? companyProfile?.avatarUrl
    : profile.avatarUrl;

  const displayName = useMemo(() => {
    if (selectedName) {
      return selectedName;
    }

    if (selectedUserName) {
      return selectedUserName;
    }

    if (!user?.userId) {
      return "User";
    }

    return `User ${user.userId}`;
  }, [selectedName, selectedUserName, user?.userId]);

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

  const menuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "meta",
        label: (
          <div className={styles.userMeta}>
            <p className={styles.userName}>{displayName}</p>
            <p className={styles.userEmail}>
              {selectedEmail || "No email loaded in session"}
            </p>
          </div>
        ),
      },
      {
        type: "divider",
      },
      {
        key: "profile",
        label: "Profile Settings",
      },
      {
        key: "notifications",
        label: "Notifications",
      },
      {
        key: "support",
        label: "Help & Support",
      },
    ],
    [
      displayName,
      selectedEmail,
      styles.userEmail,
      styles.userMeta,
      styles.userName,
    ],
  );

  return (
    <header className={styles.header}>
      <div className={styles.searchWrap}>
        <Input
          allowClear
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
            onSearchChange?.(event.target.value);
          }}
          prefix={<Search size={16} />}
          placeholder="Search projects, reviews, simulations..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        <Button
          type="text"
          shape="circle"
          icon={<Menu size={18} />}
          className={styles.menuButton}
          aria-label="Open navigation menu"
          onClick={onMenuClick}
        />
        <NotificationCenter buttonAriaLabel="Notifications" />

        <Button
          type="text"
          shape="circle"
          icon={mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          className={styles.iconButton}
          aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleMode}
        />

        <Button
          type="text"
          shape="circle"
          icon={<Settings size={18} />}
          className={styles.iconButton}
          aria-label="Settings"
        />

        <Dropdown
          trigger={["click"]}
          menu={{ items: menuItems }}
          placement="bottomRight"
          classNames={{ root: styles.dropdown }}
        >
          <Button type="text" className={styles.avatarButton} aria-label="User menu">
            <Avatar size={30} src={selectedAvatarUrl || undefined} className={styles.avatar}>
              {initials}
            </Avatar>
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};
