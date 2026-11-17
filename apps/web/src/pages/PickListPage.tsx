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
            No lists yet. Create a list first.
          </p>
        ) : null}
      </div>
    </div>
  );
}
