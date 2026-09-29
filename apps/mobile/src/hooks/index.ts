import { useCallback, useEffect, useRef, useState } from "react";

import { searchWithGemini } from "@/services/gemini-ai";
import { useGeminiStore } from "@/services/geminiStore";
import {
  searchEnglishWithPolish,
  searchPolishWithEnglish,
  type SentenceSearchResult,
  type TatoebaSentenceWithTranslations,
} from "@/services/tatoeba";

/** Stable empty array – avoids new references in Zustand selectors. */
const EMPTY_SENTENCES: TatoebaSentenceWithTranslations[] = [];

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: SentenceSearchResult;
  timestamp: number;
}

/** TTL in ms – cached results are valid for 5 minutes. */
const CACHE_TTL = 5 * 60 * 1000;

const cache = new Map<string, CacheEntry>();

function getCacheKey(query: string, direction: SearchDirection): string {
  return `${direction}:${query.trim().toLowerCase()}`;
}

function getCached(key: string): SentenceSearchResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: SentenceSearchResult): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Hook — Tatoeba
// ---------------------------------------------------------------------------

export type SearchDirection = "eng-pol" | "pol-eng";

export interface UseTatoebaSearchOptions {
  /** The word or phrase to search for. */
  query: string;
  /** Which direction to search – English→Polish or Polish→English. */
  direction?: SearchDirection;
  /** Max results per page (default 10). */
  limit?: number;
  /** Set to `false` to prevent the query from firing (e.g. empty input). */
  enabled?: boolean;
  /** Debounce delay in ms before firing the request (default 400). */
  debounce?: number;
}

export interface UseTatoebaSearchReturn {
  /** The list of sentences with their translations. */
  sentences: TatoebaSentenceWithTranslations[];
  /** `true` while the initial request is in flight. */
  isLoading: boolean;
  /** `true` while a "fetch more" request is in flight. */
  isFetchingMore: boolean;
  /** `true` when there are more pages available. */
  hasMore: boolean;
  /** Error message, if the last request failed. */
  error: string | null;
  /** Refetch the current query, bypassing the cache. */
  refetch: () => void;
  /** Fetch the next page and append results. No-op if `hasMore` is false. */
  fetchMore: () => void;
}

/**
 * React hook that queries the Tatoeba API for example sentences containing a
 * word, with simple in-memory caching and debounce.
 *
 * @example
 * ```tsx
 * const { sentences, isLoading } = useTatoebaSearch({
 *   query: "apple",
 *   direction: "eng-pol",
 * });
 * ```
 */
export function useTatoebaSearch(
  options: UseTatoebaSearchOptions,
): UseTatoebaSearchReturn {
  const {
    query,
    direction = "eng-pol",
    limit = 10,
    enabled = true,
    debounce = 400,
  } = options;

  const [sentences, setSentences] = useState<TatoebaSentenceWithTranslations[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Used to skip stale responses after rapid query changes.
  const requestId = useRef(0);
  // Track whether we should bypass cache on the next fetch.
  const bypassCache = useRef(false);
  // Cursor for the next page.
  const nextCursor = useRef<string | undefined>(undefined);

  const fetchSentences = useCallback(
    async (q: string, dir: SearchDirection, lim: number) => {
      const id = ++requestId.current;
      const trimmed = q.trim();

      if (!trimmed) {
        setSentences([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const cacheKey = getCacheKey(trimmed, dir);

      // Return cached data immediately if available.
      if (!bypassCache.current) {
        const cached = getCached(cacheKey);
        if (cached) {
          setSentences(cached.sentences);
          nextCursor.current = cached.paging.next;
          setHasMore(!!cached.paging.next);
          setError(null);
          setIsLoading(false);
          return;
        }
      }
      bypassCache.current = false;

      setIsLoading(true);
      setError(null);

      try {
        const searchFn =
          dir === "eng-pol" ? searchEnglishWithPolish : searchPolishWithEnglish;

        const result = await searchFn({
          query: trimmed,
          limit: lim,
        });

        // Only apply if this is still the latest request.
        if (id !== requestId.current) return;

        setCache(cacheKey, result);
        setSentences(result.sentences);
        nextCursor.current = result.paging.next;
        setHasMore(!!result.paging.next);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setSentences([]);
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  // Fetch the next page and append results.
  const fetchMore = useCallback(async () => {
    const cursor = nextCursor.current;
    if (!cursor || isFetchingMore) return;

    const trimmed = query.trim();
    if (!trimmed) return;

    setIsFetchingMore(true);
    setError(null);

    try {
      const searchFn =
        direction === "eng-pol"
          ? searchEnglishWithPolish
          : searchPolishWithEnglish;

      const result = await searchFn({
        query: trimmed,
        limit,
        after: cursor,
      });

      nextCursor.current = result.paging.next;
      setHasMore(!!result.paging.next);
      setSentences((prev) => {
        const merged = [...prev, ...result.sentences];

        // Update cache with the full accumulated list.
        const cacheKey = getCacheKey(trimmed, direction);
        setCache(cacheKey, {
          sentences: merged,
          paging: result.paging,
        });

        return merged;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsFetchingMore(false);
    }
  }, [query, direction, limit, isFetchingMore]);

  // Debounced effect that fires when the inputs change.
  useEffect(() => {
    if (!enabled) {
      setSentences([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      fetchSentences(query, direction, limit);
    }, debounce);

    return () => clearTimeout(timer);
  }, [query, direction, limit, enabled, debounce, fetchSentences]);

  const refetch = useCallback(() => {
    bypassCache.current = true;
    nextCursor.current = undefined;
    setHasMore(false);
    fetchSentences(query, direction, limit);
  }, [query, direction, limit, fetchSentences]);

  return {
    sentences,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    refetch,
    fetchMore,
  };
}

// ---------------------------------------------------------------------------
// Hook — Gemini AI
// ---------------------------------------------------------------------------

export interface UseGeminiAiSearchOptions {
  /** The word or phrase to generate examples for. */
  query: string;
  /** Which direction – English→Polish or Polish→English (default "eng-pol"). */
  direction?: SearchDirection;
  /** Number of sentences to generate per request (default 5). */
  count?: number;
  /** Set to `false` to prevent the initial query from firing. */
  enabled?: boolean;
  /** Debounce delay in ms before firing the request (default 400). */
  debounce?: number;
}

export interface UseGeminiAiSearchReturn {
  /** All accumulated AI-generated sentences with translations for this word. */
  sentences: TatoebaSentenceWithTranslations[];
  /** `true` while the initial or a "fetch more" request is in flight. */
  isLoading: boolean;
  /** Error message, if the last request failed. */
  error: string | null;
  /** Generate more sentences and merge them with the existing ones. */
  fetchMore: (additionalContext?: string) => void;
  /** Clear stored sentences for this word and re-generate from scratch. */
  refetch: () => void;
}

/**
 * React hook that uses the Gemini API to generate example sentences for a
 * word. Sentences are persisted per-word in AsyncStorage via Zustand and
 * accumulate across `fetchMore` calls.
 *
 * @example
 * ```tsx
 * const { sentences, isLoading, fetchMore } = useGeminiAiSearch({
 *   query: "apple",
 *   direction: "eng-pol",
 * });
 * ```
 */
export function useGeminiAiSearch(
  options: UseGeminiAiSearchOptions,
): UseGeminiAiSearchReturn {
  const {
    query,
    direction = "eng-pol",
    count = 5,
    enabled = true,
    debounce = 400,
  } = options;

  // Read from the persisted store.
  // IMPORTANT: select the raw entry (or undefined) — do NOT use `?? []` inside
  // the selector, because a new array on every call tricks Zustand into
  // thinking state changed → infinite re-render loop.
  const key = query.trim().toLowerCase();
  const storedSentences =
    useGeminiStore((s) => s.entries[key]?.sentences) ?? EMPTY_SENTENCES;
  const mergeSentences = useGeminiStore((s) => s.mergeSentences);
  const clearWord = useGeminiStore((s) => s.clearWord);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  const generate = useCallback(
    async (q: string, dir: SearchDirection, cnt: number, additionalContext?: string) => {
      const id = ++requestId.current;
      const trimmed = q.trim();

      if (!trimmed) {
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await searchWithGemini({
          query: trimmed,
          count: cnt,
          direction: dir,
          additionalContext,
        });

        if (id !== requestId.current) return;

        // Merge new sentences into the store (deduplicates automatically).
        mergeSentences(trimmed, result.sentences);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
        }
      }
    },
    [mergeSentences],
  );

  // Auto-fetch on mount if no stored sentences exist yet.
  useEffect(() => {
    if (!enabled) {
      setError(null);
      setIsLoading(false);
      return;
    }

    // Skip the initial fetch if we already have persisted data for this word.
    const trimmed = query.trim();
    if (!trimmed) return;

    const existing = useGeminiStore.getState().getSentences(trimmed);
    if (existing.length > 0) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      generate(query, direction, count);
    }, debounce);

    return () => clearTimeout(timer);
  }, [query, direction, count, enabled, debounce, generate]);

  const fetchMore = useCallback((additionalContext?: string) => {
    generate(query, direction, count, additionalContext);
  }, [query, direction, count, generate]);

  const refetch = useCallback(() => {
    clearWord(query);
    generate(query, direction, count);
  }, [query, direction, count, clearWord, generate]);

  return {
    sentences: storedSentences,
    isLoading,
    error,
    fetchMore,
    refetch,
  };
}
