const normalizeValue = (value: string) => {
  return value.trim().toLowerCase();
};

export const normalizeSuggestionValues = (
  values: string[],
  existingValues: string[],
  query: string,
  limit = 8,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  const existing = new Set(existingValues.map(normalizeValue));
  const seen = new Set<string>();

  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => !existing.has(normalizeValue(value)))
    .filter((value) => {
      if (!normalizedQuery) {
        return true;
      }

      return normalizeValue(value).includes(normalizedQuery);
    })
    .filter((value) => {
      const normalized = normalizeValue(value);
      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .slice(0, limit);
};

export const toSuggestionOptions = (values: string[]) => {
  return values.map((value) => ({
    value,
    label: value,
  }));
};
