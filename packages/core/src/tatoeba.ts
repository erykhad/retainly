// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single sentence returned by the Tatoeba API. */
export interface TatoebaSentence {
  id: number;
  text: string;
  lang: string | null;
}

/** A translation attached to a sentence. */
export interface TatoebaTranslation extends TatoebaSentence {
  isDirect: boolean;
}

/** A sentence together with its translations – the main item we work with. */
export interface TatoebaSentenceWithTranslations extends TatoebaSentence {
  translations: TatoebaTranslation[];
}

/** Cursor-based paging metadata returned by the API. */
export interface TatoebaPaging {
  first?: string;
  next?: string;
}

/** The shape of a successful /v1/sentences response. */
interface TatoebaSearchResponse {
  data: RawSentence[];
  paging: TatoebaPaging;
}

/** What we return to consumers of this module. */
export interface SentenceSearchResult {
  sentences: TatoebaSentenceWithTranslations[];
  paging: TatoebaPaging;
}

// ---------------------------------------------------------------------------
// Raw API shapes (snake_case → camelCase mapping happens below)
// ---------------------------------------------------------------------------

interface RawSentence {
  id: number;
  text: string;
  lang: string | null;
  script?: string | null;
  license?: string;
  owner?: string | null;
  is_unapproved?: boolean;
  translations?: RawTranslation[];
}

interface RawTranslation {
  id: number;
  text: string;
  lang: string | null;
  is_direct?: boolean;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapTranslation(raw: RawTranslation): TatoebaTranslation {
  return {
    id: raw.id,
    text: raw.text,
    lang: raw.lang,
    isDirect: raw.is_direct ?? true,
  };
}

function mapSentence(raw: RawSentence): TatoebaSentenceWithTranslations {
  return {
    id: raw.id,
    text: raw.text,
    lang: raw.lang,
    translations: (raw.translations ?? []).map(mapTranslation),
  };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

export interface SearchSentencesOptions {
  /** The word / phrase to search for. */
  query: string;
  /** Maximum number of results (default 10). */
  limit?: number;
  /** Cursor for fetching the next page (value from `paging.next`). */
  after?: string;
  /** Sort order (default "relevance"). */
  sort?: "relevance" | "words" | "-words" | "created" | "-created" | "random";
  /**
   * Base URL for the Tatoeba API, including the `/v1` path.
   * Defaults to the public API. Web passes a same-origin proxy path.
   */
  baseUrl?: string;
}

const DEFAULT_BASE_URL = "https://api.tatoeba.org/v1";

/**
 * Search for English sentences containing `query` that have Polish
 * translations, and return the matched sentences together with their Polish
 * translations.
 */
export async function searchEnglishWithPolish(
  options: SearchSentencesOptions,
): Promise<SentenceSearchResult> {
  return searchSentences({
    ...options,
    sourceLang: "eng",
    translationLang: "pol",
  });
}

/**
 * Search for Polish sentences containing `query` that have English
 * translations, and return the matched sentences together with their English
 * translations.
 */
export async function searchPolishWithEnglish(
  options: SearchSentencesOptions,
): Promise<SentenceSearchResult> {
  return searchSentences({
    ...options,
    sourceLang: "pol",
    translationLang: "eng",
  });
}

// ---------------------------------------------------------------------------
// Core search function (generic source → translation language)
// ---------------------------------------------------------------------------

interface InternalSearchOptions extends SearchSentencesOptions {
  /** ISO 639-3 code for the sentence language. */
  sourceLang: string;
  /** ISO 639-3 code for the required translation language. */
  translationLang: string;
}

async function searchSentences(
  options: InternalSearchOptions,
): Promise<SentenceSearchResult> {
  const {
    query,
    sourceLang,
    translationLang,
    limit = 10,
    sort = "relevance",
    after,
    baseUrl = DEFAULT_BASE_URL,
  } = options;

  const params = new URLSearchParams({
    q: query,
    lang: sourceLang,
    "trans:lang": translationLang,
    sort,
    limit: String(limit),
  });

  if (after) {
    params.set("after", after);
  }

  const url = `${baseUrl.replace(/\/$/, "")}/sentences?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new TatoebaApiError(
      `Tatoeba API error ${response.status}: ${body}`,
      response.status,
    );
  }

  const json: TatoebaSearchResponse = await response.json();

  return {
    sentences: json.data.map(mapSentence),
    paging: {
      first: extractCursor(json.paging.first),
      next: extractCursor(json.paging.next),
    },
  };
}

/**
 * The API returns `paging.next` / `paging.first` as full URLs
 * (e.g. `https://api.tatoeba.org/v1/sentences?after=1234,5678`).
 * We only need the `after` cursor value itself.
 */
function extractCursor(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).searchParams.get("after") ?? undefined;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class TatoebaApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "TatoebaApiError";
  }
}
