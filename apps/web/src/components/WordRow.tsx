import { PlayCircle } from "lucide-react";
import { Link } from "react-router";

import type { List, Word } from "@retainly/core";

import { speak } from "@/lib/speak";
import { useAppStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";

export function WordRow({ word, list }: { word: Word; list: List }) {
  const firstTranslation = useAppStore((state) => {
    const slug = word.translations[0];
    return slug ? state.vocabulary.get(slug) : undefined;
  });

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/60">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        style={{ color: list.color }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          speak(word.name);
        }}
        aria-label={`Speak ${word.name}`}
      >
        <PlayCircle />
      </Button>
      <Link
        to={`/lists/${list.slug}/${word.slug}`}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <span className="truncate font-medium">{word.name}</span>
        {firstTranslation ? (
          <span className="truncate text-sm text-muted-foreground">
            {firstTranslation.name}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
