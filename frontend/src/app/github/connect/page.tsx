"use client";

import { useEffect, useState } from "react";
import { Alert, Button } from "antd";
import { useRouter } from "next/navigation";
import { useAuthAction, useAuthState } from "@/providers/auth-provider";
import { useStyles } from "./style";

const GithubConnectPage = () => {
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const { styles } = useStyles();
  const router = useRouter();
  const { isSessionRestored, isAuthenticated } = useAuthState();
  const { beginGithubConnection } = useAuthAction();

  useEffect(() => {
    if (!isSessionRestored) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    let cancelled = false;
    const connect = async () => {
      try {
        const path = new URLSearchParams(window.location.search).get("returnPath") || "/onboarding";
        const url = await beginGithubConnection(path);
        if (!cancelled) window.location.assign(url);
      } catch {
        if (!cancelled) setError("GitHub could not be connected. Try again or return to your profile.");
      }
    };
    void connect();
    return () => { cancelled = true; };
  }, [isSessionRestored, isAuthenticated, attempt, router]);

  return <div className={styles.page}>
    {error ? <Alert title={error} type="error" action={<Button onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Try again</Button>} />
      : <p role="status">Connecting your GitHub account...</p>}
    <Button onClick={() => router.replace("/app/profile")}>Back to profile</Button>
  </div>;
};

export default GithubConnectPage;
