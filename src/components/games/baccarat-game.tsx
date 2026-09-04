"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { CardHand } from "@/components/games/cards/playing-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGameSession } from "@/hooks/use-game";
import { baccaratValue, buildShoe, pip, type Card } from "@/lib/cards";
import { getGame } from "@/lib/games";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const GAME = getGame("baccarat")!;

type Side = "player" | "banker" | "tie";

/** Total returned per unit staked, stake included. Banker carries 5% commission. */
const PAYOUT: Record<Side, number> = { player: 2, banker: 1.95, tie: 9 };

const LABEL: Record<Side, string> = {
  player: "Player",
  banker: "Banker",
  tie: "Tie",
};

/** Standard punto banco drawing rules. */
function playCoup(shoe: Card[]) {
  const deck = [...shoe];
  const player = [deck.shift()!, deck.shift()!];
  const banker = [deck.shift()!, deck.shift()!];

  const naturals =
    baccaratValue(player) >= 8 || baccaratValue(banker) >= 8;

  if (!naturals) {
    let playerThird: Card | null = null;

    if (baccaratValue(player) <= 5) {
      playerThird = deck.shift()!;
      player.push(playerThird);
    }

    const bankerTotal = baccaratValue(banker);
    let bankerDraws: boolean;

    if (!playerThird) {
      bankerDraws = bankerTotal <= 5;
    } else {
      const third = pip(playerThird);
      if (bankerTotal <= 2) bankerDraws = true;
      else if (bankerTotal === 3) bankerDraws = third !== 8;
      else if (bankerTotal === 4) bankerDraws = third >= 2 && third <= 7;
      else if (bankerTotal === 5) bankerDraws = third >= 4 && third <= 7;
      else if (bankerTotal === 6) bankerDraws = third >= 6 && third <= 7;
      else bankerDraws = false;
    }

    if (bankerDraws) banker.push(deck.shift()!);
  }

  const playerTotal = baccaratValue(player);
  const bankerTotal = baccaratValue(banker);
  const winner: Side =
    playerTotal > bankerTotal ? "player" : bankerTotal > playerTotal ? "banker" : "tie";

  return { player, banker, playerTotal, bankerTotal, winner };
}

export function BaccaratGame() {
  const session = useGameSession(GAME);

  const [side, setSide] = useState<Side>("player");
  const [dealing, setDealing] = useState(false);
  const [coup, setCoup] = useState<ReturnType<typeof playCoup> | null>(null);
  const [road, setRoad] = useState<Side[]>([]);

  const deal = useCallback(() => {
    if (dealing) return;
    const handle = session.startRound(session.bet);
    if (!handle) return;

    const stake = session.bet;
    const result = playCoup(buildShoe(handle.random, 8));

    setDealing(true);
    setCoup(result);
    playSound("card");

    window.setTimeout(() => {
      const won = result.winner === side;
      // A tie returns the stake on player/banker bets (a push).
      const payout = won
        ? stake * PAYOUT[side]
        : result.winner === "tie" && side !== "tie"
          ? stake
          : 0;

      setDealing(false);
      setRoad((current) => [result.winner, ...current].slice(0, 24));
      session.finishRound({
        bet: stake,
        payout,
        multiplier: Math.round((payout / stake) * 100) / 100,
        detail: `Player ${result.playerTotal} : Banker ${result.bankerTotal} · ${LABEL[result.winner]}`,
      });
    }, 1100);
  }, [dealing, session, side]);

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
          disabled={dealing}
          multiplier={PAYOUT[side]}
          extra={
            <div className="space-y-2 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <Label>Wette</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["player", "tie", "banker"] as Side[]).map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={side === option ? "default" : "secondary"}
                    disabled={dealing}
                    onClick={() => {
                      setSide(option);
                      playSound("click");
                    }}
                    className="flex-col gap-0 py-6 text-[11px] font-black"
                  >
                    {LABEL[option]}
                    <span className="text-[9px] font-bold opacity-70">
                      {PAYOUT[option]}x
                    </span>
                  </Button>
                ))}
              </div>
              <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
                Banker zahlt 1,95x (5 % Kommission). Bei Tie werden Einsätze auf
                Player/Banker zurückgegeben.
              </p>
            </div>
          }
        >
          <Button size="xl" className="w-full" onClick={deal} disabled={dealing}>
            <Play className="h-5 w-5" />
            {dealing ? "Coup läuft…" : "Coup geben"}
          </Button>
        </BetControls>
      }
      board={
        <div className="min-h-[24rem] bg-[radial-gradient(60%_60%_at_50%_0%,hsl(265_60%_20%/0.5),transparent_70%)] p-5 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {(["player", "banker"] as const).map((seat) => {
              const cards = coup ? coup[seat] : [];
              const total = coup ? coup[`${seat}Total`] : 0;
              const isWinner = coup?.winner === seat;
              return (
                <div
                  key={seat}
                  className={cn(
                    "rounded-2xl border p-4 text-center transition-all",
                    isWinner && !dealing
                      ? "border-success/50 bg-success/[0.07] shadow-glow-success"
                      : "border-white/[0.06] bg-white/[0.02]",
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    {LABEL[seat]}
                  </p>
                  <div className="mt-3 flex min-h-[7rem] items-center justify-center">
                    {cards.length > 0 ? (
                      <CardHand cards={cards} />
                    ) : (
                      <span className="text-sm text-muted-foreground">Keine Karten</span>
                    )}
                  </div>
                  <p className="tabular mt-3 text-3xl font-black">
                    {coup ? total : "—"}
                  </p>
                </div>
              );
            })}
          </div>

          {coup && !dealing && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-6 text-center text-sm font-black uppercase tracking-[0.24em]",
                coup.winner === side
                  ? "text-success"
                  : coup.winner === "tie"
                    ? "text-gold"
                    : "text-destructive",
              )}
            >
              {LABEL[coup.winner]} gewinnt
            </motion.p>
          )}

          {road.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Verlauf
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {road.map((winner, index) => (
                  <span
                    key={index}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white",
                      winner === "player" && "bg-sky-600",
                      winner === "banker" && "bg-rose-700",
                      winner === "tie" && "bg-emerald-600",
                    )}
                  >
                    {winner === "player" ? "P" : winner === "banker" ? "B" : "T"}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-[10px] text-muted-foreground">
            Punto Banco mit 8 Decks · Standard-Ziehregeln · Nur Demo-Guthaben
          </p>
        </div>
      }
      belowBoard={<HistoryStrip slug={GAME.slug} />}
    />
  );
}
