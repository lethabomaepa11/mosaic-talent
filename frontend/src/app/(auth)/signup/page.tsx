"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Input } from "antd";
import { useAuthAction, useAuthState } from "@/providers/auth-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { toast } from "@/components/providers";
import { useStyles } from "./style";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [userName, setUserName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { styles } = useStyles();
  const { register } = useAuthAction();
  const { isAuthenticated, isError, isPending } = useAuthState();
  const { isResolved, tenancyName } = useTenantResolutionState();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isResolved && tenancyName) {
      toast.error("Signup disabled", "Company tenant users cannot self-register.");
      router.push("/login");
    }
  }, [isResolved, tenancyName, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !surname || !userName || !emailAddress || !password) {
      toast.error("Missing fields", "Complete all required fields to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ name, surname, userName, emailAddress, password });
      toast.success("Account created", "Continue with onboarding.");
      router.push("/onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Start your developer profile onboarding</p>
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="name" className={styles.label}>Name</label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label htmlFor="surname" className={styles.label}>Surname</label>
                <Input id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} className={styles.input} />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="username" className={styles.label}>Username</label>
              <Input id="username" value={userName} onChange={(e) => setUserName(e.target.value)} className={styles.input} autoComplete="username" />
            </div>

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <Input id="email" type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} className={styles.input} autoComplete="email" />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <Input.Password id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} autoComplete="new-password" />
            </div>

            {isError ? <div className={styles.statusError}>Unable to create account with provided details.</div> : null}
            {isAuthenticated ? <div className={styles.statusSuccess}>Account created. Redirecting...</div> : null}

            <div className={styles.actions}>
              <Button type="primary" htmlType="submit" loading={isSubmitting || isPending} block>
                Continue to Onboarding
                <ArrowRight size={16} className={styles.buttonIconEnd} />
              </Button>
              <div className={styles.helper}>
                Already have an account? <Link href="/login">Sign in</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
