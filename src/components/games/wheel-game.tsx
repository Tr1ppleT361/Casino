"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { RotateCw } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { Button } from "@/components/ui/button";
import { useGameSession } from "@/hooks/use-game";
import { formatMultiplier } from "@/lib/currency";
import {
  WHEEL_SEGMENTS,
  arcPath,
  buildWheel,
  sliceFromFloat,
} from "@/lib/wheel";
import { getGame } from "@/lib/games";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const GAME = getGame("wheel")!;
const SPIN_MS = 4200;

export function WheelGame() {
  const session = useGameSession(GAME);
  const slices = useMemo(() => buildWheel(), []);
  const controls = useAnimation();
  const rotation = useRef(0);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const spin = useCallback(async () => {
    if (spinning) return;
    const handle = session.startRound(session.bet);
    if (!handle) return;

    const stake = session.bet;
    const index = sliceFromFloat(slices, handle.random.next());
    const slice = slices[index];
    const center = (slice.start + slice.end) / 2;

    setSpinning(true);
    setResult(null);
    playSound("spin");

    // Land the slice centre under the pointer at 12 o'clock.
    const target = rotation.current + 360 * 6 + ((360 - center) - (rotation.current % 360));
    rotation.current = target;

    await controls.start({
      rotate: target,
      transition: { duration: SPIN_MS / 1000, ease: [0.15, 0.85, 0.25, 1] },
    });

    setResult(slice.multiplier);
    setSpinning(false);
    session.finishRound({
      bet: stake,
      payout: stake * slice.multiplier,
      multiplier: slice.multiplier,
      detail: `Feld ${formatMultiplier(slice.multiplier)}`,
    });
  }, [spinning, session, slices, controls]);

  return (
    <GameShell
      game={GAME}
      controls={
        <BetControls
          bet={session.bet}
          onBetChange={session.setBet}
          onHalve={session.halveBet}
          onDouble={session.doubleBet}
          onMax={session.maxBet}
          disabled={spinning}
          multiplier={result ?? undefined}
          potentialWin={session.bet * 50}
          extra={
            <div className="space-y-2 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Felder &amp; Chancen
              </p>
              <ul className="space-y-1">
                {WHEEL_SEGMENTS.map((segment) => (
                  <li
                    key={segment.multiplier}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="flex items-center gap-1.5 font-bold">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: segment.color }}
                      />
                      {formatMultiplier(segment.multiplier, segment.multiplier < 1 ? 1 : 0)}
                    </span>
                    <span className="tabular text-muted-foreground">
                      {(segment.probability * 100).toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
              <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
                Die Segmentbreite entspricht der echten Wahrscheinlichkeit – seltene
                Felder sind deshalb schmal.
              </p>
            </div>
          }
        >
          <Button size="xl" className="w-full" onClick={spin} disabled={spinning}>
            <RotateCw className={cn("h-5 w-5", spinning && "animate-spin")} />
            {spinning ? "Dreht…" : "Rad drehen"}
          </Button>
        </BetControls>
      }
      board={
        <div className="flex flex-col items-center p-5 sm:p-8">
          <div className="relative aspect-square w-full max-w-md">
            <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
              <div className="h-0 w-0 border-x-[10px] border-t-[18px] border-x-transparent border-t-gold drop-shadow" />
            </div>

            <motion.svg
              viewBox="0 0 200 200"
              animate={controls}
              className="h-full w-full drop-shadow-2xl"
              style={{ transformOrigin: "50% 50%" }}
            >
              <circle cx="100" cy="100" r="97" fill="hsl(240 26% 6%)" />
              {slices.map((slice, index) => (
                <path
                  key={index}
                  d={arcPath(100, 100, 94, 44, slice.start, slice.end)}
                  fill={slice.color}
                  stroke="hsl(240 26% 5%)"
                  strokeWidth="0.5"
                />
              ))}
              {slices.map((slice, index) => {
                const sweep = slice.end - slice.start;
                if (sweep < 9) return null;
                const mid = ((slice.start + slice.end) / 2 - 90) * (Math.PI / 180);
                return (
                  <text
                    key={`label-${index}`}
                    x={100 + 69 * Math.cos(mid)}
                    y={100 + 69 * Math.sin(mid) + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="900"
                    fill="hsl(240 30% 6%)"
                  >
                    {slice.multiplier}x
                  </text>
                );
              })}
              <circle cx="100" cy="100" r="42" fill="hsl(240 22% 9%)" stroke="hsl(240 16% 22%)" />
            </motion.svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Ergebnis
              </span>
              <span
                className={cn(
                  "tabular text-3xl font-black",
                  result === null
                    ? "text-muted-foreground"
                    : result >= 2
                      ? "text-success"
                      : result === 0
                        ? "text-destructive"
                        : "text-foreground",
                )}
              >
                {spinning ? "…" : result !== null ? formatMultiplier(result) : "—"}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {WHEEL_SEGMENTS.map((segment) => (
              <span
                key={segment.multiplier}
                className="rounded-lg px-2 py-0.5 text-[10px] font-black text-black"
                style={{ background: segment.color }}
              >
                {segment.multiplier}x
              </span>
            ))}
          </div>
        </div>
      }
      belowBoard={<HistoryStrip slug={GAME.slug} />}
    />
  );
}
