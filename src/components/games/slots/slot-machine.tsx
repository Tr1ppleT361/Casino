"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gauge, Play, RefreshCw, Sparkles, Square } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { PaytableDialog } from "@/components/games/slots/paytable-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGameSession } from "@/hooks/use-game";
import { useCurrency } from "@/hooks/use-currency";
import {
  FREE_SPINS_AWARDED,
  FREE_SPIN_MULTIPLIER,
  LINE_COUNT,
  PAYLINES,
  REELS,
  ROWS,
  buildStrip,
  evaluateSpin,
  spinGrid,
  type Grid,
  type SlotSymbol,
  type SpinResult,
} from "@/lib/slots";
import { SLOT_THEME_BY_SLUG } from "@/lib/slot-themes";
import { formatMultiplier } from "@/lib/currency";
import { getGame } from "@/lib/games";
import { playSound } from "@/lib/sound";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";

const AUTO_OPTIONS = [10, 25, 50, 100];

export function SlotMachine({ slug }: { slug: string }) {
  const game = getGame(slug)!;
  const theme = SLOT_THEME_BY_SLUG.get(slug)!;
  const session = useGameSession(game);
  const { format } = useCurrency();

  const strip = useRef(buildStrip(theme));
  const [grid, setGrid] = useState<Grid>(() =>
    Array.from({ length: REELS }, (_, reel) =>
      Array.from({ length: ROWS }, (_, row) => strip.current[(reel * 3 + row * 7) % strip.current.length]),
    ),
  );
  const [locked, setLocked] = useState(REELS);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [autoLeft, setAutoLeft] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [freeTotal, setFreeTotal] = useState(0);
  const [freeWin, setFreeWin] = useState(0);
  const [lastWin, setLastWin] = useState(0);

  const timers = useRef<number[]>([]);
  const spinningRef = useRef(false);
  const autoRef = useRef(0);
  const freeRef = useRef(0);
  const turboRef = useRef(false);
  const betRef = useRef(session.bet);

  spinningRef.current = spinning;
  autoRef.current = autoLeft;
  freeRef.current = freeSpins;
  turboRef.current = turbo;
  betRef.current = session.bet;

  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    },
    [],
  );

  // Values the spin closure reads between spins.
  const freeTotalRef = useRef(0);
  const freeWinRef = useRef(0);
  const formatRef = useRef(format);
  const lockedCount = useRef(0);
  freeWinRef.current = freeWin;
  formatRef.current = format;

  const runSpin = useCallback(() => {
    if (spinningRef.current) return;

    const isFree = freeRef.current > 0;
    const stake = betRef.current;

    if (!isFree && !sessionRef.current.chargeBet(stake)) {
      setAutoLeft(0);
      autoRef.current = 0;
      return;
    }

    const { random } = sessionRef.current.drawRound();
    const outcome = evaluateSpin(spinGrid(random, strip.current));

    setSpinning(true);
    spinningRef.current = true;
    setLocked(0);
    setResult(null);
    playSound("spin");

    const reelDelay = turboRef.current ? 110 : 240;
    const cycle = turboRef.current ? 45 : 70;

    lockedCount.current = 0;

    // Cycle random faces on the not-yet-locked reels for the spin feel.
    const shuffleTimer = window.setInterval(() => {
      setGrid((current) =>
        current.map((column, reel) =>
          reel < lockedCount.current
            ? column
            : Array.from(
                { length: ROWS },
                () => strip.current[Math.floor(Math.random() * strip.current.length)],
              ),
        ),
      );
    }, cycle);

    for (let reel = 0; reel < REELS; reel++) {
      const id = window.setTimeout(
        () => {
          lockedCount.current = reel + 1;
          setLocked(reel + 1);
          setGrid((current) =>
            current.map((column, index) => (index <= reel ? outcome.grid[index] : column)),
          );
          playSound("tick");
        },
        reelDelay * (reel + 1) + (turboRef.current ? 120 : 260),
      );
      timers.current.push(id);
    }

    const finishId = window.setTimeout(
      () => {
        window.clearInterval(shuffleTimer);
        setGrid(outcome.grid);
        setResult(outcome);
        setSpinning(false);
        spinningRef.current = false;

        const multiplier = isFree
          ? outcome.totalMultiplier * FREE_SPIN_MULTIPLIER
          : outcome.totalMultiplier;
        const payout = stake * multiplier;
        setLastWin(payout);

        sessionRef.current.finishRound({
          bet: isFree ? 0 : stake,
          payout,
          multiplier,
          detail: isFree
            ? `Freispiel ${freeTotalRef.current - freeRef.current + 1}/${freeTotalRef.current} · ${outcome.lineWins.length} Linien`
            : `${outcome.lineWins.length} Gewinnlinien${outcome.scatterCount >= 3 ? ` · ${outcome.scatterCount} Scatter` : ""}`,
          silent: autoRef.current > 0 && multiplier < 8,
        });

        if (isFree) {
          setFreeWin((current) => current + payout);
          const remaining = freeRef.current - 1 + outcome.freeSpinsWon;
          freeRef.current = remaining;
          setFreeSpins(remaining);
          if (outcome.freeSpinsWon > 0) {
            freeTotalRef.current += outcome.freeSpinsWon;
            setFreeTotal(freeTotalRef.current);
            toast("Freispiele verlängert", {
              description: `${outcome.freeSpinsWon} weitere Freispiele.`,
              variant: "gold",
            });
          }
          if (remaining > 0) {
            timers.current.push(
              window.setTimeout(() => runSpin(), turboRef.current ? 260 : 620),
            );
          } else {
            toast("Freispiele beendet", {
              description: `Gesamtgewinn der Freispiele: ${formatRef.current(freeWinRef.current + payout)}`,
              variant: "gold",
            });
          }
          return;
        }

        if (outcome.freeSpinsWon > 0) {
          freeRef.current = outcome.freeSpinsWon;
          freeTotalRef.current = outcome.freeSpinsWon;
          setFreeSpins(outcome.freeSpinsWon);
          setFreeTotal(outcome.freeSpinsWon);
          setFreeWin(0);
          toast(`${outcome.freeSpinsWon} Freispiele!`, {
            description: `Alle Gewinne zählen ${FREE_SPIN_MULTIPLIER}-fach.`,
            variant: "gold",
          });
          timers.current.push(window.setTimeout(() => runSpin(), 900));
          return;
        }

        if (autoRef.current > 0) {
          const remaining = autoRef.current - 1;
          autoRef.current = remaining;
          setAutoLeft(remaining);
          if (remaining > 0) {
            timers.current.push(
              window.setTimeout(() => runSpin(), turboRef.current ? 180 : 520),
            );
          }
        }
      },
      reelDelay * REELS + (turboRef.current ? 220 : 460),
    );
    timers.current.push(finishId);
  }, []);

  const startAuto = (count: number) => {
    autoRef.current = count;
    setAutoLeft(count);
    playSound("click");
    if (!spinningRef.current) runSpin();
  };

  const stopAuto = () => {
    autoRef.current = 0;
    setAutoLeft(0);
    playSound("click");
  };

  const winningPositions = new Set(
    (result?.lineWins ?? []).flatMap((win) =>
      win.positions.map(([reel, row]) => `${reel}-${row}`),
    ),
  );

  const scatterPositions = new Set(
    result && result.scatterCount >= 3
      ? result.grid.flatMap((column, reel) =>
          column
            .map((symbol, row) => (symbol.tier === "scatter" ? `${reel}-${row}` : null))
            .filter((value): value is string => value !== null),
        )
      : [],
  );

  return (
    <GameShell
      game={game}
      controls={
        <BetControls
          bet={session.bet}
          onBetChange={session.setBet}
          onHalve={session.halveBet}
          onDouble={session.doubleBet}
          onMax={session.maxBet}
          disabled={spinning || autoLeft > 0 || freeSpins > 0}
          multiplier={result?.totalMultiplier}
          potentialWin={lastWin || undefined}
          extra={
            <div className="space-y-3 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="turbo" className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" /> Turbo Mode
                </Label>
                <Switch
                  id="turbo"
                  checked={turbo}
                  onCheckedChange={(checked) => {
                    setTurbo(checked);
                    playSound("click");
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Auto Spin</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {AUTO_OPTIONS.map((count) => (
                    <Button
                      key={count}
                      size="sm"
                      variant="secondary"
                      disabled={autoLeft > 0 || freeSpins > 0}
                      onClick={() => startAuto(count)}
                      className="text-xs font-black"
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {LINE_COUNT} Gewinnlinien · Einsatz pro Linie{" "}
                {format(session.bet / LINE_COUNT)}
              </p>
            </div>
          }
        >
          {autoLeft > 0 ? (
            <Button size="xl" variant="destructive" className="w-full" onClick={stopAuto}>
              <Square className="h-5 w-5" />
              Auto Spin stoppen ({autoLeft})
            </Button>
          ) : (
            <Button
              size="xl"
              className="w-full"
              onClick={() => runSpin()}
              disabled={spinning || freeSpins > 0}
            >
              {freeSpins > 0 ? (
                <>
                  <Sparkles className="h-5 w-5" /> Freispiele laufen ({freeSpins})
                </>
              ) : spinning ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" /> Dreht…
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" /> Spin
                </>
              )}
            </Button>
          )}

          <PaytableDialog theme={theme} />
        </BetControls>
      }
      board={
        <div className="p-3 sm:p-5" style={{ background: theme.background }}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{theme.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {theme.subtitle}
              </p>
            </div>
            {freeSpins > 0 && (
              <span className="shrink-0 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[11px] font-black text-gold">
                {freeSpins} Freispiele · {FREE_SPIN_MULTIPLIER}x
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1.5 rounded-2xl border border-white/[0.08] bg-black/35 p-2 sm:gap-2.5 sm:p-3">
            {grid.map((column, reel) => (
              <div key={reel} className="flex flex-col gap-1.5 sm:gap-2.5">
                {column.map((symbol, row) => {
                  const key = `${reel}-${row}`;
                  const isWinning = winningPositions.has(key) || scatterPositions.has(key);
                  return (
                    <SlotCell
                      key={key}
                      symbol={symbol}
                      spinning={spinning && reel >= locked}
                      winning={isWinning}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2">
            <div className="flex items-center gap-4 text-xs">
              <span>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Letzter Gewinn
                </span>
                <span className="tabular font-black text-success">
                  {lastWin > 0 ? format(lastWin) : "—"}
                </span>
              </span>
              <span>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Multiplikator
                </span>
                <span className="tabular font-black">
                  {result ? formatMultiplier(result.totalMultiplier) : "—"}
                </span>
              </span>
              {freeTotal > 0 && (
                <span>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Freispiel-Gewinn
                  </span>
                  <span className="tabular font-black text-gold">{format(freeWin)}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {(result?.lineWins ?? []).slice(0, 6).map((win) => (
                <span
                  key={win.line}
                  className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-black text-success"
                  title={`Linie ${win.line + 1}: ${win.count}x ${win.symbol.glyph}`}
                >
                  L{win.line + 1} {win.symbol.glyph}
                  {win.count}
                </span>
              ))}
            </div>
          </div>

          <details className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Gewinnlinien anzeigen
            </summary>
            <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {PAYLINES.map((line, index) => (
                <div key={index} className="rounded-md bg-white/[0.04] p-1">
                  <p className="mb-0.5 text-center text-[9px] font-bold text-muted-foreground">
                    L{index + 1}
                  </p>
                  <div className="grid grid-cols-5 gap-px">
                    {line.map((row, reel) => (
                      <div key={reel} className="grid grid-rows-3 gap-px">
                        {[0, 1, 2].map((cell) => (
                          <span
                            key={cell}
                            className={cn(
                              "h-1 rounded-[1px]",
                              cell === row ? "bg-primary" : "bg-white/10",
                            )}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      }
      belowBoard={<HistoryStrip slug={game.slug} />}
    />
  );
}

function SlotCell({
  symbol,
  spinning,
  winning,
}: {
  symbol: SlotSymbol;
  spinning: boolean;
  winning: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-xl border transition-colors",
        winning
          ? "border-gold/60 bg-gold/15 shadow-glow-gold"
          : "border-white/[0.07] bg-white/[0.04]",
      )}
      style={winning ? undefined : { boxShadow: `inset 0 0 24px -12px ${symbol.color}` }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={`${symbol.id}-${spinning}`}
          initial={{ y: spinning ? -18 : 0, opacity: spinning ? 0.4 : 0.6, scale: 0.9 }}
          animate={{
            y: 0,
            opacity: 1,
            scale: winning ? [1, 1.16, 1] : 1,
            filter: spinning ? "blur(2px)" : "blur(0px)",
          }}
          transition={{ duration: winning ? 0.6 : 0.12, repeat: winning ? Infinity : 0 }}
          className="select-none text-2xl sm:text-4xl"
        >
          {symbol.glyph}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
