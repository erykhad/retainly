import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Ellipsis, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import {
  searchEnglishWithPolish,
  searchWithGemini,
  slugify,
  type TatoebaSentenceWithTranslations,
  type Word,
} from "@retainly/core";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore, useGeminiStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

const TATOEBA_BASE = "/tatoeba-api/v1";
const EMPTY_SENTENCES: TatoebaSentenceWithTranslations[] = [];

export function WordPage() {
  const { listSlug = "", wordSlug = "" } = useParams();
  const navigate = useNavigate();

  const vocabulary = useAppStore((state) => state.vocabulary);
  const updateWord = useAppStore((state) => state.updateWord);
  const deleteWord = useAppStore((state) => state.deleteWord);
  const word = vocabulary.get(wordSlug);

  const translationWords = useMemo(() => {
    if (!word) return [] as Word[];
    return word.translations
      .map((slug) => vocabulary.get(slug))
      .filter((w): w is Word => w !== undefined);
  }, [vocabulary, word]);

  const geminiKey = (word?.name ?? "").trim().toLowerCase();
  const storedGemini = useGeminiStore(
    (s) => s.entries[geminiKey]?.sentences ?? EMPTY_SENTENCES,
  );
  const mergeSentences = useGeminiStore((s) => s.mergeSentences);

  const [collapsedWords, setCollapsedWords] = useState<string[]>([]);
  const [segment, setSegment] = useState<"tatoeba" | "gemini-ai">("tatoeba");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [contextText, setContextText] = useState("");
  const [geminiRequested, setGeminiRequested] = useState(false);

  const tatoebaQuery = useInfiniteQuery({
    queryKey: ["tatoeba", word?.name ?? "", "eng-pol"],
    enabled: !!word && segment === "tatoeba",
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ pageParam }) =>
      searchEnglishWithPolish({
        query: word!.name,
        limit: 10,
        after: pageParam,
        baseUrl: TATOEBA_BASE,
      }),
    getNextPageParam: (lastPage) => lastPage.paging.next,
  });

  const geminiMutation = useMutation({
    mutationFn: async (additionalContext?: string) => {
      if (!word) {
        throw new Error("Word is missing");
      }
      return searchWithGemini({
        query: word.name,
        count: 5,
        direction: "eng-pol",
        additionalContext,
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      });
    },
    onSuccess: (result) => {
      if (!word) return;
      mergeSentences(word.name, result.sentences);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Gemini request failed");
    },
  });

  useEffect(() => {
    setGeminiRequested(false);
  }, [wordSlug]);

  useEffect(() => {
    if (segment !== "gemini-ai" || !word) return;
    if (storedGemini.length > 0) return;
    if (geminiRequested || geminiMutation.isPending) return;
    setGeminiRequested(true);
    geminiMutation.mutate(undefined);
    // mutate identity changes; gate with geminiRequested instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, wordSlug, storedGemini.length, geminiRequested]);

  if (!word) {
    return <Navigate to={`/lists/${listSlug}`} replace />;
  }

  const tatoebaSentences =
    tatoebaQuery.data?.pages.flatMap((page) => page.sentences) ?? [];
  const sentences = segment === "tatoeba" ? tatoebaSentences : storedGemini;

  const statusText =
    segment === "tatoeba"
      ? tatoebaQuery.isError
        ? "Failed to retrieve sentences"
        : tatoebaQuery.isLoading
          ? "Retrieving sentences..."
          : `Found ${tatoebaSentences.length} sentences`
      : geminiMutation.isError
        ? "Failed to generate sentences"
        : geminiMutation.isPending
          ? "Generating sentences..."
          : `Generated ${storedGemini.length} sentences`;

  return (
    <div className="space-y-4 px-2 pb-8">
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Back
        </Button>
        <div className="flex items-center gap-1">
          <Link
            to={`/lists/${listSlug}/${word.slug}/translation`}
            aria-label="Add translation"
            className={cn(
              buttonVariants({ variant: "secondary", size: "icon" }),
            )}
          >
            <Plus />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Word options"
                />
              }
            >
              <Ellipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditName(word.name);
                  setEditOpen(true);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold">{word.name}</h2>
        <div className="mt-4 space-y-3">
          {translationWords.map((translation) => {
            const open = collapsedWords.includes(translation.slug);
            return (
              <div key={translation.slug}>
                <button
                  type="button"
                  className="flex items-center gap-2 text-left"
                  onClick={() =>
                    setCollapsedWords((prev) =>
                      prev.includes(translation.slug)
                        ? prev.filter((s) => s !== translation.slug)
                        : [...prev, translation.slug],
                    )
                  }
                >
                  {open ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <span className="text-xl font-semibold text-muted-foreground">
                    {translation.name}
                  </span>
                  <Badge variant="secondary">B2</Badge>
                </button>
                {open ? (
                  <p className="pl-7 text-sm text-muted-foreground">-</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card/70 p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold">Examples of Usage</h3>
          <p className="text-sm text-muted-foreground">{statusText}</p>
        </div>

        <Tabs
          value={segment}
          onValueChange={(value) =>
            setSegment(value as "tatoeba" | "gemini-ai")
          }
        >
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="tatoeba" className="flex-1">
              Tatoeba
            </TabsTrigger>
            <TabsTrigger value="gemini-ai" className="flex-1">
              Gemini AI
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {(segment === "tatoeba" && tatoebaQuery.isLoading) ||
        (segment === "gemini-ai" &&
          geminiMutation.isPending &&
          storedGemini.length === 0) ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <div className="space-y-3">
            {sentences.map((sentence, index) => (
              <div key={`${sentence.id}-${index}`}>
                {index > 0 ? <Separator className="mb-3" /> : null}
                <p className="text-sm font-medium">{sentence.text}</p>
                {sentence.translations.map((t) => (
                  <p key={t.id} className="text-sm italic text-muted-foreground">
                    {t.text}
                  </p>
                ))}
              </div>
            ))}
            {sentences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sentences yet.</p>
            ) : null}
          </div>
        )}

        {segment === "tatoeba" && tatoebaQuery.hasNextPage ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full"
            disabled={tatoebaQuery.isFetchingNextPage}
            onClick={() => tatoebaQuery.fetchNextPage()}
          >
            {tatoebaQuery.isFetchingNextPage ? "Loading..." : "Show more"}
          </Button>
        ) : null}

        {segment === "gemini-ai" && !geminiMutation.isPending ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => setContextOpen(true)}
          >
            Generate more
          </Button>
        ) : null}
      </section>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit word</DialogTitle>
          </DialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Word name"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const trimmed = editName.trim();
                if (!trimmed) {
                  toast.error("Name is required");
                  return;
                }
                const nextSlug = slugify(trimmed);
                if (
                  nextSlug !== word.slug &&
                  useAppStore.getState().vocabulary.has(nextSlug)
                ) {
                  toast.error("A word with that name already exists");
                  return;
                }
                updateWord({
                  slug: word.slug,
                  name: trimmed,
                  notes: word.notes,
                });
                setEditOpen(false);
                if (nextSlug !== word.slug) {
                  navigate(`/lists/${listSlug}/${nextSlug}`, { replace: true });
                }
                toast.success("Word updated");
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete word?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes “{word.name}” from your vocabulary and every list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                deleteWord(word.slug);
                toast.success("Word deleted");
                navigate(`/lists/${listSlug}`);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={contextOpen} onOpenChange={setContextOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gemini AI</DialogTitle>
          </DialogHeader>
          <Input
            value={contextText}
            onChange={(e) => setContextText(e.target.value)}
            placeholder="Add context to generated sentences"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setContextOpen(false);
                geminiMutation.mutate(undefined);
              }}
            >
              Skip
            </Button>
            <Button
              type="button"
              onClick={() => {
                setContextOpen(false);
                geminiMutation.mutate(contextText.trim() || undefined);
                setContextText("");
              }}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
