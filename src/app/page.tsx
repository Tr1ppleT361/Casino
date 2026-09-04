"use client";

import { Clock3, Flame, Gem, Spade, Sparkles, Star } from "lucide-react";
import { CategoryRail } from "@/components/casino/category-rail";
import { CrashSpotlight } from "@/components/casino/crash-spotlight";
import { DemoNotice } from "@/components/casino/demo-notice";
import { GameRow } from "@/components/casino/game-row";
import { Hero } from "@/components/casino/hero";
import { GAMES, gamesInCategory, getGame } from "@/lib/games";
import { useCasino } from "@/store/casino";
import { useHydrated } from "@/hooks/use-hydrated";

export default function LobbyPage() {
  const favorites = useCasino((state) => state.favorites);
  const recent = useCasino((state) => state.recent);
  const hydrated = useHydrated();

  const favoriteGames = hydrated
    ? favorites.map(getGame).filter((game): game is NonNullable<typeof game> => Boolean(game))
    : [];
  const recentGames = hydrated
    ? recent.map(getGame).filter((game): game is NonNullable<typeof game> => Boolean(game))
    : [];

  const tableGames = GAMES.filter((game) =>
    game.categories.some((category) =>
      ["blackjack", "roulette", "baccarat"].includes(category),
    ),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:py-8">
      <Hero />

      <CategoryRail />

      <CrashSpotlight />

      <GameRow
        title="Popular"
        subtitle="Was gerade am meisten gespielt wird"
        games={gamesInCategory("popular")}
        href="/category/popular"
        icon={Flame}
      />

      <GameRow
        title="Originals"
        subtitle="Hauseigene Demo-Spiele mit transparenter Zufallslogik"
        games={gamesInCategory("originals")}
        href="/category/originals"
        icon={Sparkles}
      />

      <GameRow
        title="Slots"
        subtitle="Eigene Themen, 5 Walzen, Freispiele und Multiplikatoren"
        games={gamesInCategory("slots")}
        href="/category/slots"
        icon={Gem}
      />

      <GameRow
        title="Table Games"
        subtitle="Blackjack, Roulette und Baccarat"
        games={tableGames}
        href="/category/blackjack"
        icon={Spade}
      />

      {recentGames.length > 0 && (
        <GameRow
          title="Recently Played"
          subtitle="Dort weitermachen, wo du aufgehört hast"
          games={recentGames}
          href="/category/recent"
          icon={Clock3}
        />
      )}

      {favoriteGames.length > 0 && (
        <GameRow
          title="Favorites"
          subtitle="Deine markierten Spiele"
          games={favoriteGames}
          href="/category/favorites"
          icon={Star}
        />
      )}

      <DemoNotice />
    </div>
  );
}
