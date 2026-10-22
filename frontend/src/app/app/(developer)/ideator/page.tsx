"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Checkbox, Empty, Input, Modal, Spin, Typography } from "antd";
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
  const { styles } = useStyles();
  const { ideas, isPending, isError } = useIdeatorState();
  const { fetchFeed, createIdea, react, comment, convert, deleteIdea } = useIdeatorAction();
  const fetchFeedRef = useRef(fetchFeed);

  useEffect(() => { fetchFeedRef.current = fetchFeed; }, [fetchFeed]);
  useEffect(() => { fetchFeedRef.current().catch(() => toast.error("Could not load ideas", "Please try again.")); }, []);

  const submitIdea = async () => {
    try {
      await createIdea({ title, problemStatement: problem, proposedSolution: solution, isPublic });
      setTitle(""); setProblem(""); setSolution(""); setIsPublic(true);
      toast.success("Idea shared", "People can now discuss and show interest.");
    } catch { toast.error("Could not share idea", "Check your connection and try again."); }
  };
  const sendComment = async (ideaId: string) => {
    const body = commentDrafts[ideaId]?.trim();
    if (!body) return;
    try { await comment(ideaId, body); setCommentDrafts((drafts) => ({ ...drafts, [ideaId]: "" })); }
    catch { toast.error("Comment not sent", "Please try again."); }
  };
  const submitConversion = async () => {
    if (!converting) return;
    try { await convert(converting.id, inviteInterested); toast.success("Project created", "Interested people received invitations to join."); setConverting(undefined); }
    catch { toast.error("Could not start project", "Please try again."); }
  };
  const handleReaction = async (idea: IIdeaPost, type: IdeaReaction) => {
    try { await react(idea.id, type); } catch { toast.error("Reaction not saved", "Please try again."); }
  };

  return <main className={styles.page}>
    <header className={styles.heading}>
      <Typography.Title level={1}>Ideator</Typography.Title>
      <Typography.Paragraph type="secondary">Share a problem. Shape a solution together. Start a project when you are ready.</Typography.Paragraph>
    </header>
    <section className={styles.composer} aria-labelledby="share-idea-title">
      <Typography.Title id="share-idea-title" level={3}>What should we solve?</Typography.Title>
      <Input aria-label="Idea title" placeholder="Give your idea a short title" maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} />
      <Input.TextArea aria-label="Problem statement" placeholder="Who has this problem, and what makes it difficult?" maxLength={4000} autoSize={{ minRows: 3, maxRows: 7 }} value={problem} onChange={(event) => setProblem(event.target.value)} />
      <Input.TextArea aria-label="Proposed solution" placeholder="What could make this problem easier to solve?" maxLength={4000} autoSize={{ minRows: 3, maxRows: 7 }} value={solution} onChange={(event) => setSolution(event.target.value)} />
      <Checkbox checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)}>Share this idea publicly</Checkbox>
      <div className={styles.formActions}><Button type="primary" disabled={!title.trim() || !problem.trim() || !solution.trim()} onClick={submitIdea}>Share idea</Button></div>
    </section>
    {isPending && !ideas.length ? <Spin aria-label="Loading ideas" /> : null}
    {isError && !ideas.length ? <Typography.Text type="danger">Ideas could not be loaded. Refresh the page to try again.</Typography.Text> : null}
    {!isPending && !ideas.length ? <Empty description="No ideas yet. Be the first to share one." /> : null}
    <section className={styles.feed} aria-label="Community ideas">
      {ideas.map((idea) => <article className={styles.post} key={idea.id}>
        <div className={styles.meta}><span>{idea.creatorName}</span><span>·</span><time dateTime={idea.createdAt}>{new Date(idea.createdAt).toLocaleDateString()}</time>{!idea.isPublic ? <span>· Only you can see this idea</span> : null}</div>
        <Typography.Title level={3} className={styles.title}>{idea.title}</Typography.Title>
        <div><Typography.Text strong>Problem</Typography.Text><p className={styles.statement}>{idea.problemStatement}</p></div>
        <div><Typography.Text strong>Possible solution</Typography.Text><p>{idea.proposedSolution}</p></div>
        <div className={styles.actions} aria-label={`Reactions for ${idea.title}`}>
          <Button aria-pressed={idea.myReaction === "Interested"} onClick={() => handleReaction(idea, "Interested")}>Interested · {idea.interestedCount}</Button>
          <Button aria-pressed={idea.myReaction === "Like"} onClick={() => handleReaction(idea, "Like")}>Like · {idea.likeCount}</Button>
          <Button aria-pressed={idea.myReaction === "Dislike"} onClick={() => handleReaction(idea, "Dislike")}>Dislike · {idea.dislikeCount}</Button>
          {idea.isOwner && !idea.isConverted ? <Button type="primary" onClick={() => { setInviteInterested(true); setConverting(idea); }}>Start a project</Button> : null}
          {idea.isConverted ? <Typography.Text type="secondary">Project started</Typography.Text> : null}
          {idea.isOwner && !idea.isConverted ? <Button danger type="text" onClick={() => deleteIdea(idea.id).catch(() => toast.error("Could not remove idea", "Please try again."))}>Remove</Button> : null}
        </div>
        {idea.comments.length ? <div className={styles.comments} aria-label="Comments">{idea.comments.map((entry) => <div className={styles.comment} key={entry.id}><Typography.Text strong>{entry.authorName}:</Typography.Text><Typography.Text>{entry.body}</Typography.Text></div>)}</div> : null}
        <div className={styles.actions}><Input aria-label={`Comment on ${idea.title}`} placeholder="Suggest a helpful improvement" maxLength={2000} value={commentDrafts[idea.id] ?? ""} onChange={(event) => setCommentDrafts((drafts) => ({ ...drafts, [idea.id]: event.target.value }))} onPressEnter={() => sendComment(idea.id)} /><Button onClick={() => sendComment(idea.id)}>Comment</Button></div>
      </article>)}
    </section>
    <Modal title="Start a project from this idea?" open={Boolean(converting)} onCancel={() => setConverting(undefined)} onOk={submitConversion} okText="Create project">
      <Typography.Paragraph>The problem and solution will become the project brief. People are only invited; they must accept before joining.</Typography.Paragraph>
      <Checkbox checked={inviteInterested} onChange={(event) => setInviteInterested(event.target.checked)}>Invite people who marked “Interested”</Checkbox>
    </Modal>
  </main>;
};
export default IdeatorPage;
