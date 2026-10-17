"use client";

import Link from "next/link";
import { Button, Typography } from "antd";
import { ArrowRight, Compass, Lightbulb, MessageSquareHeart, NotebookTabs, UsersRound } from "lucide-react";
import { useStyles } from "./style";

const steps = [
  { title: "Build your starting point", text: "Complete your profile with the skills you have and the goals you want to grow into.", href: "/app/profile", action: "Open my profile", icon: UsersRound },
  { title: "Find a project that fits", text: "Browse teams by skills and difficulty, use AI Match Me, or review one project at a time.", href: "/app/projects/open", action: "Discover projects", icon: Compass },
  { title: "Turn an idea into a team", text: "Use a project brief to explain the problem, then invite teammates who want to help solve it.", href: "/app/projects/create", action: "Create a project", icon: Lightbulb },
  { title: "Do the work together", text: "Use the project workspace to share tasks, meetings, repository context, and documented progress.", href: "/app/projects/my", action: "Open my projects", icon: NotebookTabs },
  { title: "Learn from feedback", text: "Request peer feedback, record what you contributed, and use the results to improve your next project.", href: "/app/reviews", action: "View peer reviews", icon: MessageSquareHeart },
];

const HowToPage = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.page} data-ai-page="how-to">
      <header className={styles.header}>
        <Typography.Text className={styles.eyebrow}>HOW TO USE MOSAIC TALENT</Typography.Text>
        <Typography.Title level={1} className={styles.title}>From an idea to a team you can learn with.</Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>Start small. Pick one next action. Mosaic Talent helps you find people, work together, and show what you learned.</Typography.Paragraph>
        <Link href="/app/projects/open"><Button type="primary" size="large" icon={<Compass size={16} />}>Find a project</Button></Link>
      </header>

      <section className={styles.steps} aria-label="How to use Mosaic Talent">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return <article key={step.title} className={styles.step}>
            <div className={styles.stepNumber}>{index + 1}</div>
            <Icon size={22} className={styles.stepIcon} aria-hidden />
            <div className={styles.stepContent}>
              <Typography.Title level={3} className={styles.stepTitle}>{step.title}</Typography.Title>
              <Typography.Paragraph className={styles.stepText}>{step.text}</Typography.Paragraph>
              <Link href={step.href}><Button type="link" className={styles.stepAction}>{step.action} <ArrowRight size={15} /></Button></Link>
            </div>
          </article>;
        })}
      </section>
    </div>
  );
};

export default HowToPage;
