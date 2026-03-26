"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Input } from "antd";
import { toast } from "@/components/providers";
import { useAuthAction, useAuthState } from "@/providers/auth-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

const CompanyLoginPage = () => {
  const [userNameOrEmailAddress, setUserNameOrEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { styles } = useStyles();
  const { login } = useAuthAction();
  const { isError, isPending } = useAuthState();
  const { isResolved, isPending: isTenantPending, isError: isTenantError, tenancyName } =
    useTenantResolutionState();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userNameOrEmailAddress || !password) {
      toast.error("Missing credentials", "Enter email/username and password.");
      return;
    }

    if (!isResolved || (isTenantError && tenancyName)) {
      toast.error("Tenant unavailable", "Resolve tenant context before signing in.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(userNameOrEmailAddress, password);
      router.push("/app");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Company Sign In</h1>
          <p className={styles.subtitle}>
            Sign in from your company domain to access admin and HR features.
          </p>
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="userNameOrEmailAddress" className={styles.label}>
                Email or Username
              </label>
              <Input
                id="userNameOrEmailAddress"
                value={userNameOrEmailAddress}
                onChange={(event) => setUserNameOrEmailAddress(event.target.value)}
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
                className={styles.input}
                autoComplete="current-password"
              />
            </div>

            {!isResolved || isTenantPending ? (
              <div className={styles.helper}>Resolving tenant context...</div>
            ) : null}

            {isTenantError && tenancyName ? (
              <div className={styles.statusError}>
                Tenant &quot;{tenancyName}&quot; is unavailable on this hostname.
              </div>
            ) : null}

            {!tenancyName && isResolved ? (
              <div className={styles.tenantHint}>
                No company tenancy was detected from this domain. Use your company domain,
                for example: <code>company-mosaic-talent.vercel.app</code>.
              </div>
            ) : null}

            {isError ? (
              <div className={styles.statusError}>Unable to sign in with those credentials.</div>
            ) : null}

            <div className={styles.actions}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting || isPending || isTenantPending}
                icon={<ArrowRight size={16} />}
                iconPosition="end"
                disabled={!isResolved || (isTenantError && !!tenancyName)}
                block
              >
                Sign In
              </Button>
              <div className={styles.helper}>
                Need a tenant? <Link href="/company/signup">Create company account</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyLoginPage;
