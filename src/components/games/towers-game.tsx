"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HandCoins, Play, Skull, Star } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGameSession } from "@/hooks/use-game";
import { useCurrency } from "@/hooks/use-currency";
import { formatMultiplier } from "@/lib/currency";
import { towersMultiplier } from "@/lib/rng";
import { getGame } from "@/lib/games";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

const GAME = getGame("towers")!;
const LEVELS = 8;

const DIFFICULTIES = {
  easy: { label: "Easy", tiles: 4, safe: 3 },
  medium: { label: "Medium", tiles: 3, safe: 2 },
  hard: { label: "Hard", tiles: 2, safe: 1 },
} as const;

type Difficulty = keyof typeof DIFFICULTIES;
type Status = "idle" | "playing" | "won" | "lost";

interface Pick {
  level: number;
  tile: number;
  safe: boolean;
}

export function TowersGame() {
  const session = useGameSession(GAME);
  const { format } = useCurrency();

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [status, setStatus] = useState<Status>("idle");
  const [layout, setLayout] = useState<number[][]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [stake, setStake] = useState(0);

  const config = DIFFICULTIES[difficulty];
  const level = picks.filter((pick) => pick.safe).length;
  const playing = status === "playing";
  const currentMultiplier = towersMultiplier(config.tiles, config.safe, level);
  const nextMultiplier = towersMultiplier(config.tiles, config.safe, level + 1);

  const start = useCallback(() => {
    const handle = session.startRound(session.bet);
    if (!handle) return;

    // Pre-roll every level so the tower is fixed before the first click.
    const rows: number[][] = [];
    for (let i = 0; i < LEVELS; i++) {
      rows.push(handle.random.pickDistinct(config.tiles, config.tiles - config.safe));
    }

    setLayout(rows);
    setPicks([]);
    setStake(session.bet);
    setStatus("playing");
  }, [session, config]);

  const cashOut = useCallback(() => {
    if (!playing || level === 0) return;
    session.finishRound({
      bet: stake,
      payout: stake * currentMultiplier,
      multiplier: currentMultiplier,
      detail: `${level} von ${LEVELS} Ebenen · ${config.label}`,
    });
    setStatus("won");
  }, [playing, level, session, stake, currentMultiplier, config.label]);

  const pick = useCallback(
    (tile: number) => {
      if (!playing) return;
      const rowIndex = level;
      if (rowIndex >= LEVELS) return;

      const traps = layout[rowIndex];
      const safe = !traps.includes(tile);
      setPicks((current) => [...current, { level: rowIndex, tile, safe }]);

      if (!safe) {
        playSound("crash");
        setStatus("lost");
        session.finishRound({
          bet: stake,
          payout: 0,
          multiplier: 0,
          detail: `Falle auf Ebene ${rowIndex + 1}`,
        });
        return;
      }

      playSound("reveal");

      if (rowIndex + 1 >= LEVELS) {
        const multiplier = towersMultiplier(config.tiles, config.safe, LEVELS);
        session.finishRound({
          bet: stake,
          payout: stake * multiplier,
          multiplier,
          detail: `Turm komplett · ${config.label}`,
        });
        setStatus("won");
      }
    },
    [playing, level, layout, session, stake, config],
  );

  const reveal = status === "lost" || status === "won";

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
          multiplier={playing ? currentMultiplier : nextMultiplier}
          potentialWin={(playing ? stake : session.bet) * (playing ? currentMultiplier : nextMultiplier)}
          extra={
            <div className="space-y-2 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <Label>Schwierigkeit</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(DIFFICULTIES) as Difficulty[]).map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={difficulty === key ? "default" : "secondary"}
                    disabled={playing}
                    onClick={() => {
                      setDifficulty(key);
                      playSound("click");
                    }}
                    className="text-xs font-black"
                  >
                    {DIFFICULTIES[key].label}
                  </Button>
                ))}
              </div>
              <p className="pt-1 text-[11px] text-muted-foreground">
                {config.safe} von {config.tiles} Feldern pro Ebene sind sicher ·{" "}
                {LEVELS} Ebenen
              </p>
            </div>
          }
        >
          {playing ? (
            <Button
              size="xl"
              variant="success"
              className="w-full"
              disabled={level === 0}
              onClick={cashOut}
            >
              <HandCoins className="h-5 w-5" />
              {level === 0
                ? "Erst eine Ebene schaffen"
                : `Cash Out ${format(stake * currentMultiplier)}`}
            </Button>
          ) : (
            <Button
              size="xl"
              className="w-full"
              onClick={status === "idle" ? start : () => setStatus("idle")}
            >
              <Play className="h-5 w-5" />
              {status === "idle" ? "Turm starten" : "Neue Runde"}
            </Button>
          )}
        </BetControls>
      }
      board={
        <div className="p-4 sm:p-6">
          <div className="mx-auto flex max-w-md flex-col-reverse gap-1.5">
            {Array.from({ length: LEVELS }, (_, rowIndex) => {
              const rowPick = picks.find((item) => item.level === rowIndex);
              const isCurrent = playing && rowIndex === level;
              const rowMultiplier = towersMultiplier(config.tiles, config.safe, rowIndex + 1);

              return (
                <div key={rowIndex} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "tabular w-16 shrink-0 text-right text-[11px] font-black",
                      isCurrent ? "text-gold" : "text-muted-foreground",
                    )}
                  >
                    {formatMultiplier(rowMultiplier)}
                  </span>

                  <div
                    className="grid flex-1 gap-1.5"
                    style={{ gridTemplateColumns: `repeat(${config.tiles}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: config.tiles }, (_, tile) => {
                      const isTrap = layout[rowIndex]?.includes(tile);
                      const picked = rowPick?.tile === tile;
                      const show = picked || (reveal && rowIndex <= level);

                      return (
                        <motion.button
                          key={tile}
                          type="button"
                          disabled={!isCurrent}
                          onClick={() => pick(tile)}
                          whileHover={isCurrent ? { scale: 1.04 } : undefined}
                          whileTap={isCurrent ? { scale: 0.95 } : undefined}
                          className={cn(
                            "flex h-11 items-center justify-center rounded-lg border transition-colors",
                            isCurrent
                              ? "border-gold/50 bg-gold/10 hover:bg-gold/20"
                              : "border-white/[0.06] bg-surface-raised",
                            show && !isTrap && "border-success/50 bg-success/15",
                            show && isTrap && "border-destructive/50 bg-destructive/15",
                            !isCurrent && !show && "opacity-45",
                          )}
                          aria-label={`Ebene ${rowIndex + 1}, Feld ${tile + 1}`}
                        >
                          <AnimatePresence>
                            {show && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                              >
                                {isTrap ? (
                                  <Skull className="h-4 w-4 text-destructive" />
                                ) : (
                                  <Star className="h-4 w-4 fill-success text-success" />
                                )}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {status !== "idle" && (
            <p
              className={cn(
                "mt-5 text-center text-sm font-black uppercase tracking-[0.2em]",
                status === "lost" && "text-destructive",
                status === "won" && "text-success",
                status === "playing" && "text-muted-foreground",
              )}
            >
              {status === "lost"
                ? "Turm eingestürzt"
                : status === "won"
                  ? "Ausgezahlt"
                  : `Ebene ${level + 1} von ${LEVELS}`}
            </p>
          )}
        </div>
      }
      belowBoard={<HistoryStrip slug={GAME.slug} />}
    />
  );
}
