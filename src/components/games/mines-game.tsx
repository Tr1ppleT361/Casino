"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bomb, Gem, HandCoins, Play } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGameSession } from "@/hooks/use-game";
import { useCurrency } from "@/hooks/use-currency";
import { formatMultiplier } from "@/lib/currency";
import { minesMultiplier } from "@/lib/rng";
import { playSound } from "@/lib/sound";
import { getGame } from "@/lib/games";
import { cn } from "@/lib/utils";

const GAME = getGame("mines")!;
const TILES = 25;
const MINE_OPTIONS = [1, 3, 5, 10, 15, 20];

type Status = "idle" | "playing" | "won" | "lost";

export function MinesGame() {
  const session = useGameSession(GAME);
  const { format } = useCurrency();

  const [mines, setMines] = useState(3);
  const [status, setStatus] = useState<Status>("idle");
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [stake, setStake] = useState(0);
  const [hitTile, setHitTile] = useState<number | null>(null);

  const safePicks = revealed.length;
  const currentMultiplier = useMemo(
    () => minesMultiplier(mines, safePicks),
    [mines, safePicks],
  );
  const nextMultiplier = useMemo(
    () => minesMultiplier(mines, safePicks + 1),
    [mines, safePicks],
  );

  const maxSafe = TILES - mines;
  const playing = status === "playing";

  const start = useCallback(() => {
    const handle = session.startRound(session.bet);
    if (!handle) return;

    setStake(session.bet);
    setMinePositions(handle.random.pickDistinct(TILES, mines));
    setRevealed([]);
    setHitTile(null);
    setStatus("playing");
  }, [session, mines]);

  const cashOut = useCallback(() => {
    if (!playing || safePicks === 0) return;
    const multiplier = currentMultiplier;
    session.finishRound({
      bet: stake,
      payout: stake * multiplier,
      multiplier,
      detail: `${safePicks} sichere Felder bei ${mines} Minen`,
    });
    setStatus("won");
  }, [playing, safePicks, currentMultiplier, session, stake, mines]);

  const reveal = useCallback(
    (index: number) => {
      if (!playing || revealed.includes(index)) return;

      if (minePositions.includes(index)) {
        setHitTile(index);
        setStatus("lost");
        playSound("crash");
        session.finishRound({
          bet: stake,
          payout: 0,
          multiplier: 0,
          detail: `Mine bei Feld ${index + 1} nach ${safePicks} sicheren Feldern`,
        });
        return;
      }

      const next = [...revealed, index];
      setRevealed(next);
      playSound("reveal");

      // Cleared the whole board - pay out automatically.
      if (next.length >= maxSafe) {
        const multiplier = minesMultiplier(mines, next.length);
        session.finishRound({
          bet: stake,
          payout: stake * multiplier,
          multiplier,
          detail: `Alle ${maxSafe} sicheren Felder aufgedeckt`,
        });
        setStatus("won");
      }
    },
    [playing, revealed, minePositions, maxSafe, mines, session, stake, safePicks],
  );

  const reset = () => {
    setStatus("idle");
    setRevealed([]);
    setMinePositions([]);
    setHitTile(null);
  };

  const showMines = status === "lost" || status === "won";

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
          disabled={playing}
          multiplier={playing ? currentMultiplier : minesMultiplier(mines, 1)}
          potentialWin={playing ? stake * currentMultiplier : session.bet * minesMultiplier(mines, 1)}
          extra={
            <div className="space-y-2 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <Label>Minen</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {MINE_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={mines === option ? "default" : "secondary"}
                    disabled={playing}
                    onClick={() => {
                      setMines(option);
                      playSound("click");
                    }}
                    className="text-xs font-black"
                  >
                    {option}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between pt-1 text-[11px] text-muted-foreground">
                <span>Sichere Felder: {maxSafe}</span>
                <span className="tabular">
                  Nächstes Feld: {formatMultiplier(nextMultiplier)}
                </span>
              </div>
            </div>
          }
        >
          {playing ? (
            <Button
              size="xl"
              variant="success"
              className="w-full"
              disabled={safePicks === 0}
              onClick={cashOut}
            >
              <HandCoins className="h-5 w-5" />
              {safePicks === 0
                ? "Erst ein Feld aufdecken"
                : `Cash Out ${format(stake * currentMultiplier)}`}
            </Button>
          ) : (
            <Button size="xl" className="w-full" onClick={status === "idle" ? start : reset}>
              <Play className="h-5 w-5" />
              {status === "idle" ? "Runde starten" : "Neue Runde"}
            </Button>
          )}
        </BetControls>
      }
      board={
        <div className="p-4 sm:p-6">
          <div className="mx-auto grid max-w-lg grid-cols-5 gap-1.5 sm:gap-2.5">
            {Array.from({ length: TILES }, (_, index) => {
              const isRevealed = revealed.includes(index);
              const isMine = minePositions.includes(index);
              const exposed = isRevealed || (showMines && isMine);

              return (
                <motion.button
                  key={index}
                  type="button"
                  disabled={!playing || isRevealed}
                  onClick={() => reveal(index)}
                  whileHover={playing && !isRevealed ? { scale: 1.05 } : undefined}
                  whileTap={playing && !isRevealed ? { scale: 0.94 } : undefined}
                  animate={
                    hitTile === index
                      ? { scale: [1, 1.18, 1], rotate: [0, -6, 6, 0] }
                      : { scale: 1 }
                  }
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-xl border text-xl transition-colors sm:text-2xl",
                    !exposed &&
                      "border-white/[0.07] bg-surface-raised hover:border-primary/50 hover:bg-primary/10",
                    isRevealed &&
                      "border-success/40 bg-success/15 shadow-[0_0_18px_-6px_hsl(var(--success))]",
                    showMines &&
                      isMine &&
                      !isRevealed &&
                      "border-destructive/40 bg-destructive/15",
                    hitTile === index && "border-destructive bg-destructive/30",
                    !playing && !exposed && "opacity-60",
                  )}
                  aria-label={`Feld ${index + 1}`}
                >
                  <AnimatePresence>
                    {exposed && (
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      >
                        {isMine ? (
                          <Bomb className="h-5 w-5 text-destructive sm:h-6 sm:w-6" />
                        ) : (
                          <Gem className="h-5 w-5 text-success sm:h-6 sm:w-6" />
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          <div className="mx-auto mt-5 flex max-w-lg items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-card px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Aufgedeckt
              </p>
              <p className="tabular text-lg font-black">
                {safePicks} / {maxSafe}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Aktueller Multiplikator
              </p>
              <p
                className={cn(
                  "tabular text-lg font-black",
                  status === "lost" ? "text-destructive" : "text-success",
                )}
              >
                {formatMultiplier(status === "lost" ? 0 : currentMultiplier)}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {status === "lost" && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-center text-sm font-black uppercase tracking-[0.2em] text-destructive"
              >
                Game Over
              </motion.p>
            )}
            {status === "won" && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-center text-sm font-black uppercase tracking-[0.2em] text-success"
              >
                Ausgezahlt
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      }
      belowBoard={<HistoryStrip slug={GAME.slug} />}
    />
  );
}
