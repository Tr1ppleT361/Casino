"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGameSession } from "@/hooks/use-game";
import { formatMultiplier } from "@/lib/currency";
import { HOUSE_EDGE } from "@/lib/rng";
import { getGame } from "@/lib/games";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const GAME = getGame("coinflip")!;
const PAYOUT = Math.floor((1 - HOUSE_EDGE) * 2 * 100) / 100; // 1.98x

type Side = "heads" | "tails";

export function CoinflipGame() {
  const session = useGameSession(GAME);

  const [choice, setChoice] = useState<Side>("heads");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Side | null>(null);
  const [spins, setSpins] = useState(0);

  const flip = useCallback(() => {
    if (flipping) return;
    const handle = session.startRound(session.bet);
    if (!handle) return;

    const stake = session.bet;
    const outcome: Side = handle.random.next() < 0.5 ? "heads" : "tails";

    setFlipping(true);
    setResult(null);
    playSound("chip");
    // Always land face-up on the drawn side: 5 full turns + a half turn for tails.
    setSpins((current) => current + 1800 + (outcome === "tails" ? 180 : 0));

    window.setTimeout(() => {
      const won = outcome === choice;
      setResult(outcome);
      setFlipping(false);
      session.finishRound({
        bet: stake,
        payout: won ? stake * PAYOUT : 0,
        multiplier: won ? PAYOUT : 0,
        detail: `${outcome === "heads" ? "Heads" : "Tails"} · gewählt ${choice === "heads" ? "Heads" : "Tails"}`,
      });
    }, 1250);
  }, [flipping, session, choice]);

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
          disabled={flipping}
          multiplier={PAYOUT}
          extra={
            <div className="space-y-2 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <Label>Deine Wahl</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["heads", "tails"] as Side[]).map((side) => (
                  <Button
                    key={side}
                    variant={choice === side ? "gold" : "secondary"}
                    disabled={flipping}
                    onClick={() => {
                      setChoice(side);
                      playSound("click");
                    }}
                    className="h-12 flex-col gap-0 text-xs font-black"
                  >
                    <span className="text-lg">{side === "heads" ? "♛" : "◆"}</span>
                    {side === "heads" ? "Heads" : "Tails"}
                  </Button>
                ))}
              </div>
              <p className="pt-1 text-[11px] text-muted-foreground">
                Beide Seiten je 50,00 % · Auszahlung {formatMultiplier(PAYOUT)}
              </p>
            </div>
          }
        >
          <Button size="xl" className="w-full" onClick={flip} disabled={flipping}>
            <Coins className="h-5 w-5" />
            {flipping ? "Münze fliegt…" : "Münze werfen"}
          </Button>
        </BetControls>
      }
      board={
        <div className="flex min-h-[22rem] flex-col items-center justify-center gap-6 p-8">
          <div className="[perspective:1000px]">
            <motion.div
              animate={{ rotateY: spins }}
              transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative h-36 w-36 [transform-style:preserve-3d]"
            >
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-gold via-warning to-gold/60 text-5xl font-black text-gold-foreground shadow-glow-gold [backface-visibility:hidden]">
                ♛
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-accent via-primary to-accent/60 text-5xl font-black text-white shadow-glow [backface-visibility:hidden] [transform:rotateY(180deg)]">
                ◆
              </div>
            </motion.div>
          </div>

          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Ergebnis
            </p>
            <p
              className={cn(
                "text-3xl font-black",
                result === null
                  ? "text-muted-foreground"
                  : result === choice
                    ? "text-success"
                    : "text-destructive",
              )}
            >
              {flipping ? "…" : result === null ? "—" : result === "heads" ? "HEADS" : "TAILS"}
            </p>
          </div>
        </div>
      }
      belowBoard={<HistoryStrip slug={GAME.slug} />}
    />
  );
}
