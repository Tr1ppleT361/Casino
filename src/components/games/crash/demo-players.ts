import { RoundRandom } from "@/lib/rng";

/**
 * Simulated table companions. They are cosmetic only - clearly labelled as
 * demo players in the UI, they never influence a round and no real accounts
 * exist behind them.
 */
const NAMES = [
  "NeonFox", "ChipWizard", "LunaBets", "TurboKoala", "VoltRider", "MintDragon",
  "PixelSeven", "OrbitAce", "CandyVault", "RoyalMoth", "ZenTiger", "NovaClover",
  "BitBanana", "GlacierJoe", "SolarLynx", "EchoQueen", "RapidPanda", "MidnightOx",
  "CosmicPear", "IronFinch", "JollyRhino", "SilkHawk", "AmberWolf", "QuietCobra",
];

export interface DemoPlayer {
  id: string;
  name: string;
  /** Stake in base demo units. */
  bet: number;
  /** Multiplier the bot will bail out at, or null if it rides to the crash. */
  target: number | null;
  cashedAt: number | null;
}

export function buildDemoPlayers(random: RoundRandom, count = 14): DemoPlayer[] {
  const names = random.shuffle(NAMES).slice(0, count);
  return names.map((name, index) => {
    const roll = random.next();
    // Most bots pick a modest target; a few let it ride.
    const target =
      roll < 0.12 ? null : Math.round((1.15 + random.next() ** 2 * 14) * 100) / 100;
    const bet = Math.round((0.1 + random.next() ** 3 * 120) * 100) / 100;
    return {
      id: `${name}-${index}`,
      name,
      bet,
      target,
      cashedAt: null,
    };
  });
}

export function settleDemoPlayers(
  players: DemoPlayer[],
  multiplier: number,
): DemoPlayer[] {
  let changed = false;
  const next = players.map((player) => {
    if (player.cashedAt !== null || player.target === null) return player;
    if (multiplier >= player.target) {
      changed = true;
      return { ...player, cashedAt: player.target };
    }
    return player;
  });
  return changed ? next : players;
}
