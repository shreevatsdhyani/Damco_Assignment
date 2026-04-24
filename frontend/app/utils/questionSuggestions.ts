/**
 * Question suggestions - delegates to LLM-generated suggestions from backend
 * Keeps a lightweight local fallback for instant display before API responds
 */

interface FileSchema {
  filename: string;
  columns: { name: string; dtype: string }[];
}

const DEFAULT_SUGGESTIONS = [
  "What are the key metrics in my data?",
  "Show me a summary of all datasets",
  "Any anomalies or red flags?",
  "What trends do you see?",
];

const DEFAULT_NO_FILES = [
  "What can you help me with?",
  "How do I get started?",
  "What kind of data can I upload?",
];

export function generateInitialSuggestions(files: FileSchema[]): string[] {
  if (files.length === 0) return DEFAULT_NO_FILES;
  return DEFAULT_SUGGESTIONS;
}

export function generateFollowUpSuggestions(
  _lastQuestion: string,
  _lastAnswer: string,
  _files: FileSchema[]
): string[] {
  return [
    "Dig deeper into the data",
    "Show me a different angle",
    "What should I focus on next?",
  ];
}

export function isSimilarQuestion(suggestion: string, usedQuestion: string): boolean {
  const s1 = suggestion.toLowerCase().trim().replace(/[?.,!]/g, "");
  const s2 = usedQuestion.toLowerCase().trim().replace(/[?.,!]/g, "");
  if (s1 === s2) return true;

  const words1 = s1.split(" ").filter((w) => w.length > 3);
  const words2 = s2.split(" ").filter((w) => w.length > 3);
  if (words1.length >= 2 && words2.length >= 2) {
    const common = words1.filter((w) => words2.includes(w)).length;
    if (common / Math.max(words1.length, words2.length) >= 0.85) return true;
  }
  return false;
}
