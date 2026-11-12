"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, Spin } from "antd";
import { Brand } from "@/components/journey/Brand";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { shouldRestrictLandingOnTenantSubdomain } from "./landingAccess";
import { useStyles } from "./style";

const steps = [
  { title: "Find a project", description: "Browse by skills, project goals, and hours per week. Read the brief and see who’s on the team before you join." },
  { title: "Work with your team", description: "Agree on a first milestone, assign tasks, and keep your setup notes and resources in one place." },
  { title: "Share what you made", description: "Link your work, explain what you learned, and get feedback from the people you worked with." },
];

const LandingPage = () => {
  const { styles } = useStyles();
  const { isResolved, tenancyName, source } = useTenantResolutionState();
  const restricted = shouldRestrictLandingOnTenantSubdomain({ isResolved, tenancyName, source });
  useEffect(() => { if (restricted) window.location.replace("/app"); }, [restricted]);

  if (restricted) return <div className={styles.resolvingState}><Spin size="large"/></div>;

  return <div className={styles.page}>
    <a className={styles.skipLink} href="#main-content">Skip to content</a>
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Brand/>
        <div className={styles.navLinks}><a href="#how-it-works">How it works</a><Link href="/login">Sign in</Link></div>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1} className={styles.main}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <h1 id="hero-title">Build a project with other developers.</h1>
        <p className={styles.lead}>Find teammates, get practical experience, and meet potential cofounders by working on a project together.</p>
        <div className={styles.actions}><Button href="/signup" type="primary" size="large">Create account</Button><a href="#how-it-works">How it works</a></div>
        <p className={styles.note}>Use your existing skills or learn something new. Connecting GitHub is optional.</p>
      </section>
      <section id="how-it-works" className={styles.section} aria-labelledby="how-title">
        <h2 id="how-title">From joining a team to your first contribution</h2>
        <ol className={styles.steps}>{steps.map((step, index) => <li key={step.title}><span className={styles.stepNumber}>{index + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol>
      </section>
      <section className={styles.useCases} aria-labelledby="use-cases-title">
        <h2 id="use-cases-title">What do you want to work on?</h2>
        <dl>
          <div><dt>Practice working in a team</dt><dd>Join a learning project, take a manageable task, and ask teammates to review your work.</dd></div>
          <div><dt>Develop a product idea</dt><dd>Post an idea for discussion or create a project with a clear problem and first milestone.</dd></div>
          <div><dt>Find a cofounder</dt><dd>Try a small project together to understand how you communicate, make decisions, and get work done.</dd></div>
        </dl>
      </section>
      <section className={styles.join}><div><h2>Ready to join a project?</h2><p>Create a profile with your skills and what you’d like to learn.</p></div><Button href="/signup" type="primary">Create account</Button></section>
    </main>
    <footer className={styles.footer}><span>mosaic.talent</span><Link href="/how-to">Getting started</Link><Link href="/login">Sign in</Link></footer>
  </div>;
};

export default LandingPage;
