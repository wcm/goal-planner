export const OTHER_CONTEXT_OPTION = "Other";

const FALLBACK_OPTIONS = ["No preference", "Not sure yet"];

export function normalizeQuestionOptions(options: string[]) {
  const normalized = Array.from(new Set(
    options
      .map((option) => option.trim())
      .filter((option) => option && option.toLowerCase() !== OTHER_CONTEXT_OPTION.toLowerCase()),
  )).slice(0, 5);

  for (const fallback of FALLBACK_OPTIONS) {
    if (normalized.length >= 2) break;
    if (!normalized.includes(fallback)) normalized.push(fallback);
  }

  return [...normalized, OTHER_CONTEXT_OPTION];
}
