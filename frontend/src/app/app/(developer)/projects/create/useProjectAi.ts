"use client";
import { useState } from "react";
import { Form, type FormInstance } from "antd";
import { toast } from "@/components/providers";
import { useProjectAction } from "@/providers/project-provider";
import { buildFullDraftPrompt, buildMarkdownFromTitlePrompt, buildMarkdownPolishPrompt,
  buildSkillsFromContextPrompt, buildSkillsPolishPrompt, normalizeSkills, skillsToFieldValue } from "./aiPromptHelpers";
import { DIFFICULTY_OPTIONS } from "./projectOptions";

export const useProjectAi = (form: FormInstance) => {
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const { aiGenerateProjectSpec } = useProjectAction();
  const descriptionValue = Form.useWatch("description", form);
  const titleValue = Form.useWatch("title", form);
  const skillsValue = Form.useWatch("skills", form);
  const runAiSpec = async (prompt: string) => {
    setIsGeneratingSpec(true);
    try {
      const suggestion = await aiGenerateProjectSpec(
        prompt,
        String(form.getFieldValue("githubRepo") ?? ""),
      );

      if (!suggestion) {
        throw new Error("No suggestion received.");
      }
      return suggestion;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate project spec.";
      toast.error("AI generation failed", message);
      return undefined;
    } finally {
      setIsGeneratingSpec(false);
    }
  };

  const handleGenerateProject = async () => {
    const prompt = buildFullDraftPrompt(
      aiPrompt,
      String(titleValue ?? ""),
      String(descriptionValue ?? ""),
      String(skillsValue ?? ""),
    );
    const suggestion = await runAiSpec(prompt);
    if (!suggestion) {
      return;
    }

    const difficultyValue = DIFFICULTY_OPTIONS.find(
      (item) => item.label.toLowerCase() === suggestion.difficulty,
    )?.value;

    form.setFieldsValue({
      title: suggestion.title,
      description: suggestion.descriptionMarkdown,
      skills: skillsToFieldValue(suggestion.skills),
      difficulty: difficultyValue ?? 1,
      estimatedHoursPerWeek: suggestion.estimatedHoursPerWeek,
    });
    toast.success("Draft updated", "AI updated title, markdown, and skills.");
  };

  const handleUseAiForMarkdown = async () => {
    const title = String(titleValue ?? "").trim();
    const description = String(descriptionValue ?? "").trim();
    if (!title && !description) {
      toast.error("Missing context", "Add a title or markdown first.");
      return;
    }

    const prompt = description
      ? buildMarkdownPolishPrompt(aiPrompt, title, description)
      : buildMarkdownFromTitlePrompt(aiPrompt, title);
    const suggestion = await runAiSpec(prompt);
    if (!suggestion?.descriptionMarkdown) {
      return;
    }

    form.setFieldValue("description", suggestion.descriptionMarkdown);
    toast.success("Markdown updated", "Description was updated using AI.");
  };

  const handleUseAiForSkills = async () => {
    const title = String(titleValue ?? "").trim();
    const description = String(descriptionValue ?? "").trim();
    const rawSkills = String(skillsValue ?? "").trim();
    if (!title && !description && !rawSkills) {
      toast.error("Missing context", "Add a title, markdown, or skills first.");
      return;
    }

    const prompt = rawSkills
      ? buildSkillsPolishPrompt(aiPrompt, title, description, rawSkills)
      : buildSkillsFromContextPrompt(aiPrompt, title, description);
    const suggestion = await runAiSpec(prompt);
    const updatedSkills = suggestion?.skills?.length
      ? suggestion.skills
      : normalizeSkills(rawSkills);
    if (updatedSkills.length === 0) {
      return;
    }

    form.setFieldValue("skills", skillsToFieldValue(updatedSkills));
    toast.success("Skills updated", "Skills were updated using AI.");
  };

  return { aiPrompt, setAiPrompt, isGeneratingSpec, handleGenerateProject,
    handleUseAiForMarkdown, handleUseAiForSkills };
};
