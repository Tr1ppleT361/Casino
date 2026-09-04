"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Dices } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useGameSession } from "@/hooks/use-game";
import { useCurrency } from "@/hooks/use-currency";
import { formatMultiplier } from "@/lib/currency";
import { multiplierForChance } from "@/lib/rng";
import { getGame } from "@/lib/games";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const GAME = getGame("dice")!;
type Mode = "over" | "under";

export function DiceGame() {
  const session = useGameSession(GAME);
  const { format } = useCurrency();

  const [target, setTarget] = useState(50);
  const [mode, setMode] = useState<Mode>("over");
  const [roll, setRoll] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [rolling, setRolling] = useState(false);

  const chance = mode === "over" ? 100 - target : target;
  const multiplier = useMemo(() => multiplierForChance(chance), [chance]);

  const play = useCallback(() => {
    if (rolling) return;
    const handle = session.startRound(session.bet);
    if (!handle) return;

    const stake = session.bet;
    const value = Math.round(handle.random.next() * 10000) / 100;
    setRolling(true);
    playSound("spin");

    // Short suspense window, then reveal.
    window.setTimeout(() => {
      const isWin = mode === "over" ? value > target : value < target;
      setRoll(value);
      setWon(isWin);
      setRolling(false);

      session.finishRound({
        bet: stake,
        payout: isWin ? stake * multiplier : 0,
        multiplier: isWin ? multiplier : 0,
        detail: `${value.toFixed(2)} · roll ${mode} ${target}`,
      });
    }, 320);
  }, [rolling, session, mode, target, multiplier]);

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
          disabled={rolling}
          multiplier={multiplier}
          extra={
            <div className="space-y-3 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  size="sm"
                  variant={mode === "under" ? "default" : "secondary"}
                  onClick={() => {
                    setMode("under");
                    playSound("click");
                  }}
                  className="gap-1.5 text-xs font-black"
                >
                  <ArrowDown className="h-3.5 w-3.5" /> Roll Under
                </Button>
                <Button
                  size="sm"
                  variant={mode === "over" ? "default" : "secondary"}
                  onClick={() => {
                    setMode("over");
                    playSound("click");
                  }}
                  className="gap-1.5 text-xs font-black"
                >
                  <ArrowUp className="h-3.5 w-3.5" /> Roll Over
                </Button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Zielwert</Label>
                  <span className="tabular text-sm font-black">{target.toFixed(2)}</span>
                </div>
                <Slider
                  value={[target]}
                  min={2}
                  max={98}
                  step={0.01}
                  onValueChange={([value]) => setTarget(value)}
                  disabled={rolling}
                />
              </div>

              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Gewinnchance
                  </dt>
                  <dd className="tabular text-sm font-black text-accent">
                    {chance.toFixed(2)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Auszahlung
                  </dt>
                  <dd className="tabular text-sm font-black text-success">
                    {formatMultiplier(multiplier, 4)}
                  </dd>
                </div>
              </dl>
            </div>
          }
        >
          <Button size="xl" className="w-full" onClick={play} disabled={rolling}>
            <Dices className="h-5 w-5" />
            {rolling ? "Würfelt…" : `Roll ${mode === "over" ? "Over" : "Under"} ${target.toFixed(2)}`}
          </Button>
        </BetControls>
      }
      board={
        <div className="p-5 sm:p-8">
          <div className="mx-auto max-w-2xl">
            <motion.div
              key={roll ?? "idle"}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "mx-auto mb-8 w-fit rounded-2xl border px-8 py-5 text-center",
                won === null
                  ? "border-white/10 bg-surface-raised"
                  : won
                    ? "border-success/40 bg-success/12 shadow-glow-success"
                    : "border-destructive/40 bg-destructive/12",
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Zufallszahl
              </p>
              <p
                className={cn(
                  "tabular text-5xl font-black sm:text-6xl",
                  won === null ? "text-foreground" : won ? "text-success" : "text-destructive",
                )}
              >
                {rolling ? "··.··" : (roll?.toFixed(2) ?? "--.--")}
              </p>
            </motion.div>

            <div className="relative h-16">
              <div className="absolute inset-x-0 top-7 h-3 overflow-hidden rounded-full bg-surface-raised">
                <div
                  className={cn(
                    "absolute inset-y-0 rounded-full",
                    mode === "under"
                      ? "left-0 bg-gradient-to-r from-success to-success/60"
                      : "right-0 bg-gradient-to-l from-success to-success/60",
                  )}
                  style={{ width: `${chance}%` }}
                />
                <div
                  className={cn(
                    "absolute inset-y-0 bg-destructive/25",
                    mode === "under" ? "right-0" : "left-0",
                  )}
                  style={{ width: `${100 - chance}%` }}
                />
              </div>

              <motion.div
                className="absolute top-2.5 z-10 -translate-x-1/2"
                animate={{ left: `${roll ?? 50}%` }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
              >
                <div
                  className={cn(
                    "h-12 w-1 rounded-full",
                    won === null ? "bg-foreground" : won ? "bg-success" : "bg-destructive",
                  )}
                />
              </motion.div>

              <div
                className="absolute top-1 z-20 -translate-x-1/2 text-center"
                style={{ left: `${target}%` }}
              >
                <div className="h-6 w-0.5 bg-gold" />
                <span className="tabular mt-0.5 block rounded bg-gold/20 px-1.5 text-[10px] font-black text-gold">
                  {target.toFixed(0)}
                </span>
              </div>

              <div className="absolute inset-x-0 top-12 flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
      }
      belowBoard={<HistoryStrip slug={GAME.slug} />}
    />
  );
}
