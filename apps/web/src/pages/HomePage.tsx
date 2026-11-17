import { useMemo, useState } from "react";

import { ListRow } from "@/components/ListRow";
import { WordRow } from "@/components/WordRow";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/stores";

export function HomePage() {
  const lists = useAppStore((state) => state.lists);
  const vocabulary = useAppStore((state) => state.vocabulary);
  const [search, setSearch] = useState("");

  const listsAsArray = useMemo(() => Array.from(lists.values()), [lists]);

  const wordsWithList = useMemo(
    () =>
      listsAsArray.flatMap((list) =>
        list.words
          .map((wordSlug) => vocabulary.get(wordSlug))
          .filter((w): w is NonNullable<typeof w> => w !== undefined)
          .map((word) => [word, list] as const),
      ),
    [listsAsArray, vocabulary],
  );

  const sortedVocabulary = useMemo(
    () =>
      [...wordsWithList].sort(
        (a, b) => b[0].createdAt.getTime() - a[0].createdAt.getTime(),
      ),
    [wordsWithList],
  );

  const filteredVocabulary = useMemo(() => {
    const q = search.toLowerCase();
    return sortedVocabulary
      .filter(([word]) => {
        if (word.name.toLowerCase().includes(q)) return true;
        return word.translations.some((t) => {
          const tWord = vocabulary.get(t);
          return tWord?.name.toLowerCase().includes(q) ?? false;
        });
      })
      .slice(0, 20);
  }, [search, sortedVocabulary, vocabulary]);

  const filteredList = useMemo(() => {
    const q = search.toLowerCase();
    return listsAsArray
      .filter((list) => list.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [listsAsArray, search]);

  const isSearching = search.length > 0;

  return (
    <div className="space-y-4 px-2">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search"
        className="bg-muted/40"
      />

      {listsAsArray.length === 0 && !isSearching ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No lists yet. Tap + to create your first list or word.
        </div>
      ) : null}

      {isSearching ? (
        <>
          {filteredVocabulary.length > 0 ? (
            <section className="space-y-1">
              <h2 className="px-1 text-sm font-semibold text-muted-foreground">
                Vocabulary
              </h2>
              <div className="rounded-xl bg-card/60 py-1">
                {filteredVocabulary.map(([word, list]) => (
                  <WordRow key={word.slug} word={word} list={list} />
                ))}
              </div>
            </section>
          ) : null}
          {filteredList.length > 0 ? (
            <section className="space-y-1">
              <h2 className="px-1 text-sm font-semibold text-muted-foreground">
                Lists
              </h2>
              <div className="rounded-xl bg-card/60 py-1">
                {filteredList.map((list) => (
                  <ListRow key={list.slug} list={list} />
                ))}
              </div>
            </section>
          ) : null}
          {filteredVocabulary.length === 0 && filteredList.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">No matches.</p>
          ) : null}
        </>
      ) : (
        <>
          {sortedVocabulary.length > 0 ? (
            <section className="space-y-1">
              <h2 className="px-1 text-sm font-semibold text-muted-foreground">
                Recently
              </h2>
              <div className="rounded-xl bg-card/60 py-1">
                {sortedVocabulary.slice(0, 20).map(([word, list]) => (
                  <WordRow key={word.slug} word={word} list={list} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-1">
            <h2 className="px-1 text-sm font-semibold text-muted-foreground">
              Lists
            </h2>
            <div className="rounded-xl bg-card/60 py-1">
              {listsAsArray.map((list) => (
                <ListRow key={list.slug} list={list} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
