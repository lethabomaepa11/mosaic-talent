import Link from "next/link";
import { Button, Typography } from "antd";
import { ArrowRight, Compass, Lightbulb, UsersRound } from "lucide-react";
import { useStyles } from "./style";

const PublicHowToPage = () => {
  const { styles } = useStyles();

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.back}>Mosaic Talent</Link>
      <Typography.Text className={styles.eyebrow}>HOW IT WORKS</Typography.Text>
      <Typography.Title level={1} className={styles.title}>Make an idea real with people who want to build.</Typography.Title>
      <Typography.Paragraph className={styles.subtitle}>Mosaic Talent helps developers move from a learning goal to a project, meaningful contribution, and useful feedback.</Typography.Paragraph>
      <div className={styles.actions}><Link href="/signup"><Button type="primary" size="large">Create an account <ArrowRight size={16} /></Button></Link><Link href="/login"><Button size="large">Sign in</Button></Link></div>
    </header>
    <section className={styles.steps} aria-label="Mosaic Talent journey">
      <article><UsersRound size={24} /><h2>1. Set your direction</h2><p>Tell us the skills you have and the skills you want to build. GitHub is optional.</p></article>
      <article><Compass size={24} /><h2>2. Find a challenge</h2><p>Explore open projects, compare AI matches, and choose a team where you can contribute.</p></article>
      <article><Lightbulb size={24} /><h2>3. Build and grow</h2><p>Work with your team, document your contribution, and use feedback to improve your next project.</p></article>
    </section>
  </main>;
};

export default PublicHowToPage;
