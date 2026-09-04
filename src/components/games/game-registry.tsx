"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { SLOT_THEME_BY_SLUG } from "@/lib/slot-themes";

const Loading = () => (
  <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
    <Skeleton className="h-10 w-64" />
    <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  </div>
);

/**
 * Games are code-split: opening the lobby does not pull in every engine.
 * Adding a game means one entry here plus its registry entry in `lib/games`.
 */
const REGISTRY: Record<string, React.ComponentType> = {
  crash: dynamic(() => import("@/components/games/crash/crash-game").then((m) => m.CrashGame), {
    loading: Loading,
  }),
  mines: dynamic(() => import("@/components/games/mines-game").then((m) => m.MinesGame), {
    loading: Loading,
  }),
  dice: dynamic(() => import("@/components/games/dice-game").then((m) => m.DiceGame), {
    loading: Loading,
  }),
  limbo: dynamic(() => import("@/components/games/limbo-game").then((m) => m.LimboGame), {
    loading: Loading,
  }),
  plinko: dynamic(() => import("@/components/games/plinko-game").then((m) => m.PlinkoGame), {
    loading: Loading,
  }),
  wheel: dynamic(() => import("@/components/games/wheel-game").then((m) => m.WheelGame), {
    loading: Loading,
  }),
  towers: dynamic(() => import("@/components/games/towers-game").then((m) => m.TowersGame), {
    loading: Loading,
  }),
  coinflip: dynamic(
    () => import("@/components/games/coinflip-game").then((m) => m.CoinflipGame),
    { loading: Loading },
  ),
  blackjack: dynamic(
    () => import("@/components/games/blackjack-game").then((m) => m.BlackjackGame),
    { loading: Loading },
  ),
  roulette: dynamic(
    () => import("@/components/games/roulette-game").then((m) => m.RouletteGame),
    { loading: Loading },
  ),
  baccarat: dynamic(
    () => import("@/components/games/baccarat-game").then((m) => m.BaccaratGame),
    { loading: Loading },
  ),
};

const SlotMachine = dynamic(
  () => import("@/components/games/slots/slot-machine").then((m) => m.SlotMachine),
  { loading: Loading },
);

export function GameRenderer({ slug }: { slug: string }) {
  if (SLOT_THEME_BY_SLUG.has(slug)) return <SlotMachine slug={slug} />;

  const Game = REGISTRY[slug];
  if (!Game) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-black">Dieses Spiel ist nicht verfügbar.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Wähle ein anderes Demo-Spiel aus der Lobby.
        </p>
      </div>
    );
  }
  return <Game />;
}
