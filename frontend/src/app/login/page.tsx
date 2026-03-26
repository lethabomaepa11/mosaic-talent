"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, GitBranch, Sparkles } from "lucide-react";
import { Button, Divider, Input } from "antd";
import { useAuthAction, useAuthState } from "@/providers/auth-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
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
  const {
    isResolved,
    isPending: isTenantPending,
    isError: isTenantError,
    tenancyName,
    companyName,
    companyLogoUrl,
  } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);

  const githubAuthUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TokenAuth/GitHubAuth`
    : "";

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Missing credentials", "Enter email/username and password.");
      return;
    }

    if (!isResolved || (isTenantError && tenancyName)) {
      toast.error("Tenant not ready", "Tenant context is not available for login.");
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
          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt={`${companyName || tenancyName} logo`}
              className={styles.companyLogo}
            />
          ) : null}
          <div className={styles.logoRow}>
            {isCompanyTenant ? null : (
              <div className={styles.logoIcon}>
                <Sparkles size={18} />
              </div>
            )}
            <span className={styles.logoText}>
              {isCompanyTenant ? companyName || tenancyName : "mosaictalent"}
            </span>
          </div>
          <p className={styles.subtitle}>
            {companyName ? `Sign in to ${companyName}` : "Sign in to continue"}
          </p>
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
                loading={isLoading || isPending || isTenantPending}
                icon={<ArrowRight size={16} />}
                iconPosition="end"
                disabled={!isResolved || (isTenantError && !!tenancyName)}
                block
              >
                Sign In
              </Button>

              <Divider className={styles.divider}>or continue with</Divider>

              <Button
                onClick={handleGitHubLogin}
                icon={<GitBranch size={16} className={styles.buttonIcon} />}
                disabled={!isResolved || (isTenantError && !!tenancyName)}
                block
              >
                Continue with GitHub
              </Button>
              {!isResolved || isTenantPending ? (
                <div className={styles.helper}>Resolving tenant context...</div>
              ) : null}
              {isTenantError && tenancyName ? (
                <div className={styles.statusError}>
                  Tenant &quot;{tenancyName}&quot; is unavailable for this domain.
                </div>
              ) : null}
              {!tenancyName ? (
                <div className={styles.helper}>
                  Don&apos;t have an account? <Link href="/signup">Create one</Link>
                </div>
              ) : null}
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
