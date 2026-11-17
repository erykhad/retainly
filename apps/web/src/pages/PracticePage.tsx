import { Euro, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";

import type { Word } from "@retainly/core";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useAppStore, useGeminiStore, usePreferencesStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

function shuffle<T>(array: T[]): T[] {
  const next = [...array];
  let i = next.length;
  while (--i > 0) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function PracticePage() {
  const { listSlug = "" } = useParams();
  const navigate = useNavigate();
  const list = useAppStore((state) => state.lists.get(listSlug));
  const vocabulary = useAppStore((state) => state.vocabulary);
  const shouldShuffle = usePreferencesStore((state) => state.shuffleWordsInList);
  const practiceMode = usePreferencesStore((state) => state.practiceMode);
  const setPracticeMode = usePreferencesStore((state) => state.setPracticeMode);

  const words = useMemo(() => {
    if (!list) return [] as Word[];
    const listWords = list.words
      .map((slug) => vocabulary.get(slug))
      .filter((w): w is Word => w !== undefined);
    return shouldShuffle ? shuffle(listWords) : listWords;
  }, [list, shouldShuffle, vocabulary]);

  if (!list) return <Navigate to="/" replace />;

  return (
    <div className="flex h-full min-h-[70vh] flex-col gap-4 px-2">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Close
        </Button>
        <h2 className="font-semibold">Practice</h2>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="Toggle practice mode"
          onClick={() =>
            setPracticeMode(
              practiceMode === "translations"
                ? "no-translations"
                : "translations",
            )
          }
        >
          {practiceMode === "translations" ? <Wallet /> : <Euro />}
        </Button>
      </div>

      {words.length === 0 ? (
        <p className="px-2 text-sm text-muted-foreground">
          This list has no words to practice.
        </p>
      ) : (
        <Carousel className="mx-auto w-full max-w-md">
          <CarouselContent>
            {words.map((word) => (
              <CarouselItem key={word.slug}>
                <WordPracticeCard word={word} vocabulary={vocabulary} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}
    </div>
  );
}

function WordPracticeCard({
  word,
  vocabulary,
}: {
  word: Word;
  vocabulary: Map<string, Word>;
}) {
  const [isBlurred, setIsBlurred] = useState(true);
  const sentences = useGeminiStore((state) => state.getSentences(word.name));
  const practiceMode = usePreferencesStore((state) => state.practiceMode);

  const translations = word.translations
    .map((slug) => vocabulary.get(slug))
    .filter((w): w is Word => !!w);

  return (
    <button
      type="button"
      className="flex min-h-[420px] w-full flex-col rounded-2xl bg-card/70 p-6 text-left"
      onClick={() => setIsBlurred((value) => !value)}
    >
      {isBlurred ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          {practiceMode === "translations" && translations.length > 0 ? (
            translations.map((t) => (
              <p key={t.slug} className="text-center text-3xl font-bold">
                {t.name}
              </p>
            ))
          ) : (
            <p className="text-center text-3xl font-bold">{word.name}</p>
          )}
          <p className="text-sm text-muted-foreground">Tap to reveal</p>
        </div>
      ) : (
        <div className="space-y-6">
          {translations.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                Translations
              </h3>
              {practiceMode === "translations" ? (
                <p className="text-lg">• {word.name}</p>
              ) : (
                translations.map((t) => (
                  <p key={t.slug} className="text-lg">
                    • {t.name}
                  </p>
                ))
              )}
            </section>
          ) : null}

          {sentences.length > 0 ? (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                Sentences
              </h3>
              {sentences.map((s) => (
                <div key={s.id} className="mb-3">
                  <p className="text-base">{s.text}</p>
                  {s.translations.map((t) => (
                    <p
                      key={t.id}
                      className="text-sm italic text-muted-foreground"
                    >
                      {t.text}
                    </p>
                  ))}
                </div>
              ))}
            </section>
          ) : null}

          {translations.length === 0 && sentences.length === 0 ? (
            <p className={cn("text-lg text-muted-foreground")}>
              No translations or sentences available.
            </p>
          ) : null}
        </div>
      )}
    </button>
  );
}
