"use client";

import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Dropdown, Input, MenuProps } from "antd";
import { Bell, Search, Settings } from "lucide-react";
import { useAuthState } from "@/providers/auth-provider";
import { useDeveloperState } from "@/providers/developer-provider";
import { useStyles } from "./styles";

interface IAppHeaderProps {
  onSearchChange?: (value: string) => void;
}

export const AppHeader = ({
  onSearchChange,
}: IAppHeaderProps) => {
  const [searchValue, setSearchValue] = useState("");

  const { styles } = useStyles();
  const { user } = useAuthState();
  const { currentUser, profile } = useDeveloperState();

  const displayName = useMemo(() => {
    const fullName = `${currentUser?.name ?? ""} ${currentUser?.surname ?? ""}`.trim();
    if (fullName) {
      return fullName;
    }

    if (currentUser?.userName) {
      return currentUser.userName;
    }

    if (!user?.userId) {
      return "User";
    }

    return `User ${user.userId}`;
  }, [currentUser?.name, currentUser?.surname, currentUser?.userName, user?.userId]);

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
              {currentUser?.emailAddress || "No email loaded in session"}
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
      currentUser?.emailAddress,
      displayName,
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
        <Badge dot color="gold">
          <Button
            type="text"
            shape="circle"
            icon={<Bell size={18} />}
            className={styles.iconButton}
            aria-label="Notifications"
          />
        </Badge>

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
            <Avatar size={30} src={profile.avatarUrl || undefined} className={styles.avatar}>
              {initials}
            </Avatar>
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};
