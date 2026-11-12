"use client";
import Link from "next/link";
import { Suspense, type PropsWithChildren } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useJourneyStyles } from "@/components/journey/styles";

const ToolsLayout = ({ children }: PropsWithChildren) => {
  const { id } = useParams<{ id: string }>();
  const query = useSearchParams();
  const { styles } = useJourneyStyles();
  return <div className={styles.stack}>{query.has("tools") && <div className={styles.panel}>
    <Link className={styles.link} href={`/app/build/${id}`}>Back to project workspace</Link>
    <p className={styles.small}>Additional project tools. Everyday tasks, team management, and feedback are in the workspace.</p>
  </div>}{children}</div>;
};
const ProjectToolsLayout = ({ children }: PropsWithChildren) => <Suspense>{<ToolsLayout>{children}</ToolsLayout>}</Suspense>;
export default ProjectToolsLayout;
