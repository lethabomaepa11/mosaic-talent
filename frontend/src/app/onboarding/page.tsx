"use client";

import { Alert, Button, Progress, Select } from "antd";
import { GithubOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { AppOperatorPanel } from "@/components/app-operator";
import { useOnboarding } from "./useOnboarding";
import { useStyles } from "./style";

const TITLES = ["Your account", "Connect GitHub", "Choose your skills", "Set your goals"];

const OnboardingPage = () => {
  const { styles } = useStyles();
  const flow = useOnboarding();
  const { draft, step, busy, loading, error, notice } = flow;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>A FEW STEPS TO YOUR NEXT TEAM</p>
          <h1 className={styles.title}>Make room for growth</h1>
          <p className={styles.subtitle}>Help us find projects and teammates that fit you.</p>
        </header>
        <main className={styles.content}>
          {loading ? <p role="status">Loading your profile...</p> : !draft ? (
            <Alert title={error || "Unable to load your profile"} type="error" showIcon
              action={<Button onClick={flow.retry}>Try again</Button>} />
          ) : (
            <>
              <div className={styles.progress}>
                <span className={styles.fieldHint}>Step {step + 1} of 4</span>
                <Progress percent={(step + 1) * 25} showInfo={false} />
                <ol className={styles.steps} aria-label="Onboarding progress">
                  {TITLES.map((title, index) => <li key={title} aria-current={step === index ? "step" : undefined}
                    className={step === index ? styles.currentStep : styles.step}>{title}</li>)}
                </ol>
              </div>
              <div className={styles.form}>
                <h2 className={styles.stepTitle}>{TITLES[step]}</h2>
                {step === 0 && (
                  <>
                    <p className={styles.subtitle}>Your account is ready. Next, tell us what you enjoy building.</p>
                    <dl className={styles.accountDetails}>
                      <dt>Full name</dt><dd>{draft.fullName}</dd>
                      <dt>Email</dt><dd>{draft.emailAddress}</dd>
                    </dl>
                    <p className={styles.fieldHint}>A skill is required to get started. GitHub and learning goals are optional.</p>
                  </>
                )}
                {step === 1 && (
                  <>
                    <p className={styles.subtitle}>Import skills from repositories you own. You can edit every suggestion.</p>
                    {draft.githubUsername && <Alert title={`Connected as ${draft.githubUsername}`} type="success" icon={<CheckCircleOutlined />} showIcon />}
                    <Button icon={<GithubOutlined />} onClick={flow.connectGithub} loading={busy} size="large">
                      {draft.githubUsername ? "Reconnect GitHub" : "Connect GitHub"}
                    </Button>
                    <p className={styles.fieldHint}>Prefer to do this later? Continue without connecting an account.</p>
                  </>
                )}
                {step === 2 && (
                  <div className={styles.field}>
                    <label htmlFor="skills" className={styles.label}>Current skills</label>
                    <p id="skills-hint" className={styles.fieldHint}>Add at least one skill. Type a skill and press Enter; use the remove button to edit suggestions.</p>
                    <Select id="skills" mode="tags" value={draft.skills} onChange={(values) => flow.changeValues("skills", values)}
                      placeholder="For example, Python or teamwork" aria-describedby="skills-hint" size="large" className={styles.fullWidth}
                      tokenSeparators={[","]} maxTagTextLength={30} disabled={busy} />
                    {flow.importing && <p role="status">Loading GitHub skills...</p>}
                  </div>
                )}
                {step === 3 && (
                  <div className={styles.field}>
                    <label htmlFor="goals" className={styles.label}>Learning goals (optional)</label>
                    <p className={styles.fieldHint}>Choose skills to learn or aspects of your career to develop. You can change these later.</p>
                    <Select id="goals" mode="tags" value={draft.goals} onChange={(values) => flow.changeValues("goals", values)}
                      placeholder="For example, learn C# or lead a team" size="large" className={styles.fullWidth} tokenSeparators={[","]} maxTagTextLength={30} disabled={busy} />
                  </div>
                )}
                {notice && <Alert title={notice} type="info" showIcon />}
                {error && <Alert title={error} type="error" showIcon role="alert" />}
              </div>
              <div className={styles.actions}>
                {step > 0 && <Button onClick={flow.back} disabled={busy}>Back</Button>}
                {step === 3 ? (
                  <>
                    <Button onClick={() => void flow.finish(true)} disabled={busy}>Skip goals and finish</Button>
                    <Button type="primary" onClick={() => void flow.finish()} loading={busy} size="large">Finish onboarding</Button>
                  </>
                ) : (
                  <Button type="primary" onClick={() => void flow.next()} loading={busy} disabled={flow.importing} size="large">
                    {step === 1 && !draft.githubUsername ? "Skip GitHub" : "Continue"}
                  </Button>
                )}
              </div>
            </>
          )}
        </main>
      </div>
      <AppOperatorPanel />
    </div>
  );
};

export default OnboardingPage;
