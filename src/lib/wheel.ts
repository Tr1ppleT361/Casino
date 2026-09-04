/**
 * Wheel of multipliers.
 *
 * Slice widths are proportional to their real probability, so the wheel shows
 * the true odds instead of pretending a 50x is as likely as a 1x. The rare
 * multipliers are thin slivers - that is the honest picture, and the legend
 * next to the wheel spells the exact chance out.
 *
 * Expected value: 0.9895 (≈1% house edge, same as every other game here).
 */
export interface WheelSegment {
  multiplier: number;
  probability: number;
  /** How many slices this multiplier is split into around the wheel. */
  parts: number;
  color: string;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  { multiplier: 0, probability: 0.402, parts: 8, color: "hsl(240 16% 22%)" },
  { multiplier: 0.5, probability: 0.22, parts: 6, color: "hsl(205 60% 40%)" },
  { multiplier: 1, probability: 0.13, parts: 5, color: "hsl(190 95% 45%)" },
  { multiplier: 1.5, probability: 0.088, parts: 4, color: "hsl(152 72% 42%)" },
  { multiplier: 2, probability: 0.08, parts: 4, color: "hsl(90 65% 45%)" },
  { multiplier: 3, probability: 0.045, parts: 3, color: "hsl(44 96% 55%)" },
  { multiplier: 5, probability: 0.02, parts: 2, color: "hsl(30 95% 55%)" },
  { multiplier: 10, probability: 0.011, parts: 2, color: "hsl(12 90% 55%)" },
  { multiplier: 25, probability: 0.0035, parts: 1, color: "hsl(330 85% 58%)" },
  { multiplier: 50, probability: 0.0005, parts: 1, color: "hsl(280 90% 65%)" },
];

export interface WheelSlice {
  multiplier: number;
  color: string;
  /** Degrees, clockwise from 12 o'clock. */
  start: number;
  end: number;
  probability: number;
}

/**
 * Lay the slices out so colours alternate instead of clustering: repeatedly
 * take a part from whichever multiplier still has the most left.
 */
export function buildWheel(): WheelSlice[] {
  const remaining = WHEEL_SEGMENTS.map((segment) => ({
    segment,
    left: segment.parts,
  }));

  const order: WheelSegment[] = [];
  let guard = 0;
  while (remaining.some((item) => item.left > 0) && guard++ < 200) {
    remaining.sort((a, b) => b.left - a.left);
    const candidates = remaining.filter((item) => item.left > 0);
    // Alternate between the two biggest remaining buckets for a lively ring.
    const pick = candidates[order.length % Math.min(2, candidates.length)] ?? candidates[0];
    pick.left -= 1;
    order.push(pick.segment);
  }

  let angle = 0;
  return order.map((segment) => {
    const sweep = (segment.probability / segment.parts) * 360;
    const slice: WheelSlice = {
      multiplier: segment.multiplier,
      color: segment.color,
      start: angle,
      end: angle + sweep,
      probability: segment.probability / segment.parts,
    };
    angle += sweep;
    return slice;
  });
}

/** Resolve a uniform float to a slice index. */
export function sliceFromFloat(slices: WheelSlice[], float: number): number {
  const target = float * 360;
  for (let i = 0; i < slices.length; i++) {
    if (target >= slices[i].start && target < slices[i].end) return i;
  }
  return slices.length - 1;
}

/** SVG path for a donut segment. */
export function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const large = endDeg - startDeg > 180 ? 1 : 0;

  const x1 = cx + rOuter * Math.cos(toRad(startDeg));
  const y1 = cy + rOuter * Math.sin(toRad(startDeg));
  const x2 = cx + rOuter * Math.cos(toRad(endDeg));
  const y2 = cy + rOuter * Math.sin(toRad(endDeg));
  const x3 = cx + rInner * Math.cos(toRad(endDeg));
  const y3 = cy + rInner * Math.sin(toRad(endDeg));
  const x4 = cx + rInner * Math.cos(toRad(startDeg));
  const y4 = cy + rInner * Math.sin(toRad(startDeg));

  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}
