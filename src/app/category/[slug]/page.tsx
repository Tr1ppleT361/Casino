"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { CategoryRail } from "@/components/casino/category-rail";
import { DemoNotice } from "@/components/casino/demo-notice";
import { GameCard } from "@/components/casino/game-card";
import { CATEGORY_LABELS, CATEGORY_ORDER, gamesInCategory, getGame } from "@/lib/games";
import { useCasino } from "@/store/casino";
import { useHydrated } from "@/hooks/use-hydrated";
import type { GameCategory } from "@/types";

const DESCRIPTIONS: Partial<Record<GameCategory, string>> = {
  popular: "Die meistgespielten Demo-Titel der Lobby.",
  originals: "Hauseigene Spiele mit transparenter, nachprüfbarer Zufallslogik.",
  slots: "Eigene Slot-Themen mit Wilds, Scattern, Freispielen und Multiplikatoren.",
  favorites: "Alles, was du mit dem Stern markiert hast.",
  recent: "Zuletzt gespielte Demo-Runden.",
};

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const favorites = useCasino((state) => state.favorites);
  const recent = useCasino((state) => state.recent);
  const hydrated = useHydrated();

  if (!CATEGORY_ORDER.includes(slug as GameCategory)) notFound();
  const category = slug as GameCategory;

  const games =
    category === "favorites"
      ? (hydrated ? favorites : []).map(getGame).filter(Boolean)
      : category === "recent"
        ? (hydrated ? recent : []).map(getGame).filter(Boolean)
        : gamesInCategory(category);

  const list = games as NonNullable<ReturnType<typeof getGame>>[];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          {CATEGORY_LABELS[category]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {DESCRIPTIONS[category] ??
            `Alle Demo-Spiele in der Kategorie ${CATEGORY_LABELS[category]}.`}
        </p>
      </div>

      <CategoryRail active={category} />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-sm font-semibold">Hier ist noch nichts.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {category === "favorites"
              ? "Markiere Spiele mit dem Stern, um sie hier zu sammeln."
              : category === "recent"
                ? "Spiele eine Demo-Runde, dann taucht sie hier auf."
                : "In dieser Kategorie gibt es aktuell keine Spiele."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {list.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      )}

      <DemoNotice />
    </div>
  );
}
