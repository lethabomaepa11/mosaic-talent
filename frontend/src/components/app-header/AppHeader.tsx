"use client";

import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Dropdown, Input, MenuProps } from "antd";
import { Bell, Search, Settings } from "lucide-react";
import { useAuthState } from "@/providers/auth-provider";
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

  const fallbackName = useMemo(() => {
    if (!user?.userId) {
      return "User";
    }

    return `User ${user.userId}`;
  }, [user?.userId]);

  const initials = useMemo(
    () =>
      fallbackName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0])
        .join("")
        .toUpperCase(),
    [fallbackName],
  );

  const menuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "meta",
        label: (
          <div className={styles.userMeta}>
            <p className={styles.userName}>{fallbackName}</p>
            <p className={styles.userEmail}>No email loaded in session</p>
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
    [fallbackName, styles.userEmail, styles.userMeta, styles.userName],
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
            <Avatar size={30} className={styles.avatar}>
              {initials}
            </Avatar>
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};
