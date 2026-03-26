"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BarChart3,
  Brain,
  Check,
  ChevronRight,
  GitBranch,
  MessageSquare,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button, Tabs } from "antd";
import { InsightReportDemo } from "@/components/landing/insight-report-demo";
import { designTokens } from "@/theme/antdTheme";
import { useStyles } from "./style";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

type TabItem = {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
};

const devItems: TabItem[] = [
  {
    icon: Users,
    title: "Join Team Projects",
    description:
      "Collaborate on real projects with other developers. Build your portfolio while practicing teamwork.",
  },
  {
    icon: MessageSquare,
    title: "Get Peer Reviews",
    description:
      "Receive AI-analyzed feedback from teammates. Understand your strengths and growth areas.",
  },
  {
    icon: Brain,
    title: "Practice with AI Simulator",
    description:
      "Handle difficult team scenarios in a safe environment. Build conflict resolution skills.",
  },
];

const companyItems: TabItem[] = [
  {
    icon: GitBranch,
    title: "Scan GitHub Profile",
    description:
      "AI analyzes code quality, contribution patterns, and collaboration history automatically.",
  },
  {
    icon: Target,
    title: "Custom Assessments",
    description:
      "Generate role-specific tickets and evaluate problem-solving approaches.",
  },
  {
    icon: BarChart3,
    title: "Full Insight Reports",
    description:
      "Get comprehensive candidate profiles with soft skill scores and team fit predictions.",
  },
];

const simulatorFeatures = [
  {
    icon: Zap,
    title: "Real Scenarios",
    desc: "Practice with missed deadlines, scope creep, conflicts, and more",
  },
  {
    icon: Brain,
    title: "Adaptive AI",
    desc: "AI responds naturally based on your communication approach",
  },
  {
    icon: BarChart3,
    title: "Detailed Feedback",
    desc: "Get scored on communication, empathy, and resolution skills",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    desc: "See your soft skills improve over time with each simulation",
  },
];

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState("developers");
  const { styles } = useStyles();

  const tabItems = activeTab === "developers" ? devItems : companyItems;

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.container}>
          <div className={styles.navInner}>
            <Link href="/" className={styles.brand}>
              <Image
                src="/text-logo.svg"
                alt="Mosaic Talent"
                width={156}
                height={30}
                className={styles.brandLogo}
                priority
              />
            </Link>

            <div className={styles.navLinks}>
              <a href="#how-it-works" className={styles.muted}>
                How it Works
              </a>
              <a href="#features" className={styles.muted}>
                Features
              </a>
              <a href="#for-companies" className={styles.muted}>
                For Companies
              </a>
            </div>

            <div className={styles.navActions}>
              <Link href="/login">
                <Button type="text" className={styles.signInButton}>
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button type="primary" className={styles.getStartedButton}>
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroGlowPrimary} />
        <div className={styles.heroGlowSecondary} />

        <div className={styles.container}>
          <motion.div
            className={styles.heroContent}
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className={styles.heroBadge}>
              <Sparkles size={14} />
              <span>AI-Powered Hiring Intelligence</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className={styles.heroTitle}>
              Discover the{" "}
              <span className={styles.gradientText}>full picture</span> of
              developer talent
            </motion.h1>

            <motion.p variants={fadeInUp} className={styles.heroText}>
              Beyond code quality. AI-driven soft skill assessment, peer
              reviews, and team simulation for smarter hiring decisions.
            </motion.p>

            <motion.div variants={fadeInUp} className={styles.heroActions}>
              <Link href="/login">
                <Button type="primary" size="large">
                  Start Free Trial
                  <ChevronRight size={18} className={styles.buttonIcon} />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="large" variant="outlined">
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className={styles.heroChecks}>
              <span className={styles.checkItem}>
                <Check size={14} color={designTokens.teal} /> No credit card
                required
              </span>
              <span className={styles.checkItem}>
                <Check size={14} color={designTokens.teal} /> Free for
                developers
              </span>
              <span className={styles.checkItem}>
                <Check size={14} color={designTokens.teal} /> 14-day company
                trial
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {[
              { value: "10K+", label: "Developers Assessed" },
              { value: "500+", label: "Companies Hiring" },
              { value: "87%", label: "Hiring Success Rate" },
              { value: "3.2x", label: "Faster to Hire" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className={styles.statItem}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className={styles.statValue}>{stat.value}</p>
                <div className={styles.statLabel}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.section}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionText}>
              A complete ecosystem for growing and showcasing developer soft
              skills
            </p>
          </motion.div>

          <div className={styles.tabsWrap}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              centered
              items={[
                { key: "developers", label: "For Developers" },
                { key: "companies", label: "For Companies" },
              ]}
            />
          </div>

          <div className={styles.cardsGrid}>
            {tabItems.map((item, i) => (
              <motion.div
                key={item.title}
                className={styles.featureCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className={
                    activeTab === "developers"
                      ? styles.iconBox
                      : styles.iconBoxTeal
                  }
                >
                  <item.icon size={24} />
                </div>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className={styles.sectionAlt}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className={styles.sectionTitle}>AI Teammate Simulator</h2>
            <p className={styles.sectionText}>
              Practice handling real workplace scenarios with our AI-powered
              simulation
            </p>
          </motion.div>

          <div className={styles.simulatorGrid}>
            <motion.div
              className={styles.simulatorCard}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className={styles.simulatorTop}>
                <span
                  className={styles.traffic}
                  style={{ background: "#ef444488" }}
                />
                <span
                  className={styles.traffic}
                  style={{ background: "#eab30888" }}
                />
                <span
                  className={styles.traffic}
                  style={{ background: "#22c55e88" }}
                />
                <span className={styles.simulatorLabel}>AI Teammate Simulator</span>
              </div>
              <div className={styles.simulatorBody}>
                <div className={styles.chatRow}>
                  <div className={styles.avatar} />
                  <div className={styles.bubble}>
                    I know the feature was due yesterday, but the requirements
                    kept changing. It&apos;s not really my fault...
                  </div>
                </div>
                <div className={styles.chatRowRight}>
                  <div className={styles.bubblePrimary}>
                    I understand the requirements shifted. Can we discuss what
                    blockers you faced?
                  </div>
                  <div className={styles.avatarPrimary} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className={styles.simulatorList}>
                {simulatorFeatures.map((feature) => (
                  <div key={feature.title} className={styles.simulatorItem}>
                    <div className={styles.simulatorItemIcon}>
                      <feature.icon size={18} />
                    </div>
                    <div>
                      <h4 className={styles.cardTitle}>{feature.title}</h4>
                      <p className={styles.cardText}>{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/login">
                <Button type="primary" className={styles.simulatorCta}>
                  Try the Simulator
                  <ChevronRight size={16} className={styles.buttonIcon} />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="for-companies" className={styles.section}>
        <div className={styles.container}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className={styles.sectionTitle}>Complete Candidate Insights</h2>
            <p className={styles.sectionText}>
              Make data-driven hiring decisions with comprehensive soft skill
              assessments
            </p>
          </motion.div>

          <InsightReportDemo />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <motion.div
            className={styles.ctaBox}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className={styles.sectionTitle}>
              Ready to see the full picture?
            </h2>
            <p className={styles.sectionText}>
              Join thousands of developers and companies already using
              mosaictalent
            </p>
            <div className={styles.heroActions}>
              <Link href="/login">
                <Button type="primary" size="large">
                  Get Started Free
                  <ChevronRight size={18} className={styles.buttonIcon} />
                </Button>
              </Link>
              <Link href="/company">
                <Button size="large" variant="outlined">
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerInner}>
            <Link href="/" className={styles.brand}>
              <Image
                src="/text-logo.svg"
                alt="Mosaic Talent"
                width={156}
                height={30}
                className={styles.brandLogo}
              />
            </Link>

            <div className={styles.footerLinks}>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Contact</a>
            </div>

            <div className={styles.footerBadge}>
              <Shield size={16} color={designTokens.teal} />
              <span>SOC 2 Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
