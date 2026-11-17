import {
  searchWithGemini as searchWithGeminiCore,
  GeminiApiError,
  type GeminiSearchOptions,
  type GeminiSentenceSearchResult,
} from "@retainly/core";

export { GeminiApiError, type GeminiSearchOptions, type GeminiSentenceSearchResult };

export async function searchWithGemini(
  options: Omit<GeminiSearchOptions, "apiKey">,
): Promise<GeminiSentenceSearchResult> {
  return searchWithGeminiCore({
    ...options,
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  });
}
