"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGameSession } from "@/hooks/use-game";
import { formatMultiplier, parseAmountInput } from "@/lib/currency";
import { HOUSE_EDGE, limboMultiplierFrom } from "@/lib/rng";
import { getGame } from "@/lib/games";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const GAME = getGame("limbo")!;
const PRESETS = [1.5, 2, 5, 10, 50, 100];

export function LimboGame() {
  const session = useGameSession(GAME);

  const [target, setTarget] = useState(2);
  const [text, setText] = useState("2.00");
  const [result, setResult] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [rolling, setRolling] = useState(false);

  const chance = ((1 - HOUSE_EDGE) / target) * 100;

  const play = useCallback(() => {
    if (rolling) return;
    const handle = session.startRound(session.bet);
    if (!handle) return;

    const stake = session.bet;
    const value = limboMultiplierFrom(handle.random.next());
    setRolling(true);
    playSound("spin");

    window.setTimeout(() => {
      const isWin = value >= target;
      setResult(value);
      setWon(isWin);
      setRolling(false);
      session.finishRound({
        bet: stake,
        payout: isWin ? stake * target : 0,
        multiplier: isWin ? target : 0,
        detail: `Ergebnis ${formatMultiplier(value)} · Ziel ${formatMultiplier(target)}`,
      });
    }, 420);
  }, [rolling, session, target]);

  const applyTarget = (value: number) => {
    const clamped = Math.min(Math.max(value, 1.01), 1_000_000);
    setTarget(clamped);
    setText(clamped.toFixed(2));
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
          disabled={rolling}
          multiplier={target}
          extra={
            <div className="space-y-2.5 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <Label htmlFor="limbo-target">Zielmultiplikator</Label>
              <input
                id="limbo-target"
                inputMode="decimal"
                value={text}
                disabled={rolling}
                onChange={(event) => setText(event.target.value)}
                onBlur={() => applyTarget(parseAmountInput(text) || 2)}
                className="tabular h-11 w-full rounded-xl border border-white/10 bg-surface px-3 text-lg font-black focus-visible:border-primary/60 focus-visible:outline-none"
              />
              <div className="grid grid-cols-3 gap-1.5">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    size="sm"
                    variant={target === preset ? "default" : "secondary"}
                    disabled={rolling}
                    onClick={() => {
                      applyTarget(preset);
                      playSound("click");
                    }}
                    className="text-xs font-black"
                  >
                    {preset}x
                  </Button>
                ))}
              </div>
              <p className="tabular pt-1 text-[11px] text-muted-foreground">
                Gewinnchance: {chance.toFixed(4)}%
              </p>
            </div>
          }
        >
          <Button size="xl" className="w-full" onClick={play} disabled={rolling}>
            <Rocket className="h-5 w-5" />
            {rolling ? "Läuft…" : "Limbo starten"}
          </Button>
        </BetControls>
      }
      board={
        <div className="flex min-h-[22rem] flex-col items-center justify-center p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            Ergebnis
          </p>
          <motion.p
            key={result ?? "idle"}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className={cn(
              "tabular mt-2 text-6xl font-black tracking-tight sm:text-8xl",
              won === null
                ? "text-foreground"
                : won
                  ? "text-success drop-shadow-[0_0_28px_hsl(var(--success)/0.5)]"
                  : "text-destructive",
            )}
          >
            {rolling ? "—" : result !== null ? formatMultiplier(result) : "1.00x"}
          </motion.p>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-card px-5 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Dein Ziel
            </span>
            <span className="tabular text-xl font-black text-gold">
              {formatMultiplier(target)}
            </span>
          </div>

          {won !== null && !rolling && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-5 rounded-full px-4 py-1 text-xs font-black uppercase tracking-[0.24em]",
                won ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
              )}
            >
              {won ? "Ziel erreicht" : "Zu niedrig"}
            </motion.p>
          )}
        </div>
      }
      belowBoard={<HistoryStrip slug={GAME.slug} />}
    />
  );
}
