import { GoogleGenAI } from "@google/genai";
import { z } from "zod/v4";

import type { List } from "@retainly/core";

const MODEL = "gemini-3.5-flash-lite";

const CategorizeSchema = z.object({
  action: z
    .enum(["select", "create"])
    .describe(
      'Use "select" when an existing list fits well; otherwise "create".',
    ),
  listSlug: z
    .string()
    .describe(
      'When action is "select", the slug of the chosen existing list. Empty string when creating.',
    ),
  name: z
    .string()
    .describe(
      'When action is "create", a short category name. Empty string when selecting.',
    ),
  notes: z
    .string()
    .describe(
      'When action is "create", a one-sentence description of the category. Empty when selecting.',
    ),
  icon: z
    .string()
    .describe(
      'When action is "create", one icon id from the allowedIcons list. Empty when selecting.',
    ),
  color: z
    .string()
    .describe(
      'When action is "create", one hex color from the allowedColors list. Empty when selecting.',
    ),
  reason: z
    .string()
    .describe("Brief explanation of why this list was chosen or created."),
});

export type CategorizeWordResult =
  | {
      action: "select";
      listSlug: string;
      reason: string;
    }
  | {
      action: "create";
      name: string;
      notes: string;
      icon: string;
      color: string;
      reason: string;
    };

export interface CategorizeWordInput {
  word: string;
  notes?: string;
  existingLists: Array<Pick<List, "slug" | "name" | "notes">>;
  allowedIcons: readonly string[];
  allowedColors: readonly string[];
  apiKey?: string;
}

export class CategorizeWordError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
  ) {
    super(message);
    this.name = "CategorizeWordError";
  }
}

/**
 * Ask Gemini to place a word into an existing list, or propose a new list
 * when nothing matches.
 */
export async function categorizeWordWithGemini(
  options: CategorizeWordInput,
): Promise<CategorizeWordResult> {
  const {
    word,
    notes = "",
    existingLists,
    allowedIcons,
    allowedColors,
    apiKey = import.meta.env.VITE_GEMINI_API_KEY,
  } = options;

  if (!apiKey) {
    throw new CategorizeWordError(
      "Gemini API key is not configured. Set VITE_GEMINI_API_KEY to auto-categorize words.",
      401,
    );
  }

  if (!word.trim()) {
    throw new CategorizeWordError("Word is required.", 400);
  }

  const client = new GoogleGenAI({ apiKey });

  const listsJson = JSON.stringify(
    existingLists.map((list) => ({
      slug: list.slug,
      name: list.name,
      notes: list.notes,
    })),
    null,
    2,
  );

  const prompt = [
    `You categorize English vocabulary words into thematic lists for a language-learning app.`,
    `Word: "${word.trim()}"`,
    notes.trim() ? `Learner notes: "${notes.trim()}"` : "",
    `Existing lists (prefer selecting one of these when it is a good fit):`,
    listsJson,
    `Allowed icons for a new list: ${allowedIcons.join(", ")}`,
    `Allowed colors for a new list: ${allowedColors.join(", ")}`,
    `Rules:`,
    `- Prefer action "select" when an existing list clearly matches the word's theme.`,
    `- Use action "create" only when none of the existing lists are a reasonable fit.`,
    `- When selecting, set listSlug to an existing slug exactly; leave name/notes/icon/color empty.`,
    `- When creating, invent a concise English category name, a one-sentence notes field, and pick icon/color only from the allowed lists; leave listSlug empty.`,
    `- Never invent a listSlug that is not in the existing lists.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: CategorizeSchema.toJSONSchema(),
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new CategorizeWordError("Gemini returned an empty response.");
    }

    const parsed = CategorizeSchema.parse(JSON.parse(rawText));
    return normalizeCategorizeResult(parsed, {
      existingLists,
      allowedIcons,
      allowedColors,
    });
  } catch (err) {
    if (err instanceof CategorizeWordError) throw err;
    const message =
      err instanceof Error ? err.message : "Unknown Gemini categorize error";
    throw new CategorizeWordError(message);
  }
}

function normalizeCategorizeResult(
  parsed: z.infer<typeof CategorizeSchema>,
  ctx: {
    existingLists: Array<Pick<List, "slug" | "name" | "notes">>;
    allowedIcons: readonly string[];
    allowedColors: readonly string[];
  },
): CategorizeWordResult {
  if (parsed.action === "select") {
    const match = ctx.existingLists.find(
      (list) => list.slug === parsed.listSlug,
    );
    if (match) {
      return {
        action: "select",
        listSlug: match.slug,
        reason: parsed.reason,
      };
    }
    // Model hallucinated a slug — fall through to create if it provided a name,
    // otherwise pick the first existing list when available.
    if (parsed.name.trim()) {
      return createFromParsed(parsed, ctx);
    }
    if (ctx.existingLists[0]) {
      return {
        action: "select",
        listSlug: ctx.existingLists[0].slug,
        reason: parsed.reason || "Fell back to the first existing list.",
      };
    }
    return createFromParsed(
      {
        ...parsed,
        name: parsed.name.trim() || "Miscellaneous",
        notes: parsed.notes.trim() || "Words that did not fit another list.",
      },
      ctx,
    );
  }

  return createFromParsed(parsed, ctx);
}

function createFromParsed(
  parsed: z.infer<typeof CategorizeSchema>,
  ctx: {
    allowedIcons: readonly string[];
    allowedColors: readonly string[];
  },
): Extract<CategorizeWordResult, { action: "create" }> {
  const icon = ctx.allowedIcons.includes(parsed.icon)
    ? parsed.icon
    : (ctx.allowedIcons[0] ?? "book");
  const color = ctx.allowedColors.includes(parsed.color)
    ? parsed.color
    : (ctx.allowedColors[0] ?? "#0A84FF");

  return {
    action: "create",
    name: parsed.name.trim() || "Miscellaneous",
    notes: parsed.notes.trim(),
    icon,
    color,
    reason: parsed.reason,
  };
}
