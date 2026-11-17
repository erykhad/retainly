import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import { slugify } from "./slugify";
import type { List, Word } from "./types";

export interface AppState {
  lists: Map<string, List>;
  addList: (
    list: Omit<List, "slug" | "createdAt" | "updatedAt" | "words">,
  ) => List["slug"] | null;
  updateList: (list: Pick<List, "slug" | "name" | "notes">) => void;
  deleteList: (list: List["slug"]) => void;

  vocabulary: Map<string, Word>;
  addWord: (
    word: Omit<Word, "slug" | "createdAt" | "updatedAt" | "translations">,
  ) => Word["slug"] | null;
  updateWord: (word: Pick<Word, "slug" | "name" | "notes">) => void;
  deleteWord: (word: Word["slug"]) => void;

  assignWordToList: (list: List["slug"], word: Word["slug"]) => void;
  assignTranslationToWord: (
    word: Word["slug"],
    translation: Word["slug"],
  ) => void;

  reorderWordsInList: (
    listSlug: List["slug"],
    indices: number[],
    destinationIndex: number,
  ) => void;

  /** Replace lists and vocabulary (used for first-run seeding). */
  hydrateFromSeed: (
    lists: Map<string, List>,
    vocabulary: Map<string, Word>,
  ) => void;
}

export function createAppStore(storage: StateStorage) {
  return create<AppState>()(
    persist(
      (set, getState) => ({
        lists: new Map<string, List>(),
        addList: (list) => {
          const slug = slugify(list.name);
          if (!!getState().lists.get(slug)) return null;

          set((state) => ({
            ...state,
            lists: new Map(state.lists).set(slug, {
              ...list,
              slug,
              createdAt: new Date(),
              updatedAt: new Date(),
              words: [],
            }),
          }));

          return slug;
        },
        updateList: (list) => {
          const { lists, deleteList } = getState();

          const foundList = lists.get(list.slug);
          if (!foundList) return;

          const slug = slugify(list.name);
          if (slug !== list.slug && !!lists.get(slug)) return;

          if (slug !== list.slug) deleteList(list.slug);

          set((state) => ({
            ...state,
            lists: new Map(state.lists).set(slug, {
              ...foundList,
              ...list,
              slug,
              updatedAt: new Date(),
            }),
          }));
        },
        deleteList: (listSlug) => {
          const { lists, deleteWord } = getState();
          const foundList = lists.get(listSlug);
          if (!foundList) return;

          foundList.words.forEach(deleteWord);

          set((state) => {
            const next = new Map(state.lists);
            next.delete(listSlug);
            return { ...state, lists: next };
          });
        },

        vocabulary: new Map<string, Word>(),
        addWord: (word) => {
          const slug = slugify(word.name);
          if (!!getState().vocabulary.get(slug)) return null;

          set((state) => ({
            ...state,
            vocabulary: new Map(state.vocabulary).set(slug, {
              ...word,
              slug,
              createdAt: new Date(),
              updatedAt: new Date(),
              translations: [],
            }),
          }));

          return slug;
        },
        updateWord: (word) => {
          const { vocabulary, deleteWord } = getState();

          const foundWord = vocabulary.get(word.slug);
          if (!foundWord) return;

          const slug = slugify(word.name);
          if (slug !== word.slug && !!vocabulary.get(slug)) return;

          if (slug !== word.slug) deleteWord(word.slug);

          set((state) => ({
            ...state,
            vocabulary: new Map(state.vocabulary).set(slug, {
              ...foundWord,
              ...word,
              slug,
              updatedAt: new Date(),
            }),
          }));
        },
        deleteWord: (wordSlug) =>
          set((state) => {
            const nextVocabulary = new Map(state.vocabulary);
            nextVocabulary.delete(wordSlug);

            // Also drop the slug from every list and from translation links.
            const nextLists = new Map(
              Array.from(state.lists.entries()).map(([key, list]) => [
                key,
                {
                  ...list,
                  words: list.words.filter((slug) => slug !== wordSlug),
                },
              ]),
            );

            for (const [key, word] of nextVocabulary) {
              if (!word.translations.includes(wordSlug)) continue;
              nextVocabulary.set(key, {
                ...word,
                translations: word.translations.filter(
                  (slug) => slug !== wordSlug,
                ),
              });
            }

            return {
              ...state,
              vocabulary: nextVocabulary,
              lists: nextLists,
            };
          }),

        assignWordToList: (listSlug, wordSlug) =>
          set((state) => {
            const { lists, vocabulary } = state;

            const foundList = lists.get(listSlug);
            const foundWord = vocabulary.get(wordSlug);

            if (!foundList || !foundWord || foundList.words.includes(wordSlug))
              return state;

            return {
              ...state,
              lists: new Map(state.lists).set(listSlug, {
                ...foundList,
                words: [...foundList.words, wordSlug],
              }),
            };
          }),

        assignTranslationToWord: (wordSlug, translationSlug) =>
          set((state) => {
            const { vocabulary } = state;

            const foundWord = vocabulary.get(wordSlug);
            const foundTranslation = vocabulary.get(translationSlug);

            if (
              !foundWord ||
              !foundTranslation ||
              foundWord.translations.includes(translationSlug)
            )
              return state;

            return {
              ...state,
              vocabulary: new Map(state.vocabulary).set(wordSlug, {
                ...foundWord,
                translations: [...foundWord.translations, translationSlug],
              }),
            };
          }),

        reorderWordsInList: (listSlug, indices, destinationIndex) =>
          set((state) => {
            const { lists } = state;

            const foundList = lists.get(listSlug);
            if (!foundList || indices.length === 0) return state;

            const next = [...foundList.words];

            const sorted = [...new Set(indices)]
              .filter((i) => i >= 0 && i < next.length)
              .sort((a, b) => a - b);

            if (sorted.length === 0) return state;

            const moved = sorted.map((i) => next[i]);

            for (let i = sorted.length - 1; i >= 0; i--) {
              next.splice(sorted[i], 1);
            }

            const adjustedDest = Math.max(
              0,
              Math.min(
                next.length,
                destinationIndex -
                  sorted.filter((i) => i < destinationIndex).length,
              ),
            );

            next.splice(adjustedDest, 0, ...moved);

            return {
              ...state,
              lists: new Map(state.lists).set(listSlug, {
                ...foundList,
                words: next,
                updatedAt: new Date(),
              }),
            };
          }),

        hydrateFromSeed: (lists, vocabulary) =>
          set((state) => ({
            ...state,
            lists,
            vocabulary,
          })),
      }),
      {
        name: "app-storage",
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({
          lists: Array.from(state.lists.entries()),
          vocabulary: Array.from(state.vocabulary.entries()),
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as
            | {
                lists?: [string, List][];
                vocabulary?: [string, Word][];
              }
            | undefined;

          const lists = (persisted?.lists ?? []).map(
            ([k, v]): [string, List] => [
              k,
              {
                ...v,
                createdAt: new Date(v.createdAt),
                updatedAt: new Date(v.updatedAt),
              },
            ],
          );

          const vocabulary = (persisted?.vocabulary ?? []).map(
            ([k, v]): [string, Word] => [
              k,
              {
                ...v,
                createdAt: new Date(v.createdAt),
                updatedAt: new Date(v.updatedAt),
              },
            ],
          );

          return {
            ...currentState,
            lists: new Map<string, List>(lists),
            vocabulary: new Map<string, Word>(vocabulary),
          };
        },
      },
    ),
  );
}

export type AppStore = ReturnType<typeof createAppStore>;
