/** European single-zero roulette: 37 pockets, RTP 36/37 ≈ 97.3%. */
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export type PocketColor = "red" | "black" | "green";

export function pocketColor(pocket: number): PocketColor {
  if (pocket === 0) return "green";
  return RED_NUMBERS.has(pocket) ? "red" : "black";
}

export type BetKey =
  | `straight:${number}`
  | "red"
  | "black"
  | "odd"
  | "even"
  | "low"
  | "high"
  | `dozen:${1 | 2 | 3}`
  | `column:${1 | 2 | 3}`;

export interface BetSpec {
  label: string;
  /** Total returned per unit staked, including the stake. */
  payout: number;
  covers: (pocket: number) => boolean;
}

export function betSpec(key: BetKey): BetSpec {
  if (key.startsWith("straight:")) {
    const number = Number(key.split(":")[1]);
    return {
      label: `Zahl ${number}`,
      payout: 36,
      covers: (pocket) => pocket === number,
    };
  }

  if (key.startsWith("dozen:")) {
    const dozen = Number(key.split(":")[1]);
    const from = (dozen - 1) * 12 + 1;
    const to = dozen * 12;
    return {
      label: `${dozen}. Dutzend (${from}–${to})`,
      payout: 3,
      covers: (pocket) => pocket >= from && pocket <= to,
    };
  }

  if (key.startsWith("column:")) {
    const column = Number(key.split(":")[1]);
    return {
      label: `${column}. Kolonne`,
      payout: 3,
      covers: (pocket) => pocket !== 0 && pocket % 3 === column % 3,
    };
  }

  switch (key) {
    case "red":
      return { label: "Rot", payout: 2, covers: (p) => pocketColor(p) === "red" };
    case "black":
      return { label: "Schwarz", payout: 2, covers: (p) => pocketColor(p) === "black" };
    case "odd":
      return { label: "Ungerade", payout: 2, covers: (p) => p !== 0 && p % 2 === 1 };
    case "even":
      return { label: "Gerade", payout: 2, covers: (p) => p !== 0 && p % 2 === 0 };
    case "low":
      return { label: "1–18", payout: 2, covers: (p) => p >= 1 && p <= 18 };
    case "high":
      return { label: "19–36", payout: 2, covers: (p) => p >= 19 && p <= 36 };
    default:
      throw new Error(`Unbekannte Wette: ${key}`);
  }
}

/** Rows of the felt, laid out like a real table (3 rows of 12). */
export const TABLE_ROWS: number[][] = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];
