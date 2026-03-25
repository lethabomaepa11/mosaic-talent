"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, GitBranch, Sparkles } from "lucide-react";
import { Button, Divider, Input } from "antd";
import { useAuthAction, useAuthState } from "@/providers/auth-provider";
import { toast } from "@/components/providers";
import { useStyles } from "./style";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { styles } = useStyles();
  const { login } = useAuthAction();
  const { isAuthenticated, isError, isPending } = useAuthState();

  const githubAuthUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TokenAuth/GitHubAuth`
    : "";

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Missing credentials", "Enter email/username and password.");
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleLogin();
  };

  const handleGitHubLogin = () => {
    if (!githubAuthUrl) {
      toast.error("GitHub auth unavailable", "Configure NEXT_PUBLIC_API_BASE_URL first.");
      return;
    }

    window.location.href = githubAuthUrl;
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />

      <motion.div
        className={styles.shell}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className={styles.logoWrap}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <Sparkles size={18} />
            </div>
            <span className={styles.logoText}>mosaictalent</span>
          </div>
          <p className={styles.subtitle}>Sign in to continue</p>
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email or Username
              </label>
              <Input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="thabo@example.com"
                className={styles.input}
                autoComplete="username"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <Input.Password
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className={styles.input}
                autoComplete="current-password"
              />
            </div>

            {isError ? (
              <div className={styles.statusError}>Unable to sign in with those credentials.</div>
            ) : null}

            {isAuthenticated ? (
              <div className={styles.statusSuccess}>Authenticated. Redirecting...</div>
            ) : null}

            <div className={styles.actions}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading || isPending}
                icon={<ArrowRight size={16} />}
                iconPosition="end"
                block
              >
                Sign In
              </Button>

              <Divider className={styles.divider}>or continue with</Divider>

              <Button
                onClick={handleGitHubLogin}
                icon={<GitBranch size={16} className={styles.buttonIcon} />}
                block
              >
                Continue with GitHub
              </Button>
            </div>
          </form>
        </div>

        <p className={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
