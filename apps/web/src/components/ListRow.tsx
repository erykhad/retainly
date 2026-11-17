import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import type { List } from "@retainly/core";

import { ListIcon } from "@/components/ListIcon";

export function ListRow({ list }: { list: List }) {
  return (
    <Link
      to={`/lists/${list.slug}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60"
    >
      <ListIcon icon={list.icon} color={list.color} />
      <span className="flex-1 truncate font-medium">{list.name}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
