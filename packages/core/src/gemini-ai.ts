import { GoogleGenAI } from "@google/genai";
import { z } from "zod/v4";

import type { TatoebaSentenceWithTranslations } from "./tatoeba";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MODEL = "gemini-3.5-flash-lite";

// ---------------------------------------------------------------------------
// Zod schema — defines the structured output we expect from Gemini
// ---------------------------------------------------------------------------

const SentencePairSchema = z.object({
  english: z.string().describe("The example sentence in English."),
  polish: z.string().describe("The translation of the sentence in Polish."),
});

const GeminiSentencesSchema = z.object({
  sentences: z
    .array(SentencePairSchema)
    .describe("A list of example sentence pairs."),
});

type GeminiSentencesPayload = z.infer<typeof GeminiSentencesSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** What we return to consumers – deliberately the same shape as Tatoeba. */
export interface GeminiSentenceSearchResult {
  sentences: TatoebaSentenceWithTranslations[];
}

export interface GeminiSearchOptions {
  /** The word / phrase to generate examples for. */
  query: string;
  /** How many example sentences to request (default 5). */
  count?: number;
  /** Source language direction (default "eng-pol"). */
  direction?: "eng-pol" | "pol-eng";
  additionalContext?: string;
  /**
   * Gemini API key. Prefer passing this from the host app so Expo and Vite
   * can each read their own env naming convention.
   */
  apiKey?: string;
}

// ---------------------------------------------------------------------------
// SDK client (lazy singleton keyed by api key)
// ---------------------------------------------------------------------------

const clients = new Map<string, GoogleGenAI>();

function getClient(apiKey: string | undefined): GoogleGenAI {
  if (!apiKey) {
    throw new GeminiApiError(
      "Gemini API key is not configured. " +
        "Set EXPO_PUBLIC_GEMINI_API_KEY or VITE_GEMINI_API_KEY in your environment.",
      401,
    );
  }
  let client = clients.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clients.set(apiKey, client);
  }
  return client;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Ask Gemini to generate example sentences that use `query`, together with
 * their translations (English ↔ Polish).
 */
export async function searchWithGemini(
  options: GeminiSearchOptions,
): Promise<GeminiSentenceSearchResult> {
  const {
    query,
    count = 5,
    direction = "eng-pol",
    additionalContext = "",
    apiKey,
  } = options;

  const client = getClient(apiKey);

  const sourceLang = direction === "eng-pol" ? "English" : "Polish";
  const targetLang = direction === "eng-pol" ? "Polish" : "English";

  const prompt = [
    `Generate exactly ${count} natural, everyday example sentences in ${sourceLang} that use the word "${query}".`,
    `For each sentence, provide its translation into ${targetLang}.`,
    `The sentences should vary in difficulty (A2-C1) and cover different contexts.`,
    additionalContext && `Additional context: ${additionalContext}`,
  ].join("\n");

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: GeminiSentencesSchema.toJSONSchema(),
        temperature: 0.9,
        maxOutputTokens: 2048,
      },
    });

    const rawText = response.text;

    if (!rawText) {
      throw new GeminiApiError("Gemini returned an empty response.", 500);
    }

    const parsed = GeminiSentencesSchema.parse(JSON.parse(rawText));

    return {
      sentences: mapToTatoebaShape(parsed, direction),
    };
  } catch (err) {
    if (err instanceof GeminiApiError) throw err;

    const message = err instanceof Error ? err.message : "Unknown Gemini error";
    throw new GeminiApiError(message, 500);
  }
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function mapToTatoebaShape(
  payload: GeminiSentencesPayload,
  direction: "eng-pol" | "pol-eng",
): TatoebaSentenceWithTranslations[] {
  const sourceLangKey = direction === "eng-pol" ? "english" : "polish";
  const targetLangKey = direction === "eng-pol" ? "polish" : "english";
  const sourceLangCode = direction === "eng-pol" ? "eng" : "pol";
  const targetLangCode = direction === "eng-pol" ? "pol" : "eng";

  return payload.sentences.map((s, index) => ({
    id: -(index + 1),
    text: s[sourceLangKey],
    lang: sourceLangCode,
    translations: [
      {
        id: -(index + 1) * 1000,
        text: s[targetLangKey],
        lang: targetLangCode,
        isDirect: true,
      },
    ],
  }));
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "GeminiApiError";
  }
}
