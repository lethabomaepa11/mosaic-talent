const clean = (value?: string) => (value ?? "").trim();

export const normalizeSkills = (value?: string) => {
  return clean(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, source) => {
      return source.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index;
    });
};

export const skillsToFieldValue = (skills: string[]) => {
  return skills
    .map((skill) => clean(skill))
    .filter(Boolean)
    .filter((item, index, source) => {
      return source.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index;
    })
    .join(", ");
};

const buildBaseInstructions = (aiPrompt?: string) => {
  const optionalInstruction = clean(aiPrompt);
  return optionalInstruction
    ? `Additional context from user: ${optionalInstruction}`
    : "No additional context provided.";
};

export const buildFullDraftPrompt = (
  aiPrompt: string,
  title?: string,
  description?: string,
  skills?: string,
) => {
  const currentTitle = clean(title);
  const currentDescription = clean(description);
  const currentSkills = clean(skills);

  return [
    "Generate a complete project draft.",
    currentTitle ? `Use this project title as anchor: ${currentTitle}` : "Suggest a clear title.",
    currentDescription
      ? `Current markdown to improve: ${currentDescription}`
      : "Create a markdown specification from scratch.",
    currentSkills
      ? `Current skills list to improve: ${currentSkills}`
      : "Suggest an initial skills list.",
    buildBaseInstructions(aiPrompt),
  ].join("\n");
};

export const buildMarkdownFromTitlePrompt = (aiPrompt: string, title: string) => {
  const normalizedTitle = clean(title);
  return [
    `Create a well-defined markdown project specification for this title: ${normalizedTitle}.`,
    "Focus on problem, goals, requirements, milestones, risks, acceptance criteria, and definition of done.",
    buildBaseInstructions(aiPrompt),
  ].join("\n");
};

export const buildMarkdownPolishPrompt = (
  aiPrompt: string,
  title: string,
  currentMarkdown: string,
) => {
  const normalizedTitle = clean(title);
  const normalizedMarkdown = clean(currentMarkdown);
  return [
    `Polish and strengthen the existing markdown specification for project: ${normalizedTitle}.`,
    "Keep intent, but improve clarity, structure, completeness, and acceptance criteria.",
    `Current markdown: ${normalizedMarkdown}`,
    buildBaseInstructions(aiPrompt),
  ].join("\n");
};

export const buildSkillsFromContextPrompt = (
  aiPrompt: string,
  title: string,
  markdown: string,
) => {
  const normalizedTitle = clean(title);
  const normalizedMarkdown = clean(markdown);
  return [
    `Generate a practical skills list for project: ${normalizedTitle}.`,
    `Project markdown context: ${normalizedMarkdown}`,
    "Return relevant technical and collaboration skills only.",
    buildBaseInstructions(aiPrompt),
  ].join("\n");
};

export const buildSkillsPolishPrompt = (
  aiPrompt: string,
  title: string,
  markdown: string,
  currentSkills: string,
) => {
  const normalizedTitle = clean(title);
  const normalizedMarkdown = clean(markdown);
  const normalizedSkills = clean(currentSkills);
  return [
    `Polish and normalize the skills list for project: ${normalizedTitle}.`,
    `Current skills: ${normalizedSkills}`,
    `Project markdown context: ${normalizedMarkdown}`,
    "Remove duplicates, ambiguity, and irrelevant entries.",
    buildBaseInstructions(aiPrompt),
  ].join("\n");
};
