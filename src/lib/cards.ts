import type { RoundRandom } from "@/lib/rng";

export const SUITS = ["♠", "♥", "♦", "♣"] as const;
export const RANKS = [
  "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
  /** Unique within a shoe so React keys stay stable. */
  id: string;
}

export function isRed(card: Card) {
  return card.suit === "♥" || card.suit === "♦";
}

/** Build a shuffled shoe of `decks` standard 52-card decks. */
export function buildShoe(random: RoundRandom, decks = 6): Card[] {
  const cards: Card[] = [];
  for (let deck = 0; deck < decks; deck++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ rank, suit, id: `${deck}-${suit}-${rank}` });
      }
    }
  }
  return random.shuffle(cards);
}

/* --------------------------------------------------------------------- */
/* Blackjack                                                              */
/* --------------------------------------------------------------------- */

/** Blackjack hand total, counting aces as 11 while that does not bust. */
export function handValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === "A") {
      aces += 1;
      total += 11;
    } else if (["K", "Q", "J", "10"].includes(card.rank)) {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }

  let soft = aces > 0;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
    soft = aces > 0;
  }

  return { total, soft };
}

export function isBlackjack(cards: Card[]) {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function canSplit(cards: Card[]) {
  if (cards.length !== 2) return false;
  const value = (rank: Rank) => (["K", "Q", "J", "10"].includes(rank) ? 10 : rank);
  return value(cards[0].rank) === value(cards[1].rank);
}

/* --------------------------------------------------------------------- */
/* Baccarat                                                               */
/* --------------------------------------------------------------------- */

/** Baccarat pip value: aces 1, 10/J/Q/K zero, totals taken modulo 10. */
export function baccaratValue(cards: Card[]): number {
  const points = cards.reduce((sum, card) => {
    if (["K", "Q", "J", "10"].includes(card.rank)) return sum;
    if (card.rank === "A") return sum + 1;
    return sum + Number(card.rank);
  }, 0);
  return points % 10;
}

/** Third-card value used by the banker drawing rules. */
export function pip(card: Card): number {
  if (["K", "Q", "J", "10"].includes(card.rank)) return 0;
  if (card.rank === "A") return 1;
  return Number(card.rank);
}
