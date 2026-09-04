export type PlinkoRisk = "low" | "medium" | "high";
export type PlinkoRows = 8 | 12 | 16;

/**
 * Bucket multipliers per row count and risk level. Symmetrical, with the
 * expected value kept just under 1 so the demo maths stays consistent with the
 * 1% edge used everywhere else.
 */
export const PLINKO_TABLES: Record<PlinkoRows, Record<PlinkoRisk, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [24, 5, 2, 1.4, 0.6, 0.4, 0.2, 0.4, 0.6, 1.4, 2, 5, 24],
    high: [58, 8, 3, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 3, 8, 58],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

/** Colour ramp from the middle (cool) to the edges (hot). */
export function bucketTone(index: number, total: number): string {
  const distance = Math.abs(index - (total - 1) / 2) / ((total - 1) / 2);
  if (distance > 0.86) return "hsl(356 82% 55%)";
  if (distance > 0.66) return "hsl(20 90% 55%)";
  if (distance > 0.45) return "hsl(38 95% 58%)";
  if (distance > 0.24) return "hsl(44 96% 58%)";
  return "hsl(190 70% 45%)";
}
