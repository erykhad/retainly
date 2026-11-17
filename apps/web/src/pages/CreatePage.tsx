import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { slugify } from "@retainly/core";

import { ListIcon } from "@/components/ListIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CategorizeWordError,
  categorizeWordWithGemini,
} from "@/lib/categorizeWord";
import { CREATE_ICONS, resolveListIcon } from "@/lib/icons";
import { PALETTE } from "@/lib/palette";
import { useAppStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const listSlug = params.get("listSlug") ?? undefined;

  const lists = useAppStore((state) => state.lists);
  const addWord = useAppStore((state) => state.addWord);
  const addList = useAppStore((state) => state.addList);
  const assignWordToList = useAppStore((state) => state.assignWordToList);

  const hasLists = lists.size > 0;
  const selectedList = listSlug ? lists.get(listSlug) : undefined;

  const [segment, setSegment] = useState<"vocabulary" | "list">(
    hasLists ? "vocabulary" : "list",
  );
  const [selectedColor, setSelectedColor] = useState<string>(PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState<(typeof CREATE_ICONS)[number]>(
    CREATE_ICONS[0],
  );
  const [withContext, setWithContext] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", notes: "" },
  });

  const resolveListSlugForWord = async (
    wordName: string,
    wordNotes: string,
  ): Promise<string | null> => {
    if (selectedList) return selectedList.slug;

    setIsCategorizing(true);
    try {
      const result = await categorizeWordWithGemini({
        word: wordName,
        notes: wordNotes,
        existingLists: Array.from(lists.values()).map((list) => ({
          slug: list.slug,
          name: list.name,
          notes: list.notes,
        })),
        allowedIcons: CREATE_ICONS,
        allowedColors: PALETTE,
      });

      if (result.action === "select") {
        const list = lists.get(result.listSlug);
        toast.success(
          list
            ? `Added to “${list.name}”`
            : `Added to list ${result.listSlug}`,
          { description: result.reason },
        );
        return result.listSlug;
      }

      const createdSlug = addList({
        name: result.name,
        notes: result.notes,
        icon: result.icon,
        color: result.color,
      });
      if (!createdSlug) {
        // Name collision — reuse the existing list with that slug.
        const existing = slugify(result.name);
        if (useAppStore.getState().lists.has(existing)) {
          toast.success(`Added to “${result.name}”`, {
            description: result.reason,
          });
          return existing;
        }
        toast.error("Could not create the suggested category");
        return null;
      }

      toast.success(`Created “${result.name}” and added the word`, {
        description: result.reason,
      });
      return createdSlug;
    } catch (err) {
      const message =
        err instanceof CategorizeWordError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to categorize word";
      toast.error(message);
      return null;
    } finally {
      setIsCategorizing(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (segment === "vocabulary") {
      const targetListSlug = await resolveListSlugForWord(
        values.name,
        values.notes ?? "",
      );
      // If auto-categorize failed, do not create an orphan word.
      if (!selectedList && !targetListSlug) return;

      const slug = addWord({
        name: values.name,
        notes: values.notes ?? "",
        language: "english",
      });
      if (!slug) {
        toast.error("A word with that name already exists");
        return;
      }
      if (targetListSlug) assignWordToList(targetListSlug, slug);
      if (selectedList) {
        toast.success("Word created");
      }
    } else {
      const slug = addList({
        name: values.name,
        notes: values.notes ?? "",
        icon: selectedIcon,
        color: selectedColor,
      });
      if (!slug) {
        toast.error("A list with that name already exists");
        return;
      }
      toast.success("List created");
    }
    navigate(-1);
  });

  return (
    <div className="space-y-4 px-2">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate(-1)}
          disabled={isCategorizing}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="icon"
          onClick={onSubmit}
          aria-label="Save"
          disabled={isCategorizing}
        >
          <Check />
        </Button>
      </div>

      <Tabs
        value={segment}
        onValueChange={(value) => setSegment(value as "vocabulary" | "list")}
      >
        <TabsList className="w-full">
          <TabsTrigger
            value="vocabulary"
            className="flex-1"
            disabled={isCategorizing}
          >
            Vocabulary
          </TabsTrigger>
          <TabsTrigger
            value="list"
            className="flex-1"
            disabled={isCategorizing}
          >
            List
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Name"
            disabled={isCategorizing}
          />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            {...form.register("notes")}
            placeholder="Notes"
            disabled={isCategorizing}
          />
        </div>

        {segment === "vocabulary" ? (
          <div className="space-y-3 rounded-xl bg-card/60 p-3">
            <Link
              to="/new/pick-list"
              className={cn(
                "flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-muted/50",
                isCategorizing && "pointer-events-none opacity-60",
              )}
            >
              {selectedList ? (
                <ListIcon icon={selectedList.icon} color={selectedList.color} />
              ) : (
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Sparkles className="size-4" />
                </span>
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">
                  {selectedList ? selectedList.name : "Auto (Gemini)"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {selectedList
                    ? "Tap to change list"
                    : "Leave empty — Gemini picks or creates a category"}
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
            {isCategorizing ? (
              <p className="px-1 text-sm text-muted-foreground">
                Asking Gemini to choose a category…
              </p>
            ) : null}
            <div className="flex items-center justify-between px-1">
              <Label htmlFor="with-context">With Context</Label>
              <Switch
                id="with-context"
                checked={withContext}
                onCheckedChange={setWithContext}
                disabled={isCategorizing}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 rounded-xl bg-card/60 p-3">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Color</p>
              <div className="grid grid-cols-6 gap-3">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Color ${color}`}
                    className={cn(
                      "size-10 rounded-full border-2",
                      selectedColor === color
                        ? "border-foreground"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Icon</p>
              <div className="grid grid-cols-6 gap-3">
                {CREATE_ICONS.map((icon) => {
                  const Icon = resolveListIcon(icon);
                  return (
                    <button
                      key={icon}
                      type="button"
                      aria-label={`Icon ${icon}`}
                      className={cn(
                        "inline-flex size-10 items-center justify-center rounded-full bg-muted",
                        selectedIcon === icon && "ring-2 ring-foreground",
                      )}
                      onClick={() => setSelectedIcon(icon)}
                    >
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
