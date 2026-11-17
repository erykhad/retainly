import { slugify } from "./slugify";
import { SEED_LISTS } from "./seedData";
import type { List, Word } from "./types";

/**
 * Build the initial lists + vocabulary maps from the bundled seed data.
 *
 * Each English seed word becomes a vocabulary entry. Its `notes` string is
 * treated as the Polish gloss: we create a Polish word with that full gloss
 * as the name and link it as a translation.
 */
export function buildSeedState(now = new Date()): {
  lists: Map<string, List>;
  vocabulary: Map<string, Word>;
} {
  const lists = new Map<string, List>();
  const vocabulary = new Map<string, Word>();

  const ensureWord = (
    name: string,
    language: Word["language"],
    notes = "",
  ): string | null => {
    const slug = slugify(name);
    if (!slug) return null;
    if (vocabulary.has(slug)) return slug;

    vocabulary.set(slug, {
      slug,
      name,
      notes,
      language,
      createdAt: now,
      updatedAt: now,
      translations: [],
    });
    return slug;
  };

  for (const seedList of SEED_LISTS) {
    const listSlug = slugify(seedList.name);
    if (!listSlug || lists.has(listSlug)) continue;

    const wordSlugs: string[] = [];

    for (const seedWord of seedList.words) {
      const englishSlug = ensureWord(
        seedWord.name,
        seedWord.language,
        seedWord.notes,
      );
      if (!englishSlug) continue;

      if (seedWord.notes.trim()) {
        const polishSlug = ensureWord(seedWord.notes.trim(), "polish", "");
        if (polishSlug) {
          const english = vocabulary.get(englishSlug);
          if (english && !english.translations.includes(polishSlug)) {
            vocabulary.set(englishSlug, {
              ...english,
              translations: [...english.translations, polishSlug],
            });
          }
        }
      }

      if (!wordSlugs.includes(englishSlug)) {
        wordSlugs.push(englishSlug);
      }
    }

    lists.set(listSlug, {
      slug: listSlug,
      name: seedList.name,
      notes: seedList.notes,
      icon: seedList.icon,
      color: seedList.color,
      createdAt: now,
      updatedAt: now,
      words: wordSlugs,
    });
  }

  return { lists, vocabulary };
}

/** True when localStorage (or AsyncStorage) has never persisted app data. */
export function isAppStorageEmpty(raw: string | null): boolean {
  return raw == null || raw === "";
}
