"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CircleDot } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGameSession } from "@/hooks/use-game";
import { formatMultiplier } from "@/lib/currency";
import {
  PLINKO_TABLES,
  bucketTone,
  type PlinkoRisk,
  type PlinkoRows,
} from "@/lib/plinko";
import { getGame } from "@/lib/games";
import { playSound } from "@/lib/sound";
import { uid } from "@/lib/utils";
import { cn } from "@/lib/utils";

const GAME = getGame("plinko")!;
const ROW_OPTIONS: PlinkoRows[] = [8, 12, 16];
const RISK_OPTIONS: { id: PlinkoRisk; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

const BOARD_W = 100;
const BOARD_H = 100;
const STEP_MS = 105;

interface Ball {
  id: string;
  path: number[];
  bucket: number;
  multiplier: number;
}

export function PlinkoGame() {
  const session = useGameSession(GAME);

  const [rows, setRows] = useState<PlinkoRows>(12);
  const [risk, setRisk] = useState<PlinkoRisk>("medium");
  const [balls, setBalls] = useState<Ball[]>([]);
  const [lastBucket, setLastBucket] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const autoRef = useRef(false);
  autoRef.current = autoPlay;

  const table = PLINKO_TABLES[rows][risk];
  const topX = BOARD_W / 2;

  /** Pin coordinates for row `r` (0-indexed), evenly spread and centred. */
  const pinX = (row: number, index: number) => {
    const spacing = BOARD_W / (rows + 2);
    const width = spacing * (row + 1);
    return topX - width / 2 + spacing * index;
  };
  const pinY = (row: number) => 8 + ((BOARD_H - 22) / rows) * (row + 1);

  const drop = useCallback(() => {
    const handle = session.startRound(session.bet);
    if (!handle) return;

    const stake = session.bet;
    const path: number[] = [];
    let bucket = 0;
    for (let i = 0; i < rows; i++) {
      const right = handle.random.next() < 0.5 ? 0 : 1;
      bucket += right;
      path.push(right);
    }

    const multiplier = table[bucket];
    const ball: Ball = { id: uid("ball"), path, bucket, multiplier };
    setBalls((current) => [...current, ball]);
    playSound("chip");

    const flightMs = STEP_MS * (rows + 1);
    window.setTimeout(() => {
      setBalls((current) => current.filter((item) => item.id !== ball.id));
      setLastBucket(bucket);
      playSound(multiplier >= 1 ? "reveal" : "tick");
      session.finishRound({
        bet: stake,
        payout: stake * multiplier,
        multiplier,
        detail: `${rows} Reihen · ${risk} · Bucket ${bucket + 1}`,
        silent: autoRef.current,
      });

      if (autoRef.current) window.setTimeout(() => drop(), 160);
    }, flightMs);
  }, [session, rows, risk, table]);

  const ballFrames = (ball: Ball) => {
    const xs = [topX];
    const ys = [4];
    let index = 0;
    for (let row = 0; row < rows; row++) {
      index += ball.path[row];
      xs.push(pinX(row, index));
      ys.push(pinY(row));
    }
    // Settle into the bucket.
    xs.push(pinX(rows - 1, ball.bucket));
    ys.push(BOARD_H - 5);
    return { xs, ys };
  };

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
          multiplier={table[0]}
          potentialWin={session.bet * table[0]}
          extra={
            <div className="space-y-3 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <div className="space-y-1.5">
                <Label>Risk</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {RISK_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      size="sm"
                      variant={risk === option.id ? "default" : "secondary"}
                      onClick={() => {
                        setRisk(option.id);
                        playSound("click");
                      }}
                      className="text-xs font-black"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Rows</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ROW_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      size="sm"
                      variant={rows === option ? "default" : "secondary"}
                      onClick={() => {
                        setRows(option);
                        playSound("click");
                      }}
                      className="text-xs font-black"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <Button size="xl" className="w-full" onClick={drop}>
            <CircleDot className="h-5 w-5" />
            Ball fallen lassen
          </Button>
          <Button
            variant={autoPlay ? "destructive" : "outline"}
            className="w-full"
            onClick={() => {
              const next = !autoPlay;
              setAutoPlay(next);
              autoRef.current = next;
              playSound("click");
              if (next) drop();
            }}
          >
            {autoPlay ? "Auto Drop stoppen" : "Auto Drop starten"}
          </Button>
        </BetControls>
      }
      board={
        <div className="p-3 sm:p-5">
          <div className="relative mx-auto aspect-square w-full max-w-xl">
            <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className="h-full w-full">
              {Array.from({ length: rows }, (_, row) =>
                Array.from({ length: row + 1 }, (_, index) => (
                  <circle
                    key={`${row}-${index}`}
                    cx={pinX(row, index)}
                    cy={pinY(row)}
                    r={rows > 12 ? 0.75 : 1}
                    fill="hsl(235 12% 62%)"
                    opacity="0.75"
                  />
                )),
              )}
            </svg>

            {balls.map((ball) => {
              const { xs, ys } = ballFrames(ball);
              return (
                <motion.span
                  key={ball.id}
                  className="absolute h-[2.6%] w-[2.6%] rounded-full bg-gradient-to-br from-gold to-warning shadow-glow-gold"
                  initial={{ left: `${xs[0]}%`, top: `${ys[0]}%`, x: "-50%", y: "-50%" }}
                  animate={{
                    left: xs.map((value) => `${value}%`),
                    top: ys.map((value) => `${value}%`),
                  }}
                  transition={{ duration: (STEP_MS * (rows + 1)) / 1000, ease: "linear" }}
                />
              );
            })}
          </div>

          <div
            className="mt-3 grid gap-1"
            style={{ gridTemplateColumns: `repeat(${table.length}, minmax(0, 1fr))` }}
          >
            {table.map((multiplier, index) => (
              <motion.div
                key={index}
                animate={
                  lastBucket === index
                    ? { scale: [1, 1.22, 1], y: [0, -5, 0] }
                    : { scale: 1 }
                }
                className="rounded-md py-1 text-center text-[9px] font-black text-black sm:text-[11px]"
                style={{ background: bucketTone(index, table.length) }}
              >
                {multiplier >= 100 ? `${multiplier}x` : formatMultiplier(multiplier, multiplier < 1 ? 1 : 1)}
              </motion.div>
            ))}
          </div>

          <p className={cn("mt-3 text-center text-[11px] text-muted-foreground")}>
            {rows} Reihen · Risk {risk} · Jeder Abprall wird aus dem Runden-Seed
            abgeleitet.
          </p>
        </div>
      }
      belowBoard={<HistoryStrip slug={GAME.slug} />}
    />
  );
}
