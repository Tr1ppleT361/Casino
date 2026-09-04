import type { RoundRandom } from "@/lib/rng";

/**
 * Shared 5x3 slot engine.
 *
 * Every theme plugs its own symbol art into the same maths: identical reel
 * weights, paytable, paylines and free-spin rules. That keeps the RTP
 * consistent across all six machines and means a new theme is a data change,
 * never new game logic.
 */

export const REELS = 5;
export const ROWS = 3;

export type SymbolTier = "low" | "mid" | "high" | "wild" | "scatter";

export interface SlotSymbol {
  id: string;
  glyph: string;
  tier: SymbolTier;
  color: string;
}

export interface SlotTheme {
  slug: string;
  name: string;
  subtitle: string;
  background: string;
  symbols: SlotSymbol[];
}

/** Line pays as a multiple of the stake on that payline. */
export const PAYTABLE: Record<SymbolTier, Record<3 | 4 | 5, number>> = {
  low: { 3: 9, 4: 26, 5: 88 },
  mid: { 3: 17, 4: 54, 5: 176 },
  high: { 3: 44, 4: 137, 5: 518 },
  wild: { 3: 88, 4: 342, 5: 1710 },
  scatter: { 3: 0, 4: 0, 5: 0 },
};

/** Scatter pays as a multiple of the *total* stake, paid anywhere on the reels. */
export const SCATTER_PAYS: Record<3 | 4 | 5, number> = { 3: 4, 4: 17, 5: 88 };

export const FREE_SPINS_AWARDED = 10;
export const FREE_SPIN_MULTIPLIER = 2;

/** How often each tier appears on a reel strip. */
export const TIER_WEIGHTS: Record<SymbolTier, number> = {
  low: 9,
  mid: 5,
  high: 3,
  wild: 2,
  scatter: 2,
};

export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
];

export const LINE_COUNT = PAYLINES.length;

/** Expand a theme's symbols into a weighted reel strip. */
export function buildStrip(theme: SlotTheme): SlotSymbol[] {
  const strip: SlotSymbol[] = [];
  for (const symbol of theme.symbols) {
    const weight = TIER_WEIGHTS[symbol.tier];
    for (let i = 0; i < weight; i++) strip.push(symbol);
  }
  return strip;
}

export type Grid = SlotSymbol[][];

/** Spin the reels: `grid[reel][row]`. */
export function spinGrid(random: RoundRandom, strip: SlotSymbol[]): Grid {
  const grid: Grid = [];
  for (let reel = 0; reel < REELS; reel++) {
    const column: SlotSymbol[] = [];
    for (let row = 0; row < ROWS; row++) {
      column.push(strip[random.nextInt(strip.length)]);
    }
    grid.push(column);
  }
  return grid;
}

export interface LineWin {
  line: number;
  symbol: SlotSymbol;
  count: number;
  /** Multiple of the per-line stake. */
  pay: number;
  positions: [number, number][];
}

export interface SpinResult {
  grid: Grid;
  lineWins: LineWin[];
  scatterCount: number;
  /** Multiple of the total stake paid by scatters. */
  scatterPay: number;
  /** Total payout as a multiple of the total stake. */
  totalMultiplier: number;
  freeSpinsWon: number;
}

/** Evaluate a spun grid. `lineStake` is 1/LINE_COUNT of the total stake. */
export function evaluateSpin(grid: Grid): SpinResult {
  const lineWins: LineWin[] = [];

  PAYLINES.forEach((line, lineIndex) => {
    const symbols = line.map((row, reel) => grid[reel][row]);

    // The paying symbol is the first non-wild; all-wild lines pay as wild.
    const first = symbols.find((symbol) => symbol.tier !== "wild") ?? symbols[0];
    if (first.tier === "scatter") return;

    // `first` is never a scatter here, so wilds always substitute.
    let count = 0;
    for (const symbol of symbols) {
      if (symbol.id !== first.id && symbol.tier !== "wild") break;
      count += 1;
    }

    if (count < 3) return;

    const tier: SymbolTier = symbols
      .slice(0, count)
      .every((symbol) => symbol.tier === "wild")
      ? "wild"
      : first.tier;
    const pay = PAYTABLE[tier][count as 3 | 4 | 5];
    if (pay <= 0) return;

    lineWins.push({
      line: lineIndex,
      symbol: first,
      count,
      pay,
      positions: line.slice(0, count).map((row, reel) => [reel, row] as [number, number]),
    });
  });

  let scatterCount = 0;
  for (const column of grid) {
    for (const symbol of column) {
      if (symbol.tier === "scatter") scatterCount += 1;
    }
  }

  const scatterPay =
    scatterCount >= 3 ? SCATTER_PAYS[Math.min(scatterCount, 5) as 3 | 4 | 5] : 0;

  const lineTotal = lineWins.reduce((sum, win) => sum + win.pay, 0) / LINE_COUNT;

  return {
    grid,
    lineWins,
    scatterCount,
    scatterPay,
    totalMultiplier: lineTotal + scatterPay,
    freeSpinsWon: scatterCount >= 3 ? FREE_SPINS_AWARDED : 0,
  };
}
