"use client";

import { useEffect, useState } from "react";
import { Button, Card, Empty, Input, Space, Tag, Typography } from "antd";
import { toast } from "@/components/providers";
import { useProjectProgressAction, useProjectProgressState } from "@/providers/project-progress-provider";
import { useStyles } from "./styles";

interface ProjectProgressProps {
  projectId: string;
  developerId?: string;
  canReview: boolean;
}

const ProjectProgress = ({ projectId, developerId, canReview }: ProjectProgressProps) => {
  const { styles } = useStyles();
  const { entries, isPending } = useProjectProgressState();
  const { fetchProjectEntries, createEntry, reviewEntry } = useProjectProgressAction();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [selfReview, setSelfReview] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { void fetchProjectEntries(projectId).catch((error) => toast.error("Work evidence unavailable", error.message)); }, [fetchProjectEntries, projectId]);

  const submitEntry = async () => {
    setSaving(true);
    try {
      await createEntry({ projectId, title, summary, evidenceUrl, selfReview });
      setTitle(""); setSummary(""); setEvidenceUrl(""); setSelfReview("");
      toast.success("Progress saved", "Your work and reflection are now available to your project team.");
    } catch (error) { toast.error("Could not save progress", error instanceof Error ? error.message : "Try again."); }
    finally { setSaving(false); }
  };

  const submitReview = async (entryId: string) => {
    setSaving(true);
    try { await reviewEntry(entryId, comments[entryId] ?? ""); setComments((value) => ({ ...value, [entryId]: "" })); toast.success("Feedback saved", "Your teammate can now see your feedback."); }
    catch (error) { toast.error("Could not save feedback", error instanceof Error ? error.message : "Try again."); }
    finally { setSaving(false); }
  };

  return <div className={styles.layout}>
    <Card title="Document your work" loading={isPending && entries.length === 0}>
      <Space direction="vertical" className={styles.form}>
        <Input aria-label="Work title" placeholder="What did you work on?" maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input.TextArea aria-label="Work summary" placeholder="Describe the contribution and its impact" rows={3} maxLength={3000} value={summary} onChange={(event) => setSummary(event.target.value)} />
        <Input aria-label="Evidence link" placeholder="Link to a pull request, demo, or artifact" type="url" maxLength={2048} value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} />
        <Input.TextArea aria-label="Self review" placeholder="What went well, and what would you improve?" rows={3} maxLength={2000} value={selfReview} onChange={(event) => setSelfReview(event.target.value)} />
        <Button type="primary" loading={saving} disabled={!title.trim() || !summary.trim() || !evidenceUrl.trim() || !selfReview.trim()} onClick={() => void submitEntry()}>Save progress</Button>
      </Space>
    </Card>
    <section className={styles.entries} aria-label="Project work evidence">
      <Typography.Title level={4}>Team progress</Typography.Title>
      {entries.length === 0 ? <Empty description="No progress documented yet." /> : entries.map((entry) => {
        const ownEntry = entry.developerId === developerId;
        const myReview = entry.reviews.find((review) => review.reviewerDeveloperId === developerId);
        return <Card key={entry.id} title={<div className={styles.entryTitle}><span>{entry.title}</span><Typography.Text type="secondary">{entry.authorName}</Typography.Text></div>}>
          <Space direction="vertical" className={styles.form}>
            <Typography.Paragraph>{entry.summary}</Typography.Paragraph>
            <Typography.Link href={entry.evidenceUrl} target="_blank" rel="noreferrer">Open work evidence</Typography.Link>
            <Typography.Text strong>Self reflection</Typography.Text>
            <Typography.Paragraph>{entry.selfReview}</Typography.Paragraph>
            {entry.reviews.map((review) => <div className={styles.review} key={review.id}><Tag color={review.reviewerRole === "mentor" ? "purple" : "blue"}>{review.reviewerRole}</Tag><Typography.Text strong>{review.reviewerName}</Typography.Text><Typography.Paragraph>{review.comment}</Typography.Paragraph></div>)}
            {canReview && !ownEntry ? <div className={styles.reviewForm}><Input.TextArea aria-label={`Feedback for ${entry.authorName}`} placeholder="Share constructive feedback" rows={2} maxLength={2000} value={comments[entry.id] ?? (myReview?.comment ?? "")} onChange={(event) => setComments((value) => ({ ...value, [entry.id]: event.target.value }))} /><Button loading={saving} onClick={() => void submitReview(entry.id)}>{myReview ? "Update feedback" : "Leave feedback"}</Button></div> : null}
          </Space>
        </Card>;
      })}
    </section>
  </div>;
};

export default ProjectProgress;
