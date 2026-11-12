"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Button, Checkbox, Collapse, Empty, Input, Modal, Spin, Typography } from "antd";
import { useJourneyStyles } from "@/components/journey/styles";
import { toast } from "@/components/providers";
import { useIdeatorAction, useIdeatorState } from "@/providers/ideator-provider";
import { IIdeaPost, IdeaReaction } from "@/providers/ideator-provider/context";
import { useStyles } from "./style";

const IdeatorPage = () => {
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [converting, setConverting] = useState<IIdeaPost>();
  const [inviteInterested, setInviteInterested] = useState(true);
  const [pendingAction, setPendingAction] = useState<string>();
  const [hasLoaded, setHasLoaded] = useState(false);
  const actionInFlight = useRef(false);
  const { styles } = useStyles();
  const { styles: ui } = useJourneyStyles();
  const { ideas, isPending, isError } = useIdeatorState();
  const { fetchFeed, createIdea, react, comment, convert, deleteIdea } = useIdeatorAction();
  const fetchFeedRef = useRef(fetchFeed);

  useEffect(() => { fetchFeedRef.current = fetchFeed; }, [fetchFeed]);
  const reloadFeed = async () => {
    try { await fetchFeedRef.current(); }
    catch { toast.error("Could not load ideas", "Your ideas are kept. Try loading them again."); }
    finally { setHasLoaded(true); }
  };
  useEffect(() => { void reloadFeed(); }, []);
  const startAction = (name: string) => {
    if (actionInFlight.current) return false;
    actionInFlight.current = true;
    setPendingAction(name);
    return true;
  };
  const finishAction = () => { actionInFlight.current = false; setPendingAction(undefined); };

  const submitIdea = async () => {
    if (!startAction("share")) return;
    try {
      await createIdea({ title, problemStatement: problem, proposedSolution: solution, isPublic });
      setTitle(""); setProblem(""); setSolution(""); setIsPublic(true);
      toast.success("Idea saved", isPublic ? "People can now discuss and show interest." : "Your private idea is visible only to you.");
    } catch { toast.error("Could not share idea", "Your draft is kept. Check your connection and try again."); }
    finally { finishAction(); }
  };
  const sendComment = async (ideaId: string) => {
    const body = commentDrafts[ideaId]?.trim();
    if (!body || !startAction(`comment:${ideaId}`)) return;
    try { await comment(ideaId, body); setCommentDrafts((drafts) => ({ ...drafts, [ideaId]: "" })); }
    catch { toast.error("Comment not sent", "Your draft is kept. Please try again."); }
    finally { finishAction(); }
  };
  const submitConversion = async () => {
    if (!converting || !startAction("convert")) return;
    try { await convert(converting.id, inviteInterested); toast.success("Project created", inviteInterested ? "Your workspace is ready. Invitations were sent to eligible interested developers." : "Your private workspace is ready. Open it from the idea below."); setConverting(undefined); }
    catch { toast.error("Could not start project", "Please try again."); }
    finally { finishAction(); }
  };
  const handleReaction = async (idea: IIdeaPost, type: IdeaReaction) => {
    if (!startAction(`react:${idea.id}:${type}`)) return;
    try { await react(idea.id, type); } catch { toast.error("Reaction not saved", "Please try again."); }
    finally { finishAction(); }
  };

  const removeIdea = async (ideaId: string) => {
    if (!startAction(`remove:${ideaId}`)) return;
    try { await deleteIdea(ideaId); } catch { toast.error("Could not remove idea", "Please try again."); }
    finally { finishAction(); }
  };
  const busy = isPending || Boolean(pendingAction);

  return <main className={styles.page}>
    <header className={styles.heading}>
      <h1 className={ui.title}>Ideas</h1>
      <Typography.Paragraph type="secondary">Post a problem or product idea, discuss it with other developers, and turn it into a project when you’re ready.</Typography.Paragraph>
    </header>
    <Collapse items={[{key:"share",label:"Post an idea",children:<section className={styles.composer} aria-labelledby="share-idea-title">
      <Typography.Title id="share-idea-title" level={3}>New idea</Typography.Title>
      <Input aria-label="Idea title" placeholder="Give your idea a short title" maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} />
      <Input.TextArea aria-label="Problem statement" placeholder="Who has this problem, and what makes it difficult?" maxLength={4000} autoSize={{ minRows: 3, maxRows: 7 }} value={problem} onChange={(event) => setProblem(event.target.value)} />
      <Input.TextArea aria-label="Proposed solution" placeholder="What could make this problem easier to solve?" maxLength={4000} autoSize={{ minRows: 3, maxRows: 7 }} value={solution} onChange={(event) => setSolution(event.target.value)} />
      <Checkbox checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)}>Share this idea publicly</Checkbox>
      <div className={styles.formActions}><Button type="primary" aria-label="Post idea" loading={pendingAction === "share"} disabled={busy || !title.trim() || !problem.trim() || !solution.trim()} onClick={submitIdea}>Post idea</Button></div>
    </section>}]}/>
    {(!hasLoaded || isPending) && !ideas.length ? <Spin aria-label="Loading ideas" /> : null}
    {isError ? <Alert type="error" showIcon title="Ideas could not be refreshed"
      description="Your draft and any confirmed changes are kept. Try loading the feed again."
      action={<Button disabled={busy} onClick={() => void reloadFeed()}>Try again</Button>} /> : null}
    {hasLoaded && !isPending && !isError && !ideas.length ? <Empty description="No ideas yet. Share a problem above to find people who want to help solve it." /> : null}
    <section className={styles.feed} aria-label="Community ideas">
      {ideas.map((idea) => <article className={styles.post} key={idea.id}>
        <div className={styles.meta}><span>{idea.creatorName}</span><span>·</span><time dateTime={idea.createdAt}>{new Date(idea.createdAt).toLocaleDateString()}</time>{!idea.isPublic ? <span>· Only you can see this idea</span> : null}</div>
        <Typography.Title level={3} className={styles.title}>{idea.title}</Typography.Title>
        <div><Typography.Text strong>Problem</Typography.Text><p className={styles.statement}>{idea.problemStatement}</p></div>
        <div><Typography.Text strong>Possible solution</Typography.Text><p>{idea.proposedSolution}</p></div>
        <div className={styles.actions} aria-label={`Reactions for ${idea.title}`}>
          <Button disabled={busy} aria-pressed={idea.myReaction === "Interested"} onClick={() => handleReaction(idea, "Interested")}>Interested · {idea.interestedCount}</Button>
          <Button disabled={busy} aria-pressed={idea.myReaction === "Like"} onClick={() => handleReaction(idea, "Like")}>Like · {idea.likeCount}</Button>
          <Button disabled={busy} aria-pressed={idea.myReaction === "Dislike"} onClick={() => handleReaction(idea, "Dislike")}>Dislike · {idea.dislikeCount}</Button>
          {idea.isOwner && !idea.isConverted ? <Button type="primary" disabled={busy} onClick={() => { setInviteInterested(true); setConverting(idea); }}>Start a project</Button> : null}
          {idea.isConverted ? <Typography.Text type="secondary">Project started</Typography.Text> : null}
          {idea.convertedProjectId ? <Link href={`/app/build/${idea.convertedProjectId}`}>View project</Link> : null}
          {idea.isOwner && !idea.isConverted ? <Button danger type="text" disabled={busy} onClick={() => void removeIdea(idea.id)}>Remove</Button> : null}
        </div>
        {idea.comments.length ? <div className={styles.comments} aria-label="Comments">{idea.comments.map((entry) => <div className={styles.comment} key={entry.id}><Typography.Text strong>{entry.authorName}:</Typography.Text><Typography.Text>{entry.body}</Typography.Text></div>)}</div> : null}
        <div className={styles.actions}><Input aria-label={`Comment on ${idea.title}`} placeholder="Suggest a helpful improvement" maxLength={2000} value={commentDrafts[idea.id] ?? ""} onChange={(event) => setCommentDrafts((drafts) => ({ ...drafts, [idea.id]: event.target.value }))} onPressEnter={() => sendComment(idea.id)} /><Button disabled={busy || !commentDrafts[idea.id]?.trim()} loading={pendingAction === `comment:${idea.id}`} onClick={() => sendComment(idea.id)}>Comment</Button></div>
      </article>)}
    </section>
    <Modal title="Start a project from this idea?" open={Boolean(converting)} onCancel={() => { if (!busy) setConverting(undefined); }} onOk={submitConversion} confirmLoading={pendingAction === "convert"} okButtonProps={{ disabled: busy }} cancelButtonProps={{ disabled: busy }} closable={!busy} mask={{ closable: !busy }} okText="Create project">
      <Typography.Paragraph>The problem and solution will become the project brief. People are only invited; they must accept before joining.</Typography.Paragraph>
      <Checkbox checked={inviteInterested} onChange={(event) => setInviteInterested(event.target.checked)}>Invite people who marked “Interested”</Checkbox>
    </Modal>
  </main>;
};
export default IdeatorPage;
