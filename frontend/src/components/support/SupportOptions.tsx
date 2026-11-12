"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Alert, Button } from "antd";
import { useSupportAction, useSupportState } from "@/providers/support-provider";
import { useStyles } from "./styles";

export const SupportOptions = ({ onOpened, onNavigate }: {
  onOpened?: () => void;
  onNavigate?: () => void;
}) => {
  const { styles } = useStyles();
  const pathname = usePathname();
  const { openSupport } = useSupportAction();
  const { isPending, error } = useSupportState();
  return <div className={styles.options}>
    <p>Report a problem or ask us a question. Leave your email so we can reply.</p>
    {error ? <Alert type="warning" showIcon title={error} role="alert" /> : null}
    <Button type="primary" loading={isPending} onClick={async () => {
      if (await openSupport()) onOpened?.();
    }}>Contact support</Button>
    <p>Opens tawk.to. Your message goes to our support team.</p>
    <Link href={pathname?.startsWith("/app") ? "/app/how-to" : "/how-to"} onClick={onNavigate}>
      Read the getting started guide
    </Link>
  </div>;
};
