"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Empty, Input, Spin, Typography } from "antd";
import MDEditor from "@uiw/react-md-editor";
import { toast } from "@/components/providers";
import { IProjectResource, IProjectWikiPage, useProjectAction } from "@/providers/project-provider";
import { useAppearanceState } from "@/providers/appearance-provider";
import { useStyles } from "./knowledgeStyle";

interface Props { projectId: string; canEdit: boolean; }

export const ProjectKnowledgeWorkspace = ({ projectId, canEdit }: Props) => {
  const [pages, setPages] = useState<IProjectWikiPage[]>([]);
  const [resources, setResources] = useState<IProjectResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const { styles } = useStyles();
  const { mode } = useAppearanceState();
  const actions = useProjectAction();
  const actionsRef = useRef(actions);
  const [activePageId, setActivePageId] = useState<string>();

  useEffect(() => { actionsRef.current = actions; }, [actions]);
  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    Promise.all([actionsRef.current.getProjectWikiPages(projectId), actionsRef.current.getProjectResources(projectId)])
      .then(([wikiPages, projectResources]) => {
        if (!isActive) return;
        setPages(wikiPages);
        setResources(projectResources);
        setActivePageId(wikiPages[0]?.id);
      })
      .catch(() => { if (isActive) toast.error("Workspace could not load", "Try refreshing this project."); })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [projectId]);

  const resetPageForm = () => { setEditingId(undefined); setTitle(""); setContent(""); };
  const savePage = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      const saved = await actions.saveProjectWikiPage({ projectId, id: editingId, title, contentMarkdown: content });
      setPages((current) => [...current.filter((page) => page.id !== saved.id), saved].sort((a, b) => a.title.localeCompare(b.title)));
      setActivePageId(saved.id);
      resetPageForm();
      toast.success("Wiki page saved", "Your team can now use this project note.");
    } catch { toast.error("Wiki page not saved", "Check the title and try again."); }
    finally { setIsSaving(false); }
  };
  const editPage = (page: IProjectWikiPage) => { setEditingId(page.id); setTitle(page.title); setContent(page.contentMarkdown); };
  const deletePage = async (id: string) => {
    try {
      await actions.removeProjectWikiPage(projectId, id);
      setPages((current) => current.filter((page) => page.id !== id));
      if (activePageId === id) setActivePageId(pages.find((page) => page.id !== id)?.id);
      if (editingId === id) resetPageForm();
    } catch { toast.error("Wiki page not removed", "Try again."); }
  };
  const addResource = async () => {
    if (!resourceName.trim() || !resourceUrl.trim()) return;
    try {
      const saved = await actions.addProjectResource({ projectId, name: resourceName, description: resourceDescription, url: resourceUrl });
      setResources((current) => [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setResourceName(""); setResourceDescription(""); setResourceUrl("");
      toast.success("Resource shared", "Your team can now open this link.");
    } catch { toast.error("Resource not shared", "Use a valid web link and try again."); }
  };
  const deleteResource = async (id: string) => {
    try { await actions.removeProjectResource(projectId, id); setResources((current) => current.filter((resource) => resource.id !== id)); }
    catch { toast.error("Resource not removed", "Try again."); }
  };

  const activePage = pages.find((page) => page.id === activePageId);
  if (isLoading) return <div className={styles.loading}><Spin /><Typography.Text>Loading shared notes and links…</Typography.Text></div>;

  return <div className={styles.workspace}>
    <section aria-labelledby="wiki-heading" className={styles.section}>
      <Typography.Title level={3} id="wiki-heading">Project wiki</Typography.Title>
      <Typography.Paragraph type="secondary">Keep decisions and instructions where the whole team can find them.</Typography.Paragraph>
      <div className={styles.wikiLayout}>
        <nav className={styles.pageList} aria-label="Wiki pages">
          {pages.map((page) => <div className={styles.pageItem} key={page.id}>
            <Button type={page.id === activePageId ? "primary" : "text"} onClick={() => setActivePageId(page.id)}>{page.title}</Button>
            {canEdit ? <div className={styles.rowActions}><Button size="small" onClick={() => editPage(page)}>Edit</Button><Button size="small" danger onClick={() => deletePage(page.id)}>Remove</Button></div> : null}
          </div>)}
          {!pages.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No wiki pages yet." /> : null}
        </nav>
        <div className={styles.pageContent}>
          {activePage ? <><Typography.Title level={4}>{activePage.title}</Typography.Title><MDEditor.Markdown className={styles.markdown} source={activePage.contentMarkdown || "This page is ready for your team's notes."} data-color-mode={mode} /></> : <Typography.Text type="secondary">Choose a page to read.</Typography.Text>}
        </div>
      </div>
      {canEdit ? <div className={styles.editor}>
        <Typography.Title level={4}>{editingId ? "Edit wiki page" : "Add a wiki page"}</Typography.Title>
        <Input placeholder="Page title, for example: Setup guide" maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input.TextArea placeholder="Write notes in Markdown so teammates can follow the steps." maxLength={20000} autoSize={{ minRows: 5, maxRows: 12 }} value={content} onChange={(event) => setContent(event.target.value)} />
        <div className={styles.rowActions}><Button type="primary" loading={isSaving} disabled={!title.trim()} onClick={savePage}>Save page</Button>{editingId ? <Button onClick={resetPageForm}>Cancel</Button> : null}</div>
      </div> : null}
    </section>

    <section aria-labelledby="resources-heading" className={styles.section}>
      <Typography.Title level={3} id="resources-heading">Shared resources</Typography.Title>
      <Typography.Paragraph type="secondary">Keep the links your team needs together: design files, guides, datasets, and more.</Typography.Paragraph>
      {resources.length ? <ul className={styles.resourceList}>{resources.map((resource) => <li className={styles.resource} key={resource.id}>
        <div><a href={resource.url} target="_blank" rel="noreferrer">{resource.name}</a>{resource.description ? <p>{resource.description}</p> : null}</div>
        {canEdit ? <Button danger type="text" onClick={() => deleteResource(resource.id)}>Remove</Button> : null}
      </li>)}</ul> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No shared links yet." />}
      {canEdit ? <div className={styles.editor}>
        <Typography.Title level={4}>Share a resource link</Typography.Title>
        <Input placeholder="Resource name, for example: Figma design" maxLength={160} value={resourceName} onChange={(event) => setResourceName(event.target.value)} />
        <Input placeholder="https://example.com/team-resource" type="url" maxLength={2048} value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} />
        <Input.TextArea placeholder="What will the team find here? (optional)" maxLength={1200} autoSize={{ minRows: 2, maxRows: 5 }} value={resourceDescription} onChange={(event) => setResourceDescription(event.target.value)} />
        <Button type="primary" disabled={!resourceName.trim() || !resourceUrl.trim()} onClick={addResource}>Add resource</Button>
      </div> : null}
    </section>
  </div>;
};
