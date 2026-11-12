"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "antd";
import { useReviewAction } from "@/providers/review-provider";
import type { IProjectPeerReview } from "@/providers/review-provider/context";
import { toast } from "@/components/providers";
import { useJourneyStyles } from "@/components/journey/styles";

export const TeamFeedback = ({ projectId }: { projectId: string }) => {
  const [eligibility, setEligibility] = useState<IProjectPeerReview>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const { styles } = useJourneyStyles();
  const { fetchProjectPeerReviews, requestProjectPeerReview } = useReviewAction();
  const load = async () => {
    try { setEligibility(await fetchProjectPeerReviews(projectId)); setFailure(""); }
    catch { setFailure("Peer feedback availability could not be loaded."); }
  };
  useEffect(() => { void load(); }, [projectId]);
  const request = async () => {
    if (busy) return;
    setBusy(true);
    try { setEligibility(await requestProjectPeerReview(projectId)); toast.success("Feedback requested", "Your teammates can respond in Peer feedback."); }
    catch (error) { toast.error("Could not request feedback", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  };
  return <div className={styles.stack}>
    <div className={styles.row}>
      <Link className={styles.link} href={`/app/reviews/${projectId}`}>Peer feedback</Link>
      {eligibility?.canRequestPeerReview && <Button loading={busy} onClick={() => void request()}>Request peer feedback</Button>}
      {failure && <Button onClick={() => void load()}>Retry feedback availability</Button>}
    </div>
    <p className={styles.small}>{failure || eligibility?.peerReviewRequestMessage || "Peer feedback covers working together. Share a specific contribution in Work & feedback."}</p>
  </div>;
};
