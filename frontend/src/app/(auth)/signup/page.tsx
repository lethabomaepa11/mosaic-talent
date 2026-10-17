"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Input } from "antd";
import { Moon, Sun } from "lucide-react";
import { useAuthAction, useAuthState } from "@/providers/auth-provider";
import { useAppearanceAction, useAppearanceState } from "@/providers/appearance-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { isStrongPassword, PASSWORD_HINT } from "./validation";
import { useStyles } from "./style";

const SignupPage = () => {
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { styles } = useStyles();
  const { mode } = useAppearanceState();
  const { toggleMode } = useAppearanceAction();
  const { register } = useAuthAction();
  const { isPending } = useAuthState();
  const { isResolved, tenancyName } = useTenantResolutionState();

  useEffect(() => {
    if (isResolved && tenancyName) router.replace("/login");
  }, [isResolved, tenancyName, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName.trim() || !emailAddress.trim() || !isStrongPassword(password)) {
      setError(`Enter your name, email, and a strong password. ${PASSWORD_HINT}`);
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await register({ fullName: fullName.trim(), emailAddress: emailAddress.trim(), password });
      router.replace("/onboarding");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topRow}>
          <span className={styles.productName}>Mosaic Talent</span>
          <Button
            type="text"
            onClick={toggleMode}
            icon={mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {mode === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </div>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>BUILD TOGETHER. GROW TOGETHER.</p>
          <h1 className={styles.title}>Your next chapter starts here</h1>
          <p className={styles.subtitle}>Find a team, build real projects, and grow your skills.</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="fullName" className={styles.label}>Full name</label>
              <Input id="fullName" autoComplete="name" maxLength={129} required value={fullName}
                onChange={(event) => setFullName(event.target.value)} placeholder="For example, Thabo Mokoena" size="large" />
            </div>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <Input id="email" type="email" autoComplete="email" maxLength={256} required value={emailAddress}
                onChange={(event) => setEmailAddress(event.target.value)} placeholder="thabo@example.com" size="large" />
            </div>
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <Input.Password id="password" autoComplete="new-password" maxLength={128} required value={password}
                onChange={(event) => setPassword(event.target.value)} placeholder="Choose a strong password" aria-describedby="password-hint" size="large" />
              <span id="password-hint" className={styles.helper}>{PASSWORD_HINT}</span>
            </div>
            {error && <Alert title={error} type="error" showIcon role="alert" />}
            <div className={styles.actions}>
              <Button type="primary" htmlType="submit" loading={isSubmitting || isPending} size="large" block>Create account</Button>
              <div className={styles.helper}>Already have an account? <Link href="/login">Sign in</Link></div>
            </div>
        </form>
        <p className={styles.helper}>Next, choose your skills and goals. Connecting GitHub is optional.</p>
      </div>
    </div>
  );
};

export default SignupPage;
