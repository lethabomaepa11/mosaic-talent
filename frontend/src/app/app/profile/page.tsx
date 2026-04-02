"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Code,
  Loader2,
  Plus,
  Save,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import {
  AutoComplete,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
} from "antd";
import { toast } from "@/components/providers";
import {
  useCompanyProfileAction,
  useCompanyProfileState,
} from "@/providers/company-profile-provider";
import {
  useDeveloperAction,
  useDeveloperState,
} from "@/providers/developer-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { uploadFile } from "@/utils/fileUpload";
import { useStyles } from "./style";
import { GithubOutlined } from "@ant-design/icons";
import {
  normalizeSuggestionValues,
  toSuggestionOptions,
} from "./aiSuggestions";

const companyRoleLabel = (role?: number) => {
  if (role === 1) {
    return "Admin";
  }
  if (role === 2) {
    return "HR";
  }
  return "Unknown";
};

const ProfilePage = () => {
  const [draft, setDraft] = useState({
    githubUsername: "",
    avatarUrl: "",
    yearsOfExperience: undefined as number | undefined,
    yearOfStudy: undefined as number | undefined,
    studyLevel: 0,
    bio: "",
    location: "",
    skills: [] as string[],
    goals: [] as string[],
    teamworkRating: 0,
  });
  const [newSkill, setNewSkill] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [goalQuery, setGoalQuery] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [goalSuggestions, setGoalSuggestions] = useState<string[]>([]);
  const [isSkillSuggestionLoading, setIsSkillSuggestionLoading] = useState(false);
  const [isGoalSuggestionLoading, setIsGoalSuggestionLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [companyDraft, setCompanyDraft] = useState({
    name: "",
    surname: "",
    avatarUrl: "",
  });

  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);
  const {
    profile,
    learningPath,
    gamificationSummary,
    currentUser,
    isPending,
    isLearningPathPending,
    isGamificationPending,
    studyLevels,
  } = useDeveloperState();
  const { profile: companyProfile, isPending: isCompanyPending } =
    useCompanyProfileState();
  const {
    fetchCurrentUser,
    fetchMyProfile,
    fetchStudyLevels,
    fetchLearningPathRecommendations,
    fetchMyGamificationSummary,
    getProfileFieldSuggestions,
    upsertMyProfile,
  } = useDeveloperAction();
  const { fetchMyEmployeeProfile, updateMyEmployeeProfile } =
    useCompanyProfileAction();

  useEffect(() => {
    if (isCompanyTenant) {
      fetchMyEmployeeProfile();
      return;
    }

    fetchCurrentUser();
    fetchMyProfile();
    fetchStudyLevels();
    fetchLearningPathRecommendations();
    fetchMyGamificationSummary();
  }, []);

  useEffect(() => {
    setDraft({
      githubUsername: profile.githubUsername ?? "",
      avatarUrl: profile.avatarUrl ?? "",
      yearsOfExperience: profile.yearsOfExperience,
      yearOfStudy: profile.yearOfStudy,
      studyLevel: profile.studyLevel ?? 0,
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      skills: profile.skills ?? [],
      goals: profile.goals ?? [],
      teamworkRating: profile.teamworkRating ?? 0,
    });
  }, [profile]);

  useEffect(() => {
    if (!companyProfile) {
      return;
    }

    setCompanyDraft({
      name: companyProfile.name ?? "",
      surname: companyProfile.surname ?? "",
      avatarUrl: companyProfile.avatarUrl ?? "",
    });
  }, [companyProfile]);

  useEffect(() => {
    if (isCompanyTenant) {
      return;
    }

    let isActive = true;
    const timer = window.setTimeout(() => {
      setIsSkillSuggestionLoading(true);

      getProfileFieldSuggestions({
        field: "skill",
        query: skillQuery,
        existingValues: draft.skills,
        maxResults: 8,
      })
        .then((result) => {
          if (!isActive) {
            return;
          }

          setSkillSuggestions(
            normalizeSuggestionValues(
              result.suggestions,
              draft.skills,
              skillQuery,
              8,
            ),
          );
        })
        .catch(() => {
          if (isActive) {
            setSkillSuggestions([]);
          }
        })
        .finally(() => {
          if (isActive) {
            setIsSkillSuggestionLoading(false);
          }
        });
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [isCompanyTenant, skillQuery, draft.skills]);

  useEffect(() => {
    if (isCompanyTenant) {
      return;
    }

    let isActive = true;
    const timer = window.setTimeout(() => {
      setIsGoalSuggestionLoading(true);

      getProfileFieldSuggestions({
        field: "goal",
        query: goalQuery,
        existingValues: draft.goals,
        maxResults: 6,
      })
        .then((result) => {
          if (!isActive) {
            return;
          }

          setGoalSuggestions(
            normalizeSuggestionValues(result.suggestions, draft.goals, goalQuery, 6),
          );
        })
        .catch(() => {
          if (isActive) {
            setGoalSuggestions([]);
          }
        })
        .finally(() => {
          if (isActive) {
            setIsGoalSuggestionLoading(false);
          }
        });
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [isCompanyTenant, goalQuery, draft.goals]);

  const displayName = useMemo(() => {
    if (isCompanyTenant) {
      const fullName = `${companyDraft.name} ${companyDraft.surname}`.trim();
      return fullName || companyProfile?.userName || "Employee";
    }

    const fullName =
      `${currentUser?.name ?? ""} ${currentUser?.surname ?? ""}`.trim();
    return fullName || currentUser?.userName || "Developer";
  }, [
    companyDraft.name,
    companyDraft.surname,
    companyProfile?.userName,
    currentUser?.name,
    currentUser?.surname,
    currentUser?.userName,
    isCompanyTenant,
  ]);

  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0])
      .join("")
      .toUpperCase();
  }, [displayName]);

  const currentSkills = draft.skills;
  const currentGoals = draft.goals;

  const handleAddSkill = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    if (
      !draft.skills.some(
        (skill) => skill.toLowerCase() === normalized.toLowerCase(),
      )
    ) {
      setDraft((prev) => ({ ...prev, skills: [...prev.skills, normalized] }));
      toast.success("Skill added", `${normalized} added to draft.`);
    }
    setNewSkill("");
    setSkillQuery("");
  };

  const handleAddGoal = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    if (
      !draft.goals.some(
        (goal) => goal.toLowerCase() === normalized.toLowerCase(),
      )
    ) {
      setDraft((prev) => ({ ...prev, goals: [...prev.goals, normalized] }));
      toast.success("Goal added", "Learning goal added to draft.");
    }
    setNewGoal("");
    setGoalQuery("");
  };

  const handleSaveProfile = async () => {
    if (isCompanyTenant) {
      setIsSaving(true);

      try {
        await updateMyEmployeeProfile({
          name: companyDraft.name,
          surname: companyDraft.surname,
          avatarUrl: companyDraft.avatarUrl,
        });
        toast.success(
          "Profile saved",
          "Your company profile has been updated.",
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save profile.";
        toast.error("Save failed", message);
      } finally {
        setIsSaving(false);
      }

      return;
    }

    if (!draft.githubUsername.trim()) {
      toast.error(
        "GitHub connection required",
        "Sign in with GitHub to sync your username before saving.",
      );
      return;
    }
    if (draft.yearOfStudy !== undefined && draft.yearOfStudy >= 10) {
      toast.error(
        "Invalid year of study",
        "Year of study must be less than 10.",
      );
      return;
    }

    setIsSaving(true);

    try {
      await upsertMyProfile({
        ...profile,
        githubUsername: draft.githubUsername,
        avatarUrl: draft.avatarUrl,
        yearsOfExperience: draft.yearsOfExperience,
        yearOfStudy: draft.yearOfStudy,
        studyLevel: draft.studyLevel,
        bio: draft.bio,
        location: draft.location,
        skills: draft.skills,
        goals: draft.goals,
      });
      await fetchMyGamificationSummary();
      toast.success(
        "Profile saved",
        "Your developer profile has been updated.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save profile.";
      toast.error("Save failed", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);

    try {
      const uploaded = await uploadFile(file, "avatars");
      if (isCompanyTenant) {
        const nextDraft = { ...companyDraft, avatarUrl: uploaded.url };
        setCompanyDraft(nextDraft);
        await updateMyEmployeeProfile({
          name: nextDraft.name,
          surname: nextDraft.surname,
          avatarUrl: nextDraft.avatarUrl,
        });
      } else {
        const nextDraft = { ...draft, avatarUrl: uploaded.url };
        setDraft(nextDraft);

        if (nextDraft.githubUsername.trim()) {
          await upsertMyProfile({
            ...profile,
            githubUsername: nextDraft.githubUsername,
            avatarUrl: nextDraft.avatarUrl,
            yearsOfExperience: nextDraft.yearsOfExperience,
            yearOfStudy: nextDraft.yearOfStudy,
            studyLevel: nextDraft.studyLevel,
            bio: nextDraft.bio,
            location: nextDraft.location,
            skills: nextDraft.skills,
            goals: nextDraft.goals,
          });
          await fetchMyGamificationSummary();
        }
      }
      toast.success("Avatar uploaded", "Profile avatar has been updated.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to upload avatar right now.";
      toast.error("Upload failed", message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className={styles.page} data-ai-page="profile">
      <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
        <Typography.Title level={2} className={styles.pageTitle}>
          My Profile
        </Typography.Title>
        <Typography.Paragraph className={styles.pageSubtitle}>
          Manage your skills, learning goals, and GitHub insights.
        </Typography.Paragraph>
      </motion.div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size={16} className={styles.fullWidth}>
            <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <Space size={16} align="start" wrap>
                  <Avatar
                    src={
                      (isCompanyTenant
                        ? companyDraft.avatarUrl
                        : draft.avatarUrl) || undefined
                    }
                    size={72}
                  >
                    {initials}
                  </Avatar>
                  <div>
                    <Typography.Title
                      level={4}
                      className={styles.noMarginTitle}
                    >
                      {displayName}
                    </Typography.Title>
                    <Typography.Text className={styles.mutedText}>
                      {isCompanyTenant
                        ? companyProfile?.emailAddress || "No email loaded"
                        : currentUser?.emailAddress || "No email loaded"}
                    </Typography.Text>
                    <div className={styles.badges}>
                      {isCompanyTenant ? (
                        <Badge count="Company Employee" color="blue" />
                      ) : (
                        <>
                          <Badge count="Developer" color="gold" />
                          <Badge
                            count={`${currentSkills.length} skills`}
                            color="blue"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </Space>
              </Card>
            </motion.div>

            {isCompanyTenant ? (
              <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
                <Card
                  title={
                    <Space>
                      <User size={16} /> Employee Details
                    </Space>
                  }
                >
                  <div className={styles.detailsGrid}>
                    <div className={styles.fullSpan}>
                      <Typography.Text type="secondary">
                        First Name
                      </Typography.Text>
                      <Input
                        value={companyDraft.name}
                        onChange={(event) =>
                          setCompanyDraft((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder="First name"
                        data-ai-field="profile-first-name"
                      />
                    </div>
                    <div className={styles.fullSpan}>
                      <Typography.Text type="secondary">
                        Last Name
                      </Typography.Text>
                      <Input
                        value={companyDraft.surname}
                        onChange={(event) =>
                          setCompanyDraft((prev) => ({
                            ...prev,
                            surname: event.target.value,
                          }))
                        }
                        placeholder="Last name"
                        data-ai-field="profile-last-name"
                      />
                    </div>
                    <div className={styles.fullSpan}>
                      <Typography.Text type="secondary">Role</Typography.Text>
                      <Input
                        value={companyRoleLabel(companyProfile?.role)}
                        disabled
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <>
                <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
                  <Card
                    title={
                      <Space>
                        <User size={16} /> Developer Details
                      </Space>
                    }
                  >
                    <div className={styles.detailsGrid}>
                      <div>
                        <Typography.Text type="secondary">
                          Years of Experience
                        </Typography.Text>
                        <InputNumber
                          min={0}
                          max={80}
                          value={draft.yearsOfExperience}
                          onChange={(value) =>
                            setDraft((prev) => ({
                              ...prev,
                              yearsOfExperience: value ?? undefined,
                            }))
                          }
                          className={styles.fullControl}
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary">
                          Year of Study
                        </Typography.Text>
                        <InputNumber
                          min={0}
                          max={9}
                          value={draft.yearOfStudy}
                          onChange={(value) =>
                            setDraft((prev) => ({
                              ...prev,
                              yearOfStudy: value ?? undefined,
                            }))
                          }
                          className={styles.fullControl}
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary">
                          Study Level
                        </Typography.Text>
                        <Select
                          className={styles.fullControl}
                          value={draft.studyLevel}
                          options={studyLevels.map((item) => ({
                            label: item.label,
                            value: item.value,
                          }))}
                          onChange={(value) =>
                            setDraft((prev) => ({
                              ...prev,
                              studyLevel: value,
                            }))
                          }
                        />
                      </div>
                      <div className={styles.fullSpan}>
                        <Typography.Text type="secondary">
                          Location
                        </Typography.Text>
                        <Input
                          value={draft.location}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              location: event.target.value,
                            }))
                          }
                          placeholder="City, Country"
                          data-ai-field="profile-location"
                        />
                      </div>
                      <div className={styles.fullSpan}>
                        <Typography.Text type="secondary">Bio</Typography.Text>
                        <Input.TextArea
                          rows={4}
                          value={draft.bio}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              bio: event.target.value,
                            }))
                          }
                          placeholder="Tell teams how you work and what you’re focused on."
                          data-ai-field="profile-bio"
                        />
                      </div>
                      <div className={styles.fullSpan}>
                        <Typography.Text type="secondary">
                          Teamwork Rating (System-calculated)
                        </Typography.Text>
                        <div className={styles.readOnlyRating}>
                          <Typography.Text strong>
                            {draft.teamworkRating.toFixed(1)}/10
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            Updated from AI simulation performance and peer reviews.
                          </Typography.Text>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
                <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
                  <Card
                    title={
                      <Space>
                        <Code size={16} /> Skills
                      </Space>
                    }
                  >
                    <div className={styles.tagWrap}>
                      {currentSkills.map((skill) => (
                        <Tag key={skill} color="gold" className={styles.tag}>
                          {skill}
                          <button
                            type="button"
                            className={styles.iconButton}
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                skills: prev.skills.filter(
                                  (item) => item !== skill,
                                ),
                              }))
                            }
                          >
                            <X size={12} />
                          </button>
                        </Tag>
                      ))}
                    </div>

                    <div className={styles.inputRow}>
                      <AutoComplete
                        className={styles.fullControl}
                        value={newSkill}
                        options={toSuggestionOptions(skillSuggestions)}
                        filterOption={false}
                        onSelect={(value) => handleAddSkill(String(value))}
                        onChange={(value) => {
                          setNewSkill(value);
                          setSkillQuery(value);
                        }}
                      >
                        <Input
                          placeholder="Add a skill"
                          onPressEnter={() => handleAddSkill(newSkill)}
                        />
                      </AutoComplete>
                      <Button
                        icon={<Plus size={14} />}
                        onClick={() => handleAddSkill(newSkill)}
                      >
                        Add
                      </Button>
                    </div>

                    <div className={styles.suggestWrap}>
                      {skillSuggestions.map((item) => (
                        <Button
                          key={item}
                          size="small"
                          onClick={() => handleAddSkill(item)}
                        >
                          + {item}
                        </Button>
                      ))}
                    </div>
                    {isSkillSuggestionLoading ? (
                      <div className={styles.suggestionLoading}>
                        <Spin size="small" />
                        <Typography.Text type="secondary">
                          Loading AI skill suggestions...
                        </Typography.Text>
                      </div>
                    ) : null}
                  </Card>
                </motion.div>
                <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
                  <Card
                    title={
                      <Space>
                        <TrendingUp size={16} /> Learning Goals
                      </Space>
                    }
                  >
                    <div className={styles.goalList}>
                      {currentGoals.map((goal) => (
                        <div key={goal} className={styles.goalItem}>
                          <Typography.Text>{goal}</Typography.Text>
                          <button
                            type="button"
                            className={styles.iconButton}
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                goals: prev.goals.filter(
                                  (item) => item !== goal,
                                ),
                              }))
                            }
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className={styles.inputRow}>
                      <AutoComplete
                        className={styles.fullControl}
                        value={newGoal}
                        options={toSuggestionOptions(goalSuggestions)}
                        filterOption={false}
                        onSelect={(value) => handleAddGoal(String(value))}
                        onChange={(value) => {
                          setNewGoal(value);
                          setGoalQuery(value);
                        }}
                      >
                        <Input
                          placeholder="Add a learning goal"
                          onPressEnter={() => handleAddGoal(newGoal)}
                        />
                      </AutoComplete>
                      <Button
                        icon={<Plus size={14} />}
                        onClick={() => handleAddGoal(newGoal)}
                      >
                        Add
                      </Button>
                    </div>

                    <div className={styles.suggestWrap}>
                      {goalSuggestions.map((item) => (
                        <Button
                          key={item}
                          size="small"
                          onClick={() => handleAddGoal(item)}
                        >
                          + {item}
                        </Button>
                      ))}
                    </div>
                    {isGoalSuggestionLoading ? (
                      <div className={styles.suggestionLoading}>
                        <Spin size="small" />
                        <Typography.Text type="secondary">
                          Loading AI goal suggestions...
                        </Typography.Text>
                      </div>
                    ) : null}
                  </Card>
                </motion.div>
              </>
            )}
            <Button
              type="primary"
              onClick={handleSaveProfile}
              loading={isSaving || isPending || isCompanyPending}
              icon={<Save size={14} />}
              block
              data-ai-action="save-profile"
            >
              Save Profile
            </Button>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} className={styles.fullWidth}>
            <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
              <Card
                title={
                  <Space>
                    <GithubOutlined size={16} />{" "}
                    {isCompanyTenant ? "Avatar" : "GitHub Integration"}
                  </Space>
                }
              >
                <Space
                  direction="vertical"
                  size={12}
                  className={styles.fullWidth}
                >
                  <Typography.Text type="secondary">Avatar</Typography.Text>
                  <div className={styles.avatarInputRow}>
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleAvatarUpload(file);
                        return false;
                      }}
                    >
                      <Button
                        loading={isUploadingAvatar}
                        icon={<Plus size={14} />}
                      >
                        Upload Avatar
                      </Button>
                    </Upload>
                  </div>
                  {!isCompanyTenant ? (
                    <Input
                      value={draft.githubUsername}
                      disabled
                      readOnly
                      placeholder="Connected GitHub username"
                      data-ai-field="profile-github-username"
                    />
                  ) : null}
                  {!isCompanyTenant ? (
                    <Typography.Text type="secondary">
                      GitHub username is sourced from your connected GitHub
                      account and cannot be edited manually.
                    </Typography.Text>
                  ) : null}
                </Space>
              </Card>
            </motion.div>

            {!isCompanyTenant ? (
              <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
                <Card
                  title={
                    <Space>
                      <User size={16} /> Your Stats
                    </Space>
                  }
                >
                  <Space
                    direction="vertical"
                    size={12}
                    className={styles.fullWidth}
                  >
                    <div>
                      <div className={styles.statRow}>
                        <Typography.Text type="secondary">
                          Teamwork Rating
                        </Typography.Text>
                        <Typography.Text strong>
                          {draft.teamworkRating.toFixed(1)}/10
                        </Typography.Text>
                      </div>
                      <Progress
                        percent={Math.round(draft.teamworkRating * 10)}
                        showInfo={false}
                      />
                    </div>
                    <div>
                      <div className={styles.statRow}>
                        <Typography.Text type="secondary">
                          Skills
                        </Typography.Text>
                        <Typography.Text strong>
                          {currentSkills.length}
                        </Typography.Text>
                      </div>
                      <Progress percent={Math.min(currentSkills.length * 10, 100)} showInfo={false} />
                    </div>
                  </Space>
                </Card>
              </motion.div>
            ) : null}

            {!isCompanyTenant ? (
              <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
                <Card
                  title={
                    <Space>
                      <Award size={16} /> Progress & Badges
                    </Space>
                  }
                  data-ai-section="gamification"
                >
                  <Space
                    direction="vertical"
                    size={12}
                    className={styles.fullWidth}
                  >
                    {isGamificationPending ? (
                      <div className={styles.learningPathLoading}>
                        <Loader2 size={16} className={styles.spinIcon} />
                        <Typography.Text type="secondary">
                          Updating progression...
                        </Typography.Text>
                      </div>
                    ) : null}

                    <div className={styles.gamificationHeader}>
                      <Typography.Text strong>
                        Level {gamificationSummary?.level ?? 1}
                      </Typography.Text>
                      <Typography.Text>
                        {gamificationSummary?.totalPoints ?? 0} pts
                      </Typography.Text>
                    </div>

                    <Progress
                      percent={Math.round(
                        gamificationSummary?.progressPercent ?? 0,
                      )}
                      showInfo={false}
                    />
                    <Typography.Text type="secondary">
                      Next level at{" "}
                      {gamificationSummary?.nextLevelPoints ?? 100} pts
                    </Typography.Text>

                    {gamificationSummary?.badges?.length ? (
                      <div className={styles.badgeGrid}>
                        {gamificationSummary.badges.slice(0, 6).map((badge) => (
                          <Tag key={badge.code} color="gold">
                            {badge.name}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      <Typography.Text type="secondary">
                        Complete reviews, projects, and simulations to unlock
                        badges.
                      </Typography.Text>
                    )}
                  </Space>
                </Card>
              </motion.div>
            ) : null}

            {!isCompanyTenant ? (
              <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
                <Card
                  title={
                    <Space>
                      <TrendingUp size={16} /> AI Learning Path
                    </Space>
                  }
                  data-ai-section="learning-path"
                >
                  <Space
                    direction="vertical"
                    size={12}
                    className={styles.fullWidth}
                  >
                    {isLearningPathPending ? (
                      <div className={styles.learningPathLoading}>
                        <Loader2 size={16} className={styles.spinIcon} />
                        <Typography.Text type="secondary">
                          Generating recommendations...
                        </Typography.Text>
                      </div>
                    ) : null}

                    {learningPath?.summary ? (
                      <Typography.Text>{learningPath.summary}</Typography.Text>
                    ) : (
                      <Typography.Text type="secondary">
                        Save your profile with skills and goals to unlock
                        recommendations.
                      </Typography.Text>
                    )}

                    {learningPath?.marketSignals?.length ? (
                      <div className={styles.marketSignals}>
                        {learningPath.marketSignals
                          .slice(0, 3)
                          .map((signal) => (
                            <Tag key={signal} color="blue">
                              {signal}
                            </Tag>
                          ))}
                      </div>
                    ) : null}

                    {learningPath?.recommendations
                      ?.slice(0, 3)
                      .map((recommendation) => (
                        <div
                          key={`${recommendation.goal}-${recommendation.priority}`}
                          className={styles.learningPathItem}
                        >
                          <div className={styles.learningPathHeader}>
                            <Typography.Text strong>
                              {recommendation.goal}
                            </Typography.Text>
                            <Tag
                              color={
                                recommendation.priority === "high"
                                  ? "red"
                                  : "gold"
                              }
                            >
                              {recommendation.priority} -{" "}
                              {recommendation.estimatedWeeks}w
                            </Tag>
                          </div>
                          <Typography.Text type="secondary">
                            {recommendation.gapSummary}
                          </Typography.Text>
                          {recommendation.recommendedSkills.length > 0 ? (
                            <div className={styles.marketSignals}>
                              {recommendation.recommendedSkills.map((skill) => (
                                <Tag key={`${recommendation.goal}-${skill}`}>
                                  {skill}
                                </Tag>
                              ))}
                            </div>
                          ) : null}
                          {recommendation.suggestedActions.length > 0 ? (
                            <ul className={styles.insights}>
                              {recommendation.suggestedActions
                                .slice(0, 3)
                                .map((action) => (
                                  <li key={`${recommendation.goal}-${action}`}>
                                    {action}
                                  </li>
                                ))}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                  </Space>
                </Card>
              </motion.div>
            ) : null}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
