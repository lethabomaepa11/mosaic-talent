"use client";

import { Avatar, Badge, Button, Dropdown, Input, MenuProps } from "antd";
import { Bell, Search, Settings } from "lucide-react";
import { useStyles } from "./header.styles";

export const CompanyHeader = () => {
  const { styles } = useStyles();

  const menuItems: MenuProps["items"] = [
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
        />

        <Dropdown trigger={["click"]} menu={{ items: menuItems }} placement="bottomRight">
          <Button type="text" className={styles.userButton}>
            <Avatar size={26} className={styles.avatar}>
              HR
            </Avatar>
            HR Manager
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};
