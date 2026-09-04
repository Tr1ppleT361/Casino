"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Star } from "lucide-react";
import { GameThumb } from "@/components/casino/game-thumb";
import { useCasino } from "@/store/casino";
import { useHydrated } from "@/hooks/use-hydrated";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type { GameDefinition } from "@/types";

export function GameCard({
  game,
  className,
  size = "default",
}: {
  game: GameDefinition;
  className?: string;
  size?: "default" | "wide";
}) {
  const favorites = useCasino((state) => state.favorites);
  const toggleFavorite = useCasino((state) => state.toggleFavorite);
  const hydrated = useHydrated();
  const isFavorite = hydrated && favorites.includes(game.slug);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn("group relative", className)}
    >
      <Link
        href={`/game/${game.slug}`}
        className="block overflow-hidden rounded-2xl border border-white/[0.07] bg-card shadow-card transition-all duration-300 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <div className={cn("relative", size === "wide" ? "aspect-[16/9]" : "aspect-[4/5]")}>
          <GameThumb game={game} className="absolute inset-0 h-full w-full text-5xl" />

          <div className="absolute inset-0 flex flex-col justify-end p-3">
            <span className="translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-black shadow-lg">
                <Play className="h-3 w-3 fill-black" />
                Demo spielen
              </span>
            </span>
          </div>

          <div className="absolute left-2.5 top-2.5 flex gap-1.5">
            {game.featured && (
              <span className="rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-gold backdrop-blur-sm">
                Featured
              </span>
            )}
            <span className="rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/80 backdrop-blur-sm">
              RTP {game.rtp}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-foreground">
              {game.name}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {game.tagline}
            </span>
          </span>
          <span className="tabular shrink-0 rounded-lg bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-muted-foreground">
            {game.maxWin}
          </span>
        </div>
      </Link>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          toggleFavorite(game.slug);
          playSound("click");
        }}
        className={cn(
          "absolute right-2.5 top-2.5 rounded-full p-1.5 backdrop-blur-sm transition-all hover:scale-110",
          isFavorite
            ? "bg-gold/25 text-gold"
            : "bg-black/40 text-white/60 opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        )}
        aria-label={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
        aria-pressed={isFavorite}
      >
        <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-gold")} />
      </button>
    </motion.div>
  );
}
