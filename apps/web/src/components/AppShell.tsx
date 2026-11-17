import { Bookmark, Home, Plus, ScanLine } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell() {
  const location = useLocation();
  const hideNav =
    location.pathname.startsWith("/new") ||
    location.pathname.startsWith("/practice") ||
    location.pathname.endsWith("/translation");

  return (
    <div className="dark mx-auto flex min-h-svh w-full max-w-lg flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Retainly
          </p>
          <h1 className="text-lg font-semibold">Browse</h1>
        </div>
        <Link
          to="/new"
          aria-label="Create list or word"
          className={cn(buttonVariants({ variant: "secondary", size: "icon" }))}
        >
          <Plus />
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-2 pb-24 pt-2">
        <Outlet />
      </main>

      {!hideNav ? (
        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-lg items-center justify-around border-t border-border/60 bg-background/95 px-4 py-2 backdrop-blur">
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 text-xs",
              location.pathname === "/"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            <Home className="size-5" />
            Home
          </Link>
          <button
            type="button"
            disabled
            className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground/50"
          >
            <ScanLine className="size-5" />
            Scanner
          </button>
          <button
            type="button"
            disabled
            className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground/50"
          >
            <Bookmark className="size-5" />
            Bookmarks
          </button>
        </nav>
      ) : null}
    </div>
  );
}
