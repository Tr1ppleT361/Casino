"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { GAMES, searchGames } from "@/lib/games";
import { GameThumb } from "@/components/casino/game-thumb";

export function SearchCommand({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(
    () => (query.trim() ? searchGames(query) : GAMES.filter((game) => game.featured)),
    [query],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-xl border border-white/[0.07] bg-surface-sunken px-3 py-2 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground ${className ?? ""}`}
        aria-label="Spiele durchsuchen"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Spiele suchen…</span>
        <kbd className="ml-4 hidden rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] lg:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Spiele durchsuchen</DialogTitle>
            <DialogDescription>
              {GAMES.length} Demo-Spiele – alle ausschließlich mit virtuellem Guthaben.
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Crash, Slots, Blackjack …"
          />

          <div className="-mx-1 max-h-80 space-y-1 overflow-y-auto px-1">
            {results.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nichts gefunden für „{query}“.
              </p>
            )}
            {results.map((game) => (
              <Link
                key={game.slug}
                href={`/game/${game.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.06]"
              >
                <GameThumb game={game} className="h-12 w-12 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{game.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {game.tagline}
                  </span>
                </span>
                <span className="tabular text-xs text-muted-foreground">
                  RTP {game.rtp}%
                </span>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
