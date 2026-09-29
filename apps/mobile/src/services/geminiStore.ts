import type { TatoebaSentenceWithTranslations } from "@/services/tatoeba";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Stored entry for a single word's Gemini-generated sentences. */
export interface GeminiWordEntry {
  /** All accumulated sentences for this word. */
  sentences: TatoebaSentenceWithTranslations[];
  /** Timestamp of the last fetch. */
  updatedAt: number;
}

interface GeminiStoreState {
  /** Map from word query (lowercased + trimmed) → stored sentences. */
  entries: Record<string, GeminiWordEntry>;

  /** Get stored sentences for a word. */
  getSentences: (query: string) => TatoebaSentenceWithTranslations[];

  /** Merge new sentences into the existing ones for a word, deduplicating by text. */
  mergeSentences: (
    query: string,
    newSentences: TatoebaSentenceWithTranslations[],
  ) => void;

  /** Clear all stored sentences for a word. */
  clearWord: (query: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeKey(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Deduplicate sentences by their source text (case-insensitive).
 * Keeps the first occurrence.
 */
function deduplicateSentences(
  sentences: TatoebaSentenceWithTranslations[],
): TatoebaSentenceWithTranslations[] {
  const seen = new Set<string>();
  return sentences.filter((s) => {
    const key = s.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Re-assign stable negative IDs so that React keys don't collide after merging.
 */
function reindexSentences(
  sentences: TatoebaSentenceWithTranslations[],
): TatoebaSentenceWithTranslations[] {
  return sentences.map((s, i) => ({
    ...s,
    id: -(i + 1),
    translations: s.translations.map((t, j) => ({
      ...t,
      id: -(i + 1) * 1000 - j,
    })),
  }));
}

const EMPTY_SENTENCES: TatoebaSentenceWithTranslations[] = [];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGeminiStore = create<GeminiStoreState>()(
  persist(
    (set, get) => ({
      entries: {},

      getSentences: (query) => {
        const key = normalizeKey(query);
        return get().entries[key]?.sentences ?? EMPTY_SENTENCES;
      },

      mergeSentences: (query, newSentences) => {
        const key = normalizeKey(query);
        const existing = get().entries[key]?.sentences ?? EMPTY_SENTENCES;

        const merged = reindexSentences(
          deduplicateSentences([...existing, ...newSentences]),
        );

        set((state) => ({
          entries: {
            ...state.entries,
            [key]: {
              sentences: merged,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      clearWord: (query) => {
        const key = normalizeKey(query);
        set((state) => {
          const next = { ...state.entries };
          delete next[key];
          return { entries: next };
        });
      },
    }),
    {
      name: "gemini-sentences-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
