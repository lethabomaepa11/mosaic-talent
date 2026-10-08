"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Avatar, Button, Card, Col, Empty, Row, Space, Spin, Tag, Typography } from "antd";
import {
  IPublicDeveloperProfile,
  useDeveloperAction,
} from "@/providers/developer-provider";
import { useStyles } from "./style";

const statusColor = (status: string) => {
  if (status === "completed") return "green";
  if (status === "in-progress") return "gold";
  if (status === "draft") return "default";
  return "blue";
};

const PublicDeveloperProfilePage = () => {
  const { styles } = useStyles();
  const params = useParams<{ username: string }>();
  const username = useMemo(() => decodeURIComponent(params.username ?? "").trim(), [params.username]);
  const { getPublicProfile } = useDeveloperAction();

  const [profile, setProfile] = useState<IPublicDeveloperProfile>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) {
      setError("Developer username is missing.");
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        const result = await getPublicProfile(username);
        if (!result) {
          setError("Developer profile was not found.");
          setProfile(undefined);
          return;
        }

        setProfile(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load profile.");
        setProfile(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [getPublicProfile, username]);

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <Spin />
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className={styles.loadingWrap}>
        <Space direction="vertical" size="middle" align="center">
          <Typography.Title level={4}>Profile unavailable</Typography.Title>
          <Typography.Text type="secondary">{error || "Profile unavailable."}</Typography.Text>
          <Link href="/">
            <Button type="primary">Back to Home</Button>
          </Link>
        </Space>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <motion.div initial={false} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className={styles.profileHeader}>
            <Avatar src={profile.avatarUrl || undefined} size={88}>
              {profile.displayName?.slice(0, 1).toUpperCase() || "D"}
            </Avatar>
            <div className={styles.profileMeta}>
              <Typography.Title level={2} className={styles.title}>
                {profile.displayName || profile.userName}
              </Typography.Title>
              <Typography.Text type="secondary">@{profile.userName}</Typography.Text>
              {profile.bio ? (
                <Typography.Paragraph className={styles.bio}>
                  {profile.bio}
                </Typography.Paragraph>
              ) : null}
              <div className={styles.metaRow}>
                {profile.location ? <Tag>{profile.location}</Tag> : null}
                {profile.yearsOfExperience !== undefined ? (
                  <Tag color="blue">{profile.yearsOfExperience} years experience</Tag>
                ) : null}
                {profile.githubUsername ? (
                  <a
                    href={`https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.githubLink}
                  >
                    GitHub/{profile.githubUsername}
                  </a>
                ) : null}
              </div>
              {profile.skills.length > 0 ? (
                <div className={styles.skillWrap}>
                  {profile.skills.map((skill) => (
                    <Tag key={skill} color="gold">
                      {skill}
                    </Tag>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      </motion.div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={`Current Projects (${profile.currentProjects.length})`}
            className={styles.fullHeight}
          >
            {profile.currentProjects.length === 0 ? (
              <Empty description="No current projects shared yet." />
            ) : (
              <Space direction="vertical" size="small" className={styles.fullWidth}>
                {profile.currentProjects.map((project) => (
                  <div key={project.id} className={styles.projectItem}>
                    <div className={styles.projectHeader}>
                      <Typography.Text strong>{project.title}</Typography.Text>
                      <Tag color={statusColor(project.status)}>{project.status}</Tag>
                    </div>
                    <Typography.Text type="secondary">{project.description}</Typography.Text>
                    <Typography.Text type="secondary">
                      Started {new Date(project.createdAt).toLocaleDateString()}
                    </Typography.Text>
                    {project.githubRepo ? (
                      <a href={project.githubRepo} target="_blank" rel="noreferrer" className={styles.githubLink}>
                        {project.githubRepo}
                      </a>
                    ) : null}
                    {project.skills.length > 0 ? (
                      <div className={styles.skillWrap}>
                        {project.skills.map((skill) => (
                          <Tag key={`${project.id}-${skill}`}>{skill}</Tag>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={`Completed Projects (${profile.completedProjects.length})`}
            className={styles.fullHeight}
          >
            {profile.completedProjects.length === 0 ? (
              <Empty description="No completed projects shared yet." />
            ) : (
              <Space direction="vertical" size="small" className={styles.fullWidth}>
                {profile.completedProjects.map((project) => (
                  <div key={project.id} className={styles.projectItem}>
                    <div className={styles.projectHeader}>
                      <Typography.Text strong>{project.title}</Typography.Text>
                      <Tag color={statusColor(project.status)}>{project.status}</Tag>
                    </div>
                    <Typography.Text type="secondary">{project.description}</Typography.Text>
                    <Typography.Text type="secondary">
                      Completed project record from {new Date(project.createdAt).toLocaleDateString()}
                    </Typography.Text>
                    {project.githubRepo ? (
                      <a href={project.githubRepo} target="_blank" rel="noreferrer" className={styles.githubLink}>
                        {project.githubRepo}
                      </a>
                    ) : null}
                    {project.skills.length > 0 ? (
                      <div className={styles.skillWrap}>
                        {project.skills.map((skill) => (
                          <Tag key={`${project.id}-${skill}`}>{skill}</Tag>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PublicDeveloperProfilePage;
