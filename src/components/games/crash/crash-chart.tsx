"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { formatMultiplier } from "@/lib/currency";
import { cn } from "@/lib/utils";

export type CrashPhase = "betting" | "running" | "crashed";

interface CrashChartProps {
  phase: CrashPhase;
  multiplier: number;
  elapsed: number;
  /** Countdown in ms while `phase === "betting"`. */
  countdown: number;
  crashPoint: number | null;
  cashedAt: number | null;
}

const WIDTH = 640;
const HEIGHT = 320;
const PADDING = { left: 44, right: 18, top: 22, bottom: 30 };

/**
 * Live multiplier curve. The x axis auto-scales with elapsed time and the
 * y axis with the current multiplier, so the curve always fills the frame.
 */
export function CrashChart({
  phase,
  multiplier,
  elapsed,
  countdown,
  crashPoint,
  cashedAt,
}: CrashChartProps) {
  const spanX = Math.max(6, elapsed / 1000 + 1);
  const spanY = Math.max(2, multiplier * 1.15);

  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  const toX = (seconds: number) => PADDING.left + (seconds / spanX) * plotW;
  const toY = (value: number) =>
    PADDING.top + plotH - ((value - 1) / (spanY - 1)) * plotH;

  const path = useMemo(() => {
    const seconds = elapsed / 1000;
    const steps = 56;
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = (seconds * i) / steps;
      const value = Math.exp(0.15 * t);
      points.push(`${toX(t).toFixed(2)},${toY(value).toFixed(2)}`);
    }
    return points.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, spanX, spanY]);

  const area = `${PADDING.left},${PADDING.top + plotH} ${path} ${toX(elapsed / 1000).toFixed(2)},${(PADDING.top + plotH).toFixed(2)}`;

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 4;
    for (let i = 0; i <= count; i++) ticks.push(1 + ((spanY - 1) * i) / count);
    return ticks;
  }, [spanY]);

  const crashed = phase === "crashed";
  const won = cashedAt !== null;

  return (
    <div className="relative aspect-[2/1] w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Crash-Kurve bei ${formatMultiplier(multiplier)}`}
      >
        <defs>
          <linearGradient id="crash-area" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={crashed && !won ? "hsl(356 82% 58%)" : "hsl(265 90% 65%)"}
              stopOpacity="0.35"
            />
            <stop offset="100%" stopColor="hsl(265 90% 65%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="crash-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(190 95% 55%)" />
            <stop
              offset="100%"
              stopColor={crashed && !won ? "hsl(356 82% 58%)" : "hsl(44 96% 58%)"}
            />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={toY(tick)}
              y2={toY(tick)}
              stroke="hsl(240 16% 22%)"
              strokeWidth="1"
              strokeDasharray="3 6"
            />
            <text
              x={PADDING.left - 8}
              y={toY(tick) + 4}
              textAnchor="end"
              fill="hsl(235 12% 62%)"
              fontSize="11"
              fontWeight="700"
            >
              {tick.toFixed(1)}x
            </text>
          </g>
        ))}

        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={PADDING.top + plotH}
          y2={PADDING.top + plotH}
          stroke="hsl(240 16% 26%)"
          strokeWidth="1.5"
        />

        {phase !== "betting" && (
          <>
            <polygon points={area} fill="url(#crash-area)" />
            <polyline
              points={path}
              fill="none"
              stroke="url(#crash-line)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={toX(elapsed / 1000)}
              cy={toY(multiplier)}
              r={crashed ? 8 : 6}
              fill={crashed && !won ? "hsl(356 82% 58%)" : "hsl(44 96% 58%)"}
              className={crashed ? "" : "animate-pulse-glow"}
            />
          </>
        )}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        {phase === "betting" ? (
          <>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Nächste Runde in
            </span>
            <span className="tabular text-5xl font-black text-foreground sm:text-6xl">
              {(countdown / 1000).toFixed(1)}s
            </span>
            <span className="text-[11px] text-muted-foreground">
              Einsatz jetzt platzieren
            </span>
          </>
        ) : (
          <motion.span
            key={crashed ? "crashed" : "running"}
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "tabular text-6xl font-black tracking-tight drop-shadow-lg sm:text-7xl",
              crashed && !won && "text-destructive",
              crashed && won && "text-success",
              !crashed && "text-foreground",
            )}
          >
            {formatMultiplier(multiplier)}
          </motion.span>
        )}

        {crashed && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em]",
              won ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
            )}
          >
            {won
              ? `Cashed out ${formatMultiplier(cashedAt)}`
              : `Crashed @ ${formatMultiplier(crashPoint ?? multiplier)}`}
          </motion.span>
        )}
      </div>
    </div>
  );
}
