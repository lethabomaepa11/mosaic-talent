"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Compass, GitPullRequest, MessageCircle, Sparkles, Users } from "lucide-react";
import { Spin } from "antd";
import { useAppearanceState } from "@/providers/appearance-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { shouldRestrictLandingOnTenantSubdomain } from "./landingAccess";
import { useStyles } from "./style";

const benefits = [
  {
    icon: Compass,
    title: "Find a place to contribute",
    description: "Explore open team projects and choose work that fits your skills and the skills you want to build.",
  },
  {
    icon: GitPullRequest,
    title: "Make your progress visible",
    description: "Record what you built, link your work, and reflect on what you learned along the way.",
  },
  {
    icon: MessageCircle,
    title: "Grow with useful feedback",
    description: "Get thoughtful reviews from teammates so you can see your strengths and decide what to improve next.",
  },
];

const steps = [
  { number: "01", title: "Create your account", description: "Sign up with your details to start your developer profile." },
  { number: "02", title: "Set your direction", description: "Add your skills and goals. Connect GitHub if you want, or skip it for now." },
  { number: "03", title: "Build with a team", description: "Find a project, contribute, and turn your work into evidence of your growth." },
];

const LandingPage = () => {
  const { mode } = useAppearanceState();
  const { isResolved, tenancyName, source } = useTenantResolutionState();
  const { styles } = useStyles();
  const logoSrc = mode === "light" ? "/text-logo-light.svg" : "/text-logo.svg";
  const shouldRestrictLanding = shouldRestrictLandingOnTenantSubdomain({ isResolved, tenancyName, source });

  useEffect(() => {
    if (shouldRestrictLanding) window.location.replace("/app");
  }, [shouldRestrictLanding]);

  if (!isResolved || shouldRestrictLanding) {
    return <div className={styles.resolvingState}><Spin size="large" /></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.container} aria-label="Main navigation">
          <div className={styles.navInner}>
            <Link href="/" className={styles.brand} aria-label="Mosaic Talent home">
              <Image src={logoSrc} alt="Mosaic Talent" width={156} height={30} className={styles.brandLogo} loading="eager" />
            </Link>
            <div className={styles.navLinks}>
              <a href="#benefits">Why join</a>
              <a href="#how-it-works">How it works</a>
            </div>
            <div className={styles.navActions}>
              <Link href="/login" className={styles.signIn}>Sign in</Link>
              <Link href="/signup" className={styles.navCta}>Create account</Link>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <span className={styles.eyebrow}><Sparkles size={16} aria-hidden="true" /> Built for developers who want to grow</span>
                <h1 id="hero-title" className={styles.heroTitle}>Build with people. <span>Grow with purpose.</span></h1>
                <p className={styles.heroDescription}>Move beyond tutorials. Join team projects, make real contributions, and get feedback that helps you become a stronger developer.</p>
                <div className={styles.heroActions}>
                  <Link href="/signup" className={styles.primaryAction}>Create your free account <ArrowRight size={18} aria-hidden="true" /></Link>
                  <a href="#how-it-works" className={styles.secondaryAction}>See how it works</a>
                </div>
                <p className={styles.heroNote}><CheckCircle2 size={17} aria-hidden="true" /> GitHub connection is optional during onboarding.</p>
              </div>

              <div className={styles.journeyCard} aria-label="Your developer journey">
                <div className={styles.journeyHeader}>
                  <span className={styles.journeyIcon}><Users size={23} aria-hidden="true" /></span>
                  <div><p className={styles.journeyLabel}>YOUR NEXT CHAPTER</p><h2>Learn by building together</h2></div>
                </div>
                <div className={styles.journeyTrack}>
                  <div className={styles.journeyItem}><span className={styles.journeyMarker}>1</span><div><strong>Discover a project</strong><p>Find a team and a challenge that moves you forward.</p></div></div>
                  <div className={styles.journeyItem}><span className={styles.journeyMarker}>2</span><div><strong>Contribute real work</strong><p>Build, collaborate, and keep a record of your progress.</p></div></div>
                  <div className={styles.journeyItem}><span className={styles.journeyMarker}>3</span><div><strong>Reflect and improve</strong><p>Learn from your own notes and your team&apos;s feedback.</p></div></div>
                </div>
                <div className={styles.journeyFooter}><span className={styles.journeyDot} /> Your growth starts with one project</div>
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className={styles.section} aria-labelledby="benefits-title">
          <div className={styles.container}>
            <div className={styles.sectionIntro}><span className={styles.sectionKicker}>WHY JOIN</span><h2 id="benefits-title">Experience you can talk about. Growth you can see.</h2><p>Mosaic Talent helps you practice the skills that matter when working with other developers.</p></div>
            <div className={styles.benefitsGrid}>
              {benefits.map(({ icon: Icon, title, description }) => <article className={styles.benefitCard} key={title}><span className={styles.benefitIcon}><Icon size={24} aria-hidden="true" /></span><h3>{title}</h3><p>{description}</p></article>)}
            </div>
          </div>
        </section>

        <section id="how-it-works" className={styles.stepsSection} aria-labelledby="steps-title">
          <div className={styles.container}>
            <div className={styles.sectionIntro}><span className={styles.sectionKicker}>GET STARTED</span><h2 id="steps-title">From signup to your first contribution</h2><p>A simple path from what you know today to what you want to learn next.</p></div>
            <div className={styles.stepsGrid}>
              {steps.map((step) => <article className={styles.stepCard} key={step.number}><span className={styles.stepNumber}>{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></article>)}
            </div>
          </div>
        </section>

        <section className={styles.finalSection} aria-labelledby="final-title">
          <div className={styles.container}>
            <div className={styles.finalCard}><div><span className={styles.sectionKicker}>READY WHEN YOU ARE</span><h2 id="final-title">Your next project could change what you can do.</h2><p>Create your profile, meet a team, and start building.</p></div><Link href="/signup" className={styles.primaryAction}>Join Mosaic Talent <ArrowRight size={18} aria-hidden="true" /></Link></div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}><div className={styles.container}><div className={styles.footerInner}><span>Mosaic Talent · Build together. Grow together.</span><Link href="/login">Already a member? Sign in</Link></div></div></footer>
    </div>
  );
};

export default LandingPage;
