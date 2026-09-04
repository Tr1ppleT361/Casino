"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/casino/demo-notice";
import { useCasino } from "@/store/casino";
import { useHydrated } from "@/hooks/use-hydrated";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type { GameDefinition } from "@/types";

/**
 * Shared frame for every game page: title bar, the controls column and the
 * board area. On mobile the board comes first and the controls stack below,
 * which is how the native casino apps lay this out.
 */
export function GameShell({
  game,
  controls,
  board,
  belowBoard,
  className,
}: {
  game: GameDefinition;
  controls: React.ReactNode;
  board: React.ReactNode;
  belowBoard?: React.ReactNode;
  className?: string;
}) {
  const favorites = useCasino((state) => state.favorites);
  const toggleFavorite = useCasino((state) => state.toggleFavorite);
  const hydrated = useHydrated();
  const isFavorite = hydrated && favorites.includes(game.slug);

  return (
    <div className={cn("mx-auto max-w-7xl space-y-4 px-4 py-5 sm:py-6", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" aria-label="Zurück zur Lobby">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">
            {game.name}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{game.tagline}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden sm:inline-flex">
            RTP {game.rtp}%
          </Badge>
          <Badge variant="gold" className="hidden md:inline-flex">
            Max {game.maxWin}
          </Badge>
          <Button
            variant={isFavorite ? "gold" : "secondary"}
            size="icon-sm"
            onClick={() => {
              toggleFavorite(game.slug);
              playSound("click");
            }}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr] xl:grid-cols-[22rem_1fr]">
        <div className="order-2 space-y-4 lg:order-1">
          <div className="rounded-2xl border border-white/[0.06] bg-card p-4 shadow-card">
            {controls}
          </div>
          <DemoNotice compact className="hidden lg:flex" />
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-sunken shadow-card">
            {board}
          </div>
          {belowBoard}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-gold" />
        <span>
          Ergebnisse werden vor dem Einsatz festgelegt.{" "}
          <Link href="/fairness" className="underline underline-offset-2 hover:text-foreground">
            So entsteht der Zufall
          </Link>
        </span>
      </div>
    </div>
  );
}
