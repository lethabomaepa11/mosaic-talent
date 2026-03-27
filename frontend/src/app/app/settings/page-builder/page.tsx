"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Input, Select, Spin, Switch, Typography, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { toast } from "@/components/providers";
import { useJobAction, useJobState } from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { uploadPublicFile } from "@/utils/fileUpload";
import { useStyles } from "./style";

type BlockType = "hero" | "image" | "button" | "form" | "text" | "job-list";
type FieldType = "text" | "textarea" | "email" | "number";
type ViewMode = "edit" | "preview";
type DragPayload = { kind: "palette-block"; type: BlockType } | { kind: "existing-block"; id: string } | { kind: "palette-field"; fieldType: FieldType };

interface IBlock {
  id: string;
  type: BlockType;
  props: Record<string, string>;
}

interface IFormField {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
}

const dragType = "application/x-mosaic-builder";
const blockPalette: Array<{ type: BlockType; label: string }> = [
  { type: "hero", label: "Hero" },
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
  { type: "button", label: "Button" },
  { type: "form", label: "Form" },
  { type: "job-list", label: "Job List" },
];
const fieldPalette: Array<{ type: FieldType; label: string }> = [
  { type: "text", label: "Text Field" },
  { type: "email", label: "Email Field" },
  { type: "number", label: "Number Field" },
  { type: "textarea", label: "Textarea" },
];

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const parseBlocks = (layoutJson?: string): IBlock[] => {
  const fallback = [
    {
      id: "hero-1",
      type: "hero",
      props: {
        title: "Ready to become a team member?",
        subtitle: "Welcome to our recruitment platform. Explore opportunities and apply with confidence.",
      },
    },
    {
      id: "text-1",
      type: "text",
      props: {
        content: "We are excited to have you explore our career opportunities.\nOur platform connects you directly with our Human Capital team.",
      },
    },
    {
      id: "jobs-1",
      type: "job-list",
      props: {
        title: "Our Openings",
        subtitle: "Open positions",
        showCount: "true",
        label: "Apply",
      },
    },
    {
      id: "form-1",
      type: "form",
      props: {
        title: "Submit your application",
        subtitle: "Even if no role fits yet, you can still submit your profile.",
      },
    },
    {
      id: "cta-1",
      type: "cta",
      props: {
        title: "Keep in touch",
        subtitle: "Met us at a career fair? Share your details and stay connected.",
      },
    },
  ] as IBlock[];
  if (!layoutJson) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(layoutJson) as { blocks?: IBlock[]; components?: string[] };
    if (Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
      return parsed.blocks.map((block, index) => ({ ...block, id: block.id || `block-${index}` }));
    }
    if (Array.isArray(parsed.components) && parsed.components.length > 0) {
      return parsed.components.map((type, index) => ({ id: `${type}-${index}`, type: type as BlockType, props: {} }));
    }
  } catch {
    return fallback;
  }
  return fallback;
};

const parseFormFields = (json?: string): IFormField[] => {
  if (!json) {
    return [];
  }
  try {
    const parsed = JSON.parse(json) as { fields?: Array<Partial<IFormField>> };
    if (!Array.isArray(parsed.fields)) {
      return [];
    }
    return parsed.fields.map((field, index) => ({
      id: String(field.id || `field-${index}`),
      key: String(field.key || `field_${index}`),
      label: String(field.label || `Field ${index + 1}`),
      type: (field.type as FieldType) || "text",
      required: Boolean(field.required),
      placeholder: field.placeholder || "",
    }));
  } catch {
    return [];
  }
};


const readDragPayload = (event: React.DragEvent): DragPayload | null => {
  const raw = event.dataTransfer.getData(dragType);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
};

const PageBuilder = () => {
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);
  const { publicJobsPage, isPending } = useJobState();
  const { getMyJobsPageSettings, updateMyJobsPageSettings, generateMyJobsPageSettingsWithAi } = useJobAction();

  const [mode, setMode] = useState<ViewMode>("edit");
  const [blocks, setBlocks] = useState<IBlock[]>([]);
  const [formFields, setFormFields] = useState<IFormField[]>([]);
  const [themeColor, setThemeColor] = useState("#D4AF37");
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (isCompanyTenant) {
      void getMyJobsPageSettings();
    }
  }, [isCompanyTenant]);

  useEffect(() => {
    if (!publicJobsPage) {
      return;
    }
    setBlocks(parseBlocks(publicJobsPage.layoutJson));
    setFormFields(parseFormFields(publicJobsPage.applicationFormJson));
    setThemeColor(publicJobsPage.primaryColor || "#D4AF37");
  }, [publicJobsPage]);

  const selectedBlock = useMemo(() => blocks.find((block) => block.id === selectedId), [blocks, selectedId]);
  const hasFormBlock = useMemo(() => blocks.some((block) => block.type === "form"), [blocks]);

  const addBlock = (type: BlockType) => {
    const id = makeId(type);
    const defaults: Record<string, string> = {};
    if (type === "button") {
      defaults.label = "Apply now";
      defaults.backgroundColor = themeColor;
      defaults.textColor = "#121212";
    }
    if (type === "hero") {
      defaults.title = publicJobsPage?.heroTitle || "Build your career with us";
      defaults.subtitle = publicJobsPage?.heroSubtitle || "Apply to open roles and show your strengths.";
      defaults.imageUrl = publicJobsPage?.heroImageUrl || "";
    }
    if (type === "text") {
      defaults.content = "Write your section content here.";
    }
    if (type === "job-list") {
      defaults.title = "Our Openings";
      defaults.subtitle = "Open positions";
      defaults.showCount = "true";
      defaults.label = "Apply";
      defaults.backgroundColor = themeColor;
      defaults.textColor = "#121212";
    }
    if (type === "form") {
      defaults.title = "Submit your application";
      defaults.subtitle = "Share your details and we will reach out if there is a fit.";
      defaults.linkText = "Keep in touch";
      defaults.url = "";
    }
    setBlocks((prev) => [...prev, { id, type, props: defaults }]);
    setSelectedId(id);
  };

  const addFormField = (fieldType: FieldType) => {
    setFormFields((prev) => [
      ...prev,
      {
        id: makeId("field"),
        key: `field_${prev.length + 1}`,
        label: "New Field",
        type: fieldType,
        required: false,
        placeholder: "",
      },
    ]);
  };

  const updateSelectedBlockProps = (patch: Record<string, string>) => {
    setBlocks((prev) => prev.map((block) => (block.id === selectedId ? { ...block, props: { ...block.props, ...patch } } : block)));
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    if (selectedId === id) {
      setSelectedId("");
    }
  };

  const reorderBlocks = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }
    setBlocks((prev) => {
      const sourceIndex = prev.findIndex((block) => block.id === sourceId);
      const targetIndex = prev.findIndex((block) => block.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const onDropCanvas = (event: React.DragEvent) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload) {
      return;
    }
    if (payload.kind === "palette-block") {
      addBlock(payload.type);
    }
  };

  const onDropBlock = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload) {
      return;
    }
    if (payload.kind === "existing-block") {
      reorderBlocks(payload.id, targetId);
      return;
    }
    if (payload.kind === "palette-block") {
      const newId = makeId(payload.type);
      setBlocks((prev) => {
        const targetIndex = prev.findIndex((block) => block.id === targetId);
        const next = [...prev];
        next.splice(targetIndex < 0 ? next.length : targetIndex, 0, { id: newId, type: payload.type, props: {} });
        return next;
      });
      setSelectedId(newId);
    }
  };

  const onDropFormField = (event: React.DragEvent) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload || payload.kind !== "palette-field") {
      return;
    }
    addFormField(payload.fieldType);
  };

  const saveBuilder = async () => {
    setSaving(true);
    try {
      const hero = blocks.find((block) => block.type === "hero");
      await updateMyJobsPageSettings({
        heroTitle: hero?.props.title || publicJobsPage?.heroTitle || "Build your career with us",
        heroSubtitle: hero?.props.subtitle || publicJobsPage?.heroSubtitle || "Apply to open roles and show your strengths.",
        heroImageUrl: hero?.props.imageUrl || publicJobsPage?.heroImageUrl || "",
        primaryColor: themeColor,
        layoutJson: JSON.stringify({ blocks }),
        applicationFormJson: JSON.stringify({ fields: formFields }),
        emailTemplateSettingsJson: publicJobsPage?.emailTemplateSettingsJson || "",
      });
      toast.success("Published", "Your page builder changes are live.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to publish.";
      toast.error("Publish failed", message);
    } finally {
      setSaving(false);
    }
  };

  const aiAssist = async () => {
    if (!chatPrompt.trim()) {
      return;
    }
    setAiLoading(true);
    setChatMessages((prev) => [...prev, `You: ${chatPrompt}`]);
    try {
      await generateMyJobsPageSettingsWithAi(chatPrompt.trim());
      await getMyJobsPageSettings();
      setChatMessages((prev) => [...prev, "AI: Updated the builder configuration."]);
      setChatPrompt("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI generation failed.";
      setChatMessages((prev) => [...prev, `AI: ${message}`]);
    } finally {
      setAiLoading(false);
    }
  };

  if (!isCompanyTenant) {
    return <Empty description="Page Builder is available in company workspaces only." />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Typography.Title level={2} className={styles.title}>Jobs Page Builder</Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            Drag components into the editor and style everything visually.
          </Typography.Paragraph>
        </div>
        <div className={styles.actionRow}>
          <Typography.Text>Preview</Typography.Text>
          <Switch checked={mode === "preview"} onChange={(checked) => setMode(checked ? "preview" : "edit")} />
          <Button type="primary" loading={saving} onClick={() => void saveBuilder()}>Publish</Button>
        </div>
      </div>

      {(isPending && !publicJobsPage) ? <Spin /> : null}

      <div className={styles.layout}>
        <aside className={styles.panel}>
          <Typography.Text strong>Values</Typography.Text>
          <Typography.Text className={styles.helperText}>Primary Color</Typography.Text>
          <Input type="color" value={themeColor} onChange={(event) => setThemeColor(event.target.value)} />

          {selectedBlock ? (
            <>
              <Typography.Text className={styles.helperText}>Selected Component</Typography.Text>
              <Input value={selectedBlock.type} readOnly />

              <Typography.Text className={styles.helperText}>Title / Label</Typography.Text>
              <Input value={selectedBlock.props.title || selectedBlock.props.label || ""} onChange={(e) => updateSelectedBlockProps({ title: e.target.value, label: e.target.value })} />

              <Typography.Text className={styles.helperText}>Subtitle / Content</Typography.Text>
              <Input.TextArea rows={3} value={selectedBlock.props.subtitle || selectedBlock.props.content || ""} onChange={(e) => updateSelectedBlockProps({ subtitle: e.target.value, content: e.target.value })} />

              <Typography.Text className={styles.helperText}>Link URL</Typography.Text>
              <Input value={selectedBlock.props.url || ""} onChange={(e) => updateSelectedBlockProps({ url: e.target.value })} />

              <Typography.Text className={styles.helperText}>Link Text</Typography.Text>
              <Input value={selectedBlock.props.linkText || ""} onChange={(e) => updateSelectedBlockProps({ linkText: e.target.value })} />

              <Typography.Text className={styles.helperText}>Image URL</Typography.Text>
              <Input value={selectedBlock.props.imageUrl || ""} onChange={(e) => updateSelectedBlockProps({ imageUrl: e.target.value })} />

              <Typography.Text className={styles.helperText}>Background Color</Typography.Text>
              <Input type="color" value={selectedBlock.props.backgroundColor || themeColor} onChange={(e) => updateSelectedBlockProps({ backgroundColor: e.target.value })} />

              <Typography.Text className={styles.helperText}>Text Color</Typography.Text>
              <Input type="color" value={selectedBlock.props.textColor || "#121212"} onChange={(e) => updateSelectedBlockProps({ textColor: e.target.value })} />

              <Upload
                maxCount={1}
                showUploadList={false}
                customRequest={async ({ file, onSuccess, onError }) => {
                  try {
                    const uploaded = await uploadPublicFile(file as File, "jobs-page");
                    updateSelectedBlockProps({ imageUrl: uploaded.url });
                    onSuccess?.(uploaded);
                  } catch (error) {
                    onError?.(error as Error);
                  }
                }}
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </>
          ) : (
            <Typography.Text className={styles.helperText}>Select a component from the editor.</Typography.Text>
          )}

          <div className={styles.aiChat}>
            {chatMessages.map((message, index) => (
              <div key={index} className={styles.aiBubble}>{message}</div>
            ))}
          </div>
          <Input.TextArea rows={3} value={chatPrompt} onChange={(e) => setChatPrompt(e.target.value)} placeholder="Ask AI to build/update this page..." />
          <Button loading={aiLoading} onClick={() => void aiAssist()}>Ask AI Builder</Button>
        </aside>

        <main className={`${styles.canvas} ${mode === "preview" ? styles.canvasPreview : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={onDropCanvas}>
          <div className={styles.canvasDropHint}>Drop components here</div>
          {blocks.map((block) => (
            <section
              key={block.id}
              className={`${styles.block} ${selectedId === block.id ? styles.blockActive : ""}`}
              onClick={() => setSelectedId(block.id)}
              draggable={mode === "edit"}
              onDragStart={(event) => {
                event.dataTransfer.setData(dragType, JSON.stringify({ kind: "existing-block", id: block.id } as DragPayload));
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDropBlock(event, block.id)}
            >
              <div className={styles.blockRow}>
                <Typography.Text strong>{block.type}</Typography.Text>
                {mode === "edit" ? <Button size="small" onClick={() => removeBlock(block.id)}>Remove</Button> : null}
              </div>

              {block.type === "hero" ? (
                <div className={styles.heroPreview}>
                  {block.props.imageUrl ? <img src={block.props.imageUrl} alt="Hero preview" className={styles.heroImage} /> : null}
                  <Typography.Title level={3}>{block.props.title || "Hero Title"}</Typography.Title>
                  <Typography.Paragraph>{block.props.subtitle || "Hero subtitle"}</Typography.Paragraph>
                </div>
              ) : null}

              {block.type === "job-list" ? (
                <div className={styles.jobListDemo}>
                  <div className={styles.jobCardDemo}>
                    <Typography.Text strong>Frontend Engineer</Typography.Text>
                    <Typography.Text className={styles.helperText}>Remote · Full-time</Typography.Text>
                    <button className={styles.customButton} style={{ backgroundColor: themeColor, color: "#121212" }} type="button">Apply</button>
                  </div>
                  <div className={styles.jobCardDemo}>
                    <Typography.Text strong>Backend Engineer</Typography.Text>
                    <Typography.Text className={styles.helperText}>Cape Town · Contract</Typography.Text>
                    <button className={styles.customButton} style={{ backgroundColor: themeColor, color: "#121212" }} type="button">Apply</button>
                  </div>
                </div>
              ) : null}

              {block.type === "image" ? (
                block.props.imageUrl ? <img src={block.props.imageUrl} alt="Image block" className={styles.heroImage} /> : <Typography.Text className={styles.helperText}>Add an image URL or upload one.</Typography.Text>
              ) : null}

              {block.type === "button" ? (
                <button className={styles.customButton} style={{ backgroundColor: block.props.backgroundColor || themeColor, color: block.props.textColor || "#121212" }} type="button">
                  {block.props.label || "Button"}
                </button>
              ) : null}

              {block.type === "text" ? <Typography.Paragraph>{block.props.content || "Text content"}</Typography.Paragraph> : null}

              {block.type === "form" ? (
                <div className={styles.formDropZone} onDragOver={(event) => event.preventDefault()} onDrop={onDropFormField}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {block.props.title || "Submit your application"}
                  </Typography.Title>
                  <Typography.Paragraph className={styles.helperText} style={{ margin: 0 }}>
                    {block.props.subtitle || "Share your details and we will reach out if there is a fit."}
                  </Typography.Paragraph>
                  {block.props.url ? (
                    <Typography.Link href={block.props.url} target="_blank" rel="noreferrer">
                      {block.props.linkText || "Open external link"}
                    </Typography.Link>
                  ) : null}
                  <Typography.Text className={styles.helperText}>
                    Drag a field type here to add to this form.
                  </Typography.Text>
                  {formFields.length === 0 ? (
                    <Typography.Text className={styles.helperText}>No form fields yet.</Typography.Text>
                  ) : (
                    <div className={styles.formFieldsPreview}>
                      {formFields.map((field) => (
                        <div key={field.id} className={styles.formFieldPreview}>
                          <Typography.Text className={styles.formFieldLabel}>
                            {field.label}
                            {field.required ? " *" : ""}
                          </Typography.Text>
                          {field.type === "textarea" ? (
                            <Input.TextArea
                              rows={3}
                              disabled
                              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            />
                          ) : (
                            <Input
                              type={field.type === "number" ? "number" : field.type}
                              disabled
                              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          ))}
        </main>

        <aside className={styles.panel}>
          <Typography.Text strong>Components</Typography.Text>
          {blockPalette.map((item) => (
            <div
              key={item.type}
              className={styles.paletteItem}
              draggable
              onDragStart={(event) => event.dataTransfer.setData(dragType, JSON.stringify({ kind: "palette-block", type: item.type } as DragPayload))}
            >
              {item.label}
            </div>
          ))}

          <Typography.Text strong>Form Fields</Typography.Text>
          {!hasFormBlock ? <Typography.Text className={styles.helperText}>Add a form block first.</Typography.Text> : null}
          {fieldPalette.map((item) => (
            <div
              key={item.type}
              className={styles.paletteItem}
              draggable
              onDragStart={(event) => event.dataTransfer.setData(dragType, JSON.stringify({ kind: "palette-field", fieldType: item.type } as DragPayload))}
            >
              {item.label}
            </div>
          ))}

          {hasFormBlock ? (
            <>
              <Typography.Text strong>Field Editor</Typography.Text>
              {formFields.map((field) => (
                <div key={field.id} className={styles.fieldEditor}>
                  <Typography.Text className={styles.helperText}>Field Key</Typography.Text>
                  <Input value={field.key} onChange={(e) => setFormFields((prev) => prev.map((f) => f.id === field.id ? { ...f, key: e.target.value } : f))} />
                  <Typography.Text className={styles.helperText}>Label</Typography.Text>
                  <Input value={field.label} onChange={(e) => setFormFields((prev) => prev.map((f) => f.id === field.id ? { ...f, label: e.target.value } : f))} />
                  <Typography.Text className={styles.helperText}>Type</Typography.Text>
                  <Select value={field.type} options={fieldPalette.map((f) => ({ label: f.label, value: f.type }))} onChange={(value) => setFormFields((prev) => prev.map((f) => f.id === field.id ? { ...f, type: value } : f))} />
                  <Button size="small" onClick={() => setFormFields((prev) => prev.filter((f) => f.id !== field.id))}>Remove Field</Button>
                </div>
              ))}
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
};

export default PageBuilder;
