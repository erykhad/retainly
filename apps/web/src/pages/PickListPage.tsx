import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

import { ListIcon } from "@/components/ListIcon";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/stores";

export function PickListPage() {
  const navigate = useNavigate();
  const lists = useAppStore((state) => state.lists);

  return (
    <div className="space-y-4 px-2">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <h2 className="font-semibold">Pick a list</h2>
        <span className="w-16" />
      </div>

      <div className="rounded-xl bg-card/60 py-1">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60"
          onClick={() => navigate("/new", { replace: true })}
        >
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-medium">Auto (Gemini)</span>
            <span className="text-xs text-muted-foreground">
              Pick an existing category or create one
            </span>
          </span>
        </button>

        {Array.from(lists.values()).map((list) => (
          <button
            key={list.slug}
            type="button"
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60"
            onClick={() =>
              navigate(`/new?listSlug=${encodeURIComponent(list.slug)}`, {
                replace: true,
              })
            }
          >
            <ListIcon icon={list.icon} color={list.color} />
            <span className="font-medium">{list.name}</span>
          </button>
        ))}
        {lists.size === 0 ? (
          <p className="px-3 py-6 text-sm text-muted-foreground">
            No lists yet. Auto will create one with Gemini.
          </p>
        ) : null}
      </div>
    </div>
  );
}
