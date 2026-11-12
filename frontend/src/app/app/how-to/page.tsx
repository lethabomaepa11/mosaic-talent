"use client";

import Link from "next/link";
import { Button, Typography } from "antd";
import { ArrowRight, Compass, Lightbulb, MessageSquareHeart, NotebookTabs, UsersRound } from "lucide-react";
import { useStyles } from "./style";

const steps = [
  { title: "Set up your profile", text: "Complete your profile with the skills you have and the goals you want to grow into.", href: "/app/build-profile", action: "Open my profile", icon: UsersRound },
  { title: "Find a project", text: "Browse teams by purpose, skills, and weekly commitment. Read the fit explanations and agree on a realistic pace.", href: "/app/projects/open", action: "Discover projects", icon: Compass },
  { title: "Create a project", text: "Use a project brief to explain the problem, then invite teammates who want to help solve it.", href: "/app/projects/create", action: "Create project", icon: Lightbulb },
  { title: "Choose a task", text: "Pick up a starter task, agree what done looks like, share evidence, and ask for feedback. Tools and integrations stay available in each workspace.", href: "/app/work", action: "My projects", icon: NotebookTabs },
  { title: "Get feedback", text: "Request peer feedback, record what you contributed, and use the results to improve your next project.", href: "/app/reviews", action: "View peer reviews", icon: MessageSquareHeart },
];

const HowToPage = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.page} data-ai-page="how-to">
      <header className={styles.header}>
        <Typography.Text className={styles.eyebrow}>mosaic.talent</Typography.Text>
        <Typography.Title level={1} className={styles.title}>Getting started</Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>Create a profile, join a project, and work on a task with your team.</Typography.Paragraph>
        <Link href="/app/projects/open"><Button type="primary" size="large" icon={<Compass size={16} />}>Find a project</Button></Link>
      </header>

      <section className={styles.steps} aria-label="How to use mosaic.talent">
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
