import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ellipsis, GripVertical, Play, Plus, Trash2 } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router";

import type { List, Word } from "@retainly/core";

import { ListIcon } from "@/components/ListIcon";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { speak } from "@/lib/speak";
import { useAppStore, usePreferencesStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

function SortableWord({
  word,
  list,
  onDelete,
}: {
  word: Word;
  list: List;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: word.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const firstTranslation = useAppStore((state) => {
    const slug = word.translations[0];
    return slug ? state.vocabulary.get(slug) : undefined;
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg bg-card/40 px-2 py-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        style={{ color: list.color }}
        onClick={() => speak(word.name)}
        aria-label={`Speak ${word.name}`}
      >
        <Play />
      </Button>
      <Link
        to={`/lists/${list.slug}/${word.slug}`}
        className="flex min-w-0 flex-1 flex-col"
      >
        <span className="truncate font-medium">{word.name}</span>
        {firstTranslation ? (
          <span className="truncate text-sm text-muted-foreground">
            {firstTranslation.name}
          </span>
        ) : null}
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label={`Delete ${word.name}`}
      >
        <Trash2 className="text-destructive" />
      </Button>
    </div>
  );
}

export function ListPage() {
  const { listSlug = "" } = useParams();
  const navigate = useNavigate();
  const list = useAppStore((state) => state.lists.get(listSlug));
  const vocabulary = useAppStore((state) => state.vocabulary);
  const deleteWord = useAppStore((state) => state.deleteWord);
  const shuffleWordsInList = usePreferencesStore(
    (state) => state.shuffleWordsInList,
  );
  const setShuffleWordsInList = usePreferencesStore(
    (state) => state.setShuffleWordsInList,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  if (!list) return <Navigate to="/" replace />;

  const listWords = list.words
    .map((slug) => vocabulary.get(slug))
    .filter((w): w is Word => w !== undefined);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = listWords.findIndex((w) => w.slug === active.id);
    const newIndex = listWords.findIndex((w) => w.slug === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(listWords, oldIndex, newIndex).map((w) => w.slug);

    useAppStore.setState((state) => {
      const current = state.lists.get(list.slug);
      if (!current) return state;
      return {
        lists: new Map(state.lists).set(list.slug, {
          ...current,
          words: next,
          updatedAt: new Date(),
        }),
      };
    });
  };

  return (
    <div className="space-y-4 px-2">
      <div className="flex items-start justify-between gap-2">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Back
        </Button>
        <div className="flex items-center gap-1">
          <Link
            to={`/new?listSlug=${list.slug}`}
            aria-label="Add word to list"
            className={cn(buttonVariants({ variant: "secondary", size: "icon" }))}
          >
            <Plus />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="secondary" size="icon" aria-label="List options" />
              }
            >
              <Ellipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={shuffleWordsInList}
                onCheckedChange={(checked) =>
                  setShuffleWordsInList(Boolean(checked))
                }
              >
                Shuffle words
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <ListIcon
          icon={list.icon}
          color={list.color}
          className="size-16"
          size={28}
        />
        <div>
          <h2 className="text-2xl font-bold">{list.name}</h2>
          <p className="text-sm text-muted-foreground">
            {list.words.length} words saved
          </p>
        </div>
        <Link
          to={`/practice/${list.slug}`}
          className={cn(buttonVariants({ variant: "default" }), "gap-2")}
        >
          <Play />
          Practice
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={listWords.map((w) => w.slug)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {listWords.map((word) => (
              <SortableWord
                key={word.slug}
                word={word}
                list={list}
                onDelete={() => deleteWord(word.slug)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
