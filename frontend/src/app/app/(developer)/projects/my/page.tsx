"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Card, Empty, Input, Segmented, Select, Spin, Typography } from "antd";
import { FolderKanban, Plus, Sparkles } from "lucide-react";
import { toast } from "@/components/providers";
import { ProjectCard } from "@/components/project-card/ProjectCard";
import { useDeveloperAction } from "@/providers/developer-provider";
import { useProjectAction, useProjectState } from "@/providers/project-provider";
import { useStyles } from "./style";

const MyProjectsPage = () => {
  const [isMatching, setIsMatching] = useState(false);
  const [projectPeriod, setProjectPeriod] = useState<"active" | "past">("active");
  const [searchText, setSearchText] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>();
  const [sortBy, setSortBy] = useState("newest");
  const router = useRouter();
  const { styles } = useStyles();

  const { fetchCurrentUser } = useDeveloperAction();
  const { myProjects, isPending } = useProjectState();
  const { fetchMyProjects, fetchOpenProjects, aiMatchProject } = useProjectAction();

  useEffect(() => {
    fetchCurrentUser();
    fetchMyProjects();
    fetchOpenProjects();
  }, []);

  const handleAIMatch = async () => {
    setIsMatching(true);
    try {
      const matched = await aiMatchProject();
      if (!matched) {
        toast.info("No matches", "No matching open projects found.");
        return;
      }

      toast.success("Match found", `Best match: "${matched.title}".`);
      router.push(`/app/projects/${matched.id}?from=ai-match`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI matching failed.";
      toast.error("Match failed", message);
    } finally {
      setIsMatching(false);
    }
  };

  const availableSkills = [...new Set(myProjects.flatMap((project) => project.skills))].sort((a, b) => a.localeCompare(b));
  const visibleProjects = myProjects
    .filter((project) => {
      const isPast = ["complete", "completed"].includes(project.status.toLocaleLowerCase());
      const query = searchText.trim().toLocaleLowerCase();
      const searchableText = [project.title, project.description, ...project.skills].join(" ").toLocaleLowerCase();
      return isPast === (projectPeriod === "past")
        && (!query || searchableText.includes(query))
        && selectedSkills.every((skill) => project.skills.some((projectSkill) => projectSkill.toLocaleLowerCase() === skill.toLocaleLowerCase()))
        && (!selectedDifficulty || project.difficulty === selectedDifficulty);
    })
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "workload") return a.estimatedHoursPerWeek - b.estimatedHoursPerWeek;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className={styles.page} data-ai-page="projects-my">
      <motion.div className={styles.header} initial={false} animate={{ opacity: 1, y: 0 }}>
        <div>
          <Typography.Title level={2} className={styles.title}>
            My Projects
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            Manage your active projects and jump into delivery work.
          </Typography.Paragraph>
        </div>
        <div className={styles.actionRow}>
          <Link href="/app/projects/open">
            <Button>Browse Open Projects</Button>
          </Link>
          <Button
            onClick={handleAIMatch}
            loading={isMatching}
            icon={<Sparkles size={14} />}
            data-ai-action="ai-match-project"
          >
            AI Match Me
          </Button>
          <Link href="/app/projects/create">
            <Button
              type="primary"
              icon={<Plus size={14} />}
              data-ai-action="open-create-project-page"
            >
              New Project
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className={styles.projectControls}>
        <Segmented
          value={projectPeriod}
          onChange={(value) => setProjectPeriod(value as "active" | "past")}
          options={[{ label: "Active", value: "active" }, { label: "Past", value: "past" }]}
          aria-label="Project period"
        />
        <div className={styles.filters}>
          <Input
            allowClear
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search your projects"
            aria-label="Search my projects"
          />
          <Select
            mode="multiple"
            allowClear
            value={selectedSkills}
            onChange={setSelectedSkills}
            options={availableSkills.map((skill) => ({ label: skill, value: skill }))}
            placeholder="Filter by skills"
            aria-label="Filter my projects by skills"
          />
          <Select
            allowClear
            value={selectedDifficulty}
            onChange={setSelectedDifficulty}
            options={["beginner", "intermediate", "advanced", "expert"].map((difficulty) => ({ label: difficulty, value: difficulty }))}
            placeholder="Any difficulty"
            aria-label="Filter my projects by difficulty"
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={[
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
              { label: "Name A–Z", value: "title" },
              { label: "Lowest weekly hours", value: "workload" },
            ]}
            aria-label="Sort my projects"
          />
        </div>
      </div>

      {isPending && myProjects.length === 0 ? (
        <div className={styles.loading}><Spin /></div>
      ) : myProjects.length === 0 ? (
        <Card className={styles.emptyCard}>
          <Empty
            image={<FolderKanban size={48} />}
            description="No projects yet. Create one or let AI match you."
          />
        </Card>
      ) : visibleProjects.length === 0 ? (
        <Card className={styles.emptyCard}>
          <Empty description={projectPeriod === "past" ? "No past projects found." : "No active projects match these filters."} />
        </Card>
      ) : (
        <div className={styles.projectGrid}>
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} isMember />
          ))}
        </div>
      )}
      <Typography.Text type="secondary" className={styles.resultCount}>
        Showing {visibleProjects.length} of {myProjects.length} projects
      </Typography.Text>

      <AnimatePresence>
        {isMatching ? (
          <motion.div
            className={styles.matchingOverlay}
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.matchingContent}
              initial={false}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className={styles.matchingDot}>
                <Spin size="large" />
              </div>
              <Typography.Title level={4}>Finding your perfect match...</Typography.Title>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default MyProjectsPage;
