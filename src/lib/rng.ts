import { hmacSha256, sha256Hex, toHex } from "@/lib/sha256";

/**
 * Transparent ("provably fair") demo randomness.
 *
 * Every round is derived deterministically from
 *   HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}:${cursor}`)
 * The hash of the active server seed is shown up-front, the seed itself is
 * revealed on rotation, and the client seed is user editable. Nothing about a
 * round depends on the bet size, the balance or the player's history.
 */

export const HOUSE_EDGE = 0.01;

export interface SeedPair {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export function randomHex(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(buffer);
  } else {
    for (let i = 0; i < bytes; i++) buffer[i] = Math.floor(Math.random() * 256);
  }
  return toHex(buffer);
}

export function hashSeed(serverSeed: string): string {
  return sha256Hex(serverSeed);
}

export function createSeedPair(clientSeed?: string): SeedPair {
  const serverSeed = randomHex(32);
  return {
    serverSeed,
    serverSeedHash: hashSeed(serverSeed),
    clientSeed: clientSeed ?? randomHex(8),
    nonce: 0,
  };
}

/**
 * Produce `count` uniform floats in [0, 1) for a given seed triple.
 * Each float consumes 4 bytes of HMAC output, matching the widely used
 * "bytes to number" scheme so results can be re-verified by hand.
 */
export function floatsFrom(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number,
): number[] {
  const results: number[] = [];
  let cursor = 0;

  while (results.length < count) {
    const digest = hmacSha256(serverSeed, `${clientSeed}:${nonce}:${cursor}`);
    for (let i = 0; i + 3 < digest.length && results.length < count; i += 4) {
      const value =
        digest[i] / 256 +
        digest[i + 1] / 256 ** 2 +
        digest[i + 2] / 256 ** 3 +
        digest[i + 3] / 256 ** 4;
      results.push(value);
    }
    cursor += 1;
  }

  return results;
}

/** A tiny helper that hands out floats one at a time for a single round. */
export class RoundRandom {
  private values: number[];
  private index = 0;

  constructor(
    private serverSeed: string,
    private clientSeed: string,
    private nonce: number,
    initial = 8,
  ) {
    this.values = floatsFrom(serverSeed, clientSeed, nonce, initial);
  }

  next(): number {
    if (this.index >= this.values.length) {
      this.values = floatsFrom(
        this.serverSeed,
        this.clientSeed,
        this.nonce,
        this.values.length * 2,
      );
    }
    return this.values[this.index++];
  }

  nextInt(maxExclusive: number): number {
    return Math.min(maxExclusive - 1, Math.floor(this.next() * maxExclusive));
  }

  /** Seeded Fisher-Yates. Returns a new array; the input is untouched. */
  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** Pick `count` distinct indices from `[0, size)`. */
  pickDistinct(size: number, count: number): number[] {
    const pool = Array.from({ length: size }, (_, i) => i);
    const picked: number[] = [];
    for (let i = 0; i < Math.min(count, size); i++) {
      const j = this.nextInt(pool.length);
      picked.push(pool[j]);
      pool.splice(j, 1);
    }
    return picked;
  }
}

/* --------------------------------------------------------------------- */
/* Game maths                                                             */
/* --------------------------------------------------------------------- */

/**
 * Crash point from a single uniform float.
 * Classic 1%-edge curve: 1% of rounds bust instantly at 1.00x, the rest follow
 * `(1 - edge) / (1 - f)` truncated to two decimals.
 */
export function crashPointFrom(float: number, edge = HOUSE_EDGE): number {
  if (float < edge) return 1;
  const raw = (1 - edge) / (1 - float);
  return Math.max(1, Math.floor(raw * 100) / 100);
}

/** Limbo shares the crash curve but has no instant-bust band. */
export function limboMultiplierFrom(float: number, edge = HOUSE_EDGE): number {
  const safe = Math.min(float, 0.9999999);
  const raw = (1 - edge) / (1 - safe);
  return Math.max(1, Math.floor(raw * 100) / 100);
}

/** Fair multiplier for a target win chance, minus the house edge. */
export function multiplierForChance(chancePercent: number, edge = HOUSE_EDGE): number {
  const chance = Math.min(Math.max(chancePercent, 0.01), 98);
  return Math.floor(((100 - edge * 100) / chance) * 10000) / 10000;
}

/** Mines: multiplier after `revealed` safe tiles on a 25-tile grid. */
export function minesMultiplier(mines: number, revealed: number, edge = HOUSE_EDGE): number {
  if (revealed <= 0) return 1;
  const total = 25;
  const safe = total - mines;
  if (revealed > safe) return 0;

  // Inverse probability of surviving `revealed` picks.
  let inverse = 1;
  for (let i = 0; i < revealed; i++) {
    inverse *= (total - i) / (safe - i);
  }
  return Math.floor(inverse * (1 - edge) * 100) / 100;
}

/** Towers: multiplier after clearing `level` rows. */
export function towersMultiplier(
  tilesPerRow: number,
  safePerRow: number,
  level: number,
  edge = HOUSE_EDGE,
): number {
  if (level <= 0) return 1;
  const step = tilesPerRow / safePerRow;
  return Math.floor(step ** level * (1 - edge) * 100) / 100;
}

/** Binomial coefficient, small inputs only (plinko rows <= 16). */
export function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return Math.round(result);
}
