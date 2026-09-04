export type CurrencyId =
  | "EUR"
  | "USD"
  | "CREDITS"
  | "COINS"
  | "CHIPS"
  | "DIAMONDS"
  | "MILLIONAIRE"
  | "CUSTOM";

export interface CurrencyDefinition {
  id: CurrencyId;
  /** Display name, e.g. "Coins". */
  name: string;
  /** Short symbol, e.g. "€" or "MC". */
  symbol: string;
  /** Where the symbol sits relative to the number. */
  position: "before" | "after";
  /**
   * How many display units one demo-euro of virtual balance is worth.
   * Purely cosmetic: it never changes the underlying demo balance.
   */
  multiplier: number;
  decimals: number;
  /** Short blurb shown in the currency picker. */
  blurb: string;
  accent: string;
}

export type NumberFormat = "full" | "compact";

export type GameCategory =
  | "popular"
  | "slots"
  | "crash"
  | "roulette"
  | "blackjack"
  | "baccarat"
  | "dice"
  | "mines"
  | "plinko"
  | "wheel"
  | "limbo"
  | "towers"
  | "coinflip"
  | "originals"
  | "favorites"
  | "recent";

export interface GameDefinition {
  slug: string;
  name: string;
  /** Short tagline for the card. */
  tagline: string;
  categories: GameCategory[];
  /** Theme colours used to generate the card artwork. */
  art: {
    from: string;
    to: string;
    glyph: string;
    pattern: "rays" | "grid" | "bubbles" | "waves" | "diamonds" | "cards";
  };
  /** Marketing-style RTP figure for the demo maths. */
  rtp: number;
  maxWin: string;
  featured?: boolean;
}

export interface HistoryEntry {
  id: string;
  game: string;
  gameSlug: string;
  /** Stake in base demo units. */
  bet: number;
  /** Payout in base demo units (0 for a loss). */
  payout: number;
  multiplier: number;
  /** Signed profit in base demo units. */
  profit: number;
  timestamp: number;
  detail?: string;
}

export interface Stats {
  totalGames: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  biggestMultiplier: number;
  wins: number;
  losses: number;
  perGame: Record<string, { plays: number; wagered: number; won: number }>;
}

export interface BetResult {
  payout: number;
  multiplier: number;
  detail?: string;
}
