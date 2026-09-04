"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GameCard } from "@/components/casino/game-card";
import { Button } from "@/components/ui/button";
import type { GameDefinition } from "@/types";

export function GameRow({
  title,
  subtitle,
  games,
  href,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  games: GameDefinition[];
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    scroller.current?.scrollBy({ left: direction * 480, behavior: "smooth" });
  };

  if (games.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-black tracking-tight sm:text-xl">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {href && (
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href={href}>Alle</Link>
            </Button>
          )}
          <Button
            variant="secondary"
            size="icon-sm"
            className="hidden sm:inline-flex"
            onClick={() => scroll(-1)}
            aria-label="Zurück scrollen"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            className="hidden sm:inline-flex"
            onClick={() => scroll(1)}
            aria-label="Weiter scrollen"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scroller}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {games.map((game) => (
          <GameCard
            key={game.slug}
            game={game}
            className="w-[44vw] shrink-0 snap-start sm:w-44 lg:w-48"
          />
        ))}
      </div>
    </section>
  );
}
