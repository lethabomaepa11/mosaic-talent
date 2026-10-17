"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AutoComplete,
  Avatar,
  Button,
  Dropdown,
  Input,
  MenuProps,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useAppearanceAction,
  useAppearanceState,
} from "@/providers/appearance-provider";
import { useAuthState } from "@/providers/auth-provider";
import { useCompanyProfileState } from "@/providers/company-profile-provider";
import {
  useDeveloperAction,
  useDeveloperState,
  type IDeveloperSearchResult,
} from "@/providers/developer-provider";
import { useProjectState } from "@/providers/project-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { NotificationCenter } from "@/components/notification-center";
import { useStyles } from "./styles";

interface IAppHeaderProps {
  onSearchChange?: (value: string) => void;
  onMenuClick?: () => void;
}

export const AppHeader = ({ onSearchChange, onMenuClick }: IAppHeaderProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [developerResults, setDeveloperResults] = useState<
    IDeveloperSearchResult[]
  >([]);
  const [isDeveloperSearchPending, setIsDeveloperSearchPending] =
    useState(false);

  const { styles } = useStyles();
  const { mode } = useAppearanceState();
  const { toggleMode } = useAppearanceAction();
  const { user } = useAuthState();
  const { tenancyName } = useTenantResolutionState();
  const { currentUser, profile } = useDeveloperState();
  const { profile: companyProfile } = useCompanyProfileState();
  const { searchPublicDevelopers } = useDeveloperAction();
  const { myProjects, openProjects } = useProjectState();
  const router = useRouter();
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
    if (selectedName) return selectedName;
    if (selectedUserName) return selectedUserName;
    if (!user?.userId) return "User";
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    if (!debouncedSearchValue.trim()) {
      return;
    }

    let isActive = true;
    const pendingTimer = setTimeout(() => {
      if (isActive) {
        setIsDeveloperSearchPending(true);
      }
    }, 0);

    void searchPublicDevelopers(debouncedSearchValue)
      .then((results) => {
        if (isActive) {
          setDeveloperResults(results);
        }
      })
      .catch(() => {
        if (isActive) {
          setDeveloperResults([]);
        }
      })
      .finally(() => {
        clearTimeout(pendingTimer);
        if (isActive) {
          setIsDeveloperSearchPending(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [debouncedSearchValue, searchPublicDevelopers]);

  const normalizedSearch = searchValue.trim().toLowerCase();

  const combinedProjects = useMemo(() => {
    const map = new Map<string, (typeof myProjects)[number]>();
    myProjects.forEach((project) => map.set(project.id, project));
    openProjects.forEach((project) => map.set(project.id, project));
    return Array.from(map.values());
  }, [myProjects, openProjects]);

  const projectMatches = useMemo(() => {
    if (!normalizedSearch) {
      return [];
    }
    return combinedProjects
      .filter((project) => {
        const title = project.title.toLowerCase();
        const description = project.description.toLowerCase();
        return (
          title.includes(normalizedSearch) ||
          description.includes(normalizedSearch)
        );
      })
      .slice(0, 6);
  }, [combinedProjects, normalizedSearch]);

  const hasAnyResults =
    developerResults.length > 0 ||
    projectMatches.length > 0;

  const autocompleteOptions = useMemo(() => {
    const groups = [];

    if (developerResults.length > 0) {
      groups.push({
        label: "Developers",
        options: developerResults.map((result) => ({
          value: `developer:${result.userName}`,
          label: (
            <Space align="center" className={styles.searchOption}>
              <Avatar size={28} src={result.avatarUrl || undefined}>
                {result.displayName?.slice(0, 2).toUpperCase() ||
                  result.userName.slice(0, 2).toUpperCase()}
              </Avatar>
              <div>
                <Typography.Text strong>
                  {result.displayName || result.userName}
                </Typography.Text>
                <Typography.Text type="secondary">
                  @{result.userName}
                  {result.skillTags.length > 0
                    ? ` · ${result.skillTags.join(", ")}`
                    : ""}
                </Typography.Text>
              </div>
            </Space>
          ),
        })),
      });
    }

    if (projectMatches.length > 0) {
      groups.push({
        label: "Projects",
        options: projectMatches.map((project) => ({
          value: `project:${project.id}`,
          label: (
            <Space align="center" className={styles.searchOption}>
              <div>
                <Typography.Text strong>{project.title}</Typography.Text>
                <div>
                  <Tag color="blue">{project.status}</Tag>
                  <Typography.Text type="secondary">
                    {project.skills.slice(0, 3).join(", ") ||
                      "No skills listed"}
                  </Typography.Text>
                </div>
              </div>
            </Space>
          ),
        })),
      });
    }

    return groups;
  }, [developerResults, projectMatches, styles.searchOption]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange?.(value);
    if (!value.trim()) {
      setDeveloperResults([]);
      setIsDeveloperSearchPending(false);
    }
  };

  const handleSelect = (value: string) => {
    if (!value) {
      return;
    }

    const [type, id] = value.split(":", 2);
    if (!id) {
      return;
    }

    if (type === "developer") {
      router.push(`/developers/${encodeURIComponent(id)}`);
    } else if (type === "project") {
      router.push(`/app/projects/${id}`);
    }

    setSearchValue("");
  };

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
        <AutoComplete
          allowClear
          value={searchValue}
          options={autocompleteOptions}
          onSelect={handleSelect}
          onSearch={handleSearchChange}
          popupMatchSelectWidth={320}
          notFoundContent={
            normalizedSearch && !isDeveloperSearchPending && !hasAnyResults ? (
              <Space
                direction="vertical"
                align="center"
                style={{ padding: 16 }}
              >
                <Typography.Text type="secondary">
                  No matches found
                </Typography.Text>
              </Space>
            ) : null
          }
        >
          <Input
            prefix={<Search size={16} />}
            placeholder="Search developers and projects..."
            className={styles.searchInput}
            suffix={
              isDeveloperSearchPending ? <Spin size="small" /> : undefined
            }
          />
        </AutoComplete>
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
          aria-label={
            mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          onClick={toggleMode}
        />

        <Dropdown
          trigger={["click"]}
          menu={{ items: menuItems }}
          placement="bottomRight"
          classNames={{ root: styles.dropdown }}
        >
          <Button
            type="text"
            className={styles.avatarButton}
            aria-label="User menu"
          >
            <Avatar
              size={30}
              src={selectedAvatarUrl || undefined}
              className={styles.avatar}
            >
              {initials}
            </Avatar>
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};
