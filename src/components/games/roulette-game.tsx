"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Eraser, RotateCw, Undo2 } from "lucide-react";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGameSession } from "@/hooks/use-game";
import { useCurrency } from "@/hooks/use-currency";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  TABLE_ROWS,
  WHEEL_ORDER,
  betSpec,
  pocketColor,
  type BetKey,
} from "@/lib/roulette";
import { getGame } from "@/lib/games";
import { playSound } from "@/lib/sound";
import { toast } from "@/store/toast";
import { useCasino } from "@/store/casino";
import { cn } from "@/lib/utils";

const GAME = getGame("roulette")!;
const CHIPS = [0.1, 0.5, 1, 5, 25, 100];
const SPIN_MS = 4600;
const SEGMENT = 360 / WHEEL_ORDER.length;

export function RouletteGame() {
  const session = useGameSession(GAME);
  const { format, formatSmart } = useCurrency();
  const balance = useCasino((state) => state.balance);
  const hydrated = useHydrated();
  const wheel = useAnimation();

  const [chip, setChip] = useState(1);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<BetKey[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [pocket, setPocket] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const total = useMemo(
    () => Object.values(bets).reduce((sum, value) => sum + value, 0),
    [bets],
  );

  const place = useCallback(
    (key: BetKey) => {
      if (spinning) return;
      if (total + chip > balance + 1e-9) {
        toast("Demo-Guthaben reicht nicht", {
          description: "Reduziere den Chip-Wert oder fülle kostenlos auf.",
          variant: "danger",
        });
        return;
      }
      setBets((current) => ({ ...current, [key]: (current[key] ?? 0) + chip }));
      setOrder((current) => [...current, key]);
      playSound("chip");
    },
    [spinning, total, chip, balance],
  );

  const undo = useCallback(() => {
    if (spinning || order.length === 0) return;
    const last = order[order.length - 1];
    setOrder((current) => current.slice(0, -1));
    setBets((current) => {
      const next = { ...current };
      const remaining = (next[last] ?? 0) - chip;
      if (remaining > 1e-9) next[last] = remaining;
      else delete next[last];
      return next;
    });
    playSound("click");
  }, [spinning, order, chip]);

  const clear = useCallback(() => {
    if (spinning) return;
    setBets({});
    setOrder([]);
    playSound("click");
  }, [spinning]);

  const spin = useCallback(async () => {
    if (spinning) return;
    if (total <= 0) {
      toast("Noch kein Einsatz", {
        description: "Setze Chips auf den Tisch, dann kann das Rad drehen.",
        variant: "danger",
      });
      return;
    }
    if (!session.chargeBet(total)) return;

    const { random } = session.drawRound();
    const index = random.nextInt(WHEEL_ORDER.length);
    const result = WHEEL_ORDER[index];

    setSpinning(true);
    setPocket(null);
    setLastWin(null);
    playSound("roulette");

    const target = rotation + 360 * 5 + (360 - index * SEGMENT - rotation % 360);
    setRotation(target);
    await wheel.start({
      rotate: target,
      transition: { duration: SPIN_MS / 1000, ease: [0.12, 0.78, 0.2, 1] },
    });

    const payout = Object.entries(bets).reduce((sum, [key, amount]) => {
      const spec = betSpec(key as BetKey);
      return sum + (spec.covers(result) ? amount * spec.payout : 0);
    }, 0);

    setPocket(result);
    setLastWin(payout);
    setSpinning(false);

    session.finishRound({
      bet: total,
      payout,
      multiplier: total > 0 ? Math.round((payout / total) * 100) / 100 : 0,
      detail: `Pocket ${result} (${pocketColor(result) === "red" ? "Rot" : pocketColor(result) === "black" ? "Schwarz" : "Grün"})`,
    });
  }, [spinning, total, session, bets, rotation, wheel]);

  const chipOn = (key: BetKey) => bets[key];

  const NumberCell = ({ value }: { value: number }) => {
    const color = pocketColor(value);
    const staked = chipOn(`straight:${value}`);
    return (
      <button
        type="button"
        onClick={() => place(`straight:${value}`)}
        disabled={spinning}
        className={cn(
          "relative flex h-9 items-center justify-center rounded-md text-xs font-black transition-all hover:scale-105 sm:h-10 sm:text-sm",
          color === "red" && "bg-rose-700/80 text-white hover:bg-rose-600",
          color === "black" && "bg-slate-900 text-white hover:bg-slate-800",
          color === "green" && "bg-emerald-700 text-white hover:bg-emerald-600",
          pocket === value && "ring-2 ring-gold ring-offset-2 ring-offset-surface-sunken",
        )}
      >
        {value}
        {staked && <Chip amount={staked} />}
      </button>
    );
  };

  const OutsideCell = ({
    betKey,
    children,
    className,
  }: {
    betKey: BetKey;
    children: React.ReactNode;
    className?: string;
  }) => {
    const staked = chipOn(betKey);
    return (
      <button
        type="button"
        onClick={() => place(betKey)}
        disabled={spinning}
        className={cn(
          "relative flex h-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-[11px] font-black transition-all hover:bg-white/[0.09] sm:h-10 sm:text-xs",
          className,
        )}
      >
        {children}
        {staked && <Chip amount={staked} />}
      </button>
    );
  };

  const Chip = ({ amount }: { amount: number }) => (
    <span className="absolute -right-1.5 -top-1.5 rounded-full border border-gold/60 bg-gold px-1.5 py-px text-[9px] font-black text-gold-foreground shadow">
      {formatSmart(amount, 8, { bare: true })}
    </span>
  );

  return (
    <GameShell
      game={GAME}
      controls={
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label>Chip-Wert</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {CHIPS.map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={chip === value ? "gold" : "secondary"}
                  disabled={spinning}
                  onClick={() => {
                    setChip(value);
                    playSound("click");
                  }}
                  className="text-[11px] font-black"
                >
                  {formatSmart(value, 9, { bare: true })}
                </Button>
              ))}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3 text-xs">
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Gesamteinsatz
              </dt>
              <dd className="tabular mt-0.5 truncate text-sm font-black">
                {formatSmart(total)}
              </dd>
            </div>
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Letzter Gewinn
              </dt>
              <dd className="tabular mt-0.5 truncate text-sm font-black text-success">
                {lastWin === null ? "—" : formatSmart(lastWin)}
              </dd>
            </div>
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Positionen
              </dt>
              <dd className="tabular mt-0.5 text-sm font-black">
                {Object.keys(bets).length}
              </dd>
            </div>
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Balance
              </dt>
              <dd className="tabular mt-0.5 truncate text-sm font-black">
                {hydrated ? formatSmart(balance) : format(0)}
              </dd>
            </div>
          </dl>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={undo} disabled={spinning || order.length === 0}>
              <Undo2 className="h-4 w-4" /> Zurück
            </Button>
            <Button variant="outline" onClick={clear} disabled={spinning || total === 0}>
              <Eraser className="h-4 w-4" /> Leeren
            </Button>
          </div>

          <Button size="xl" className="w-full" onClick={spin} disabled={spinning}>
            <RotateCw className={cn("h-5 w-5", spinning && "animate-spin")} />
            {spinning ? "Rad dreht…" : "Drehen"}
          </Button>

          <p className="text-center text-[10px] leading-relaxed text-muted-foreground/70">
            Virtual demo currency only. No deposits, withdrawals or real-money prizes.
          </p>
        </div>
      }
      board={
        <div className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
            <div className="relative aspect-square w-48 shrink-0 sm:w-56">
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
                <div className="h-0 w-0 border-x-[8px] border-t-[14px] border-x-transparent border-t-gold" />
              </div>
              <motion.svg
                viewBox="0 0 200 200"
                animate={wheel}
                className="h-full w-full"
                style={{ transformOrigin: "50% 50%" }}
              >
                <circle cx="100" cy="100" r="98" fill="hsl(30 40% 22%)" />
                <circle cx="100" cy="100" r="92" fill="hsl(240 26% 6%)" />
                {WHEEL_ORDER.map((number, index) => {
                  const start = index * SEGMENT;
                  const mid = ((start + SEGMENT / 2 - 90) * Math.PI) / 180;
                  const color = pocketColor(number);
                  const a0 = ((start - 90) * Math.PI) / 180;
                  const a1 = ((start + SEGMENT - 90) * Math.PI) / 180;
                  return (
                    <g key={number}>
                      <path
                        d={`M 100 100 L ${100 + 92 * Math.cos(a0)} ${100 + 92 * Math.sin(a0)} A 92 92 0 0 1 ${100 + 92 * Math.cos(a1)} ${100 + 92 * Math.sin(a1)} Z`}
                        fill={
                          color === "red"
                            ? "hsl(356 72% 42%)"
                            : color === "black"
                              ? "hsl(240 24% 12%)"
                              : "hsl(152 60% 32%)"
                        }
                        stroke="hsl(44 60% 45%)"
                        strokeWidth="0.4"
                      />
                      <text
                        x={100 + 80 * Math.cos(mid)}
                        y={100 + 80 * Math.sin(mid) + 2.5}
                        textAnchor="middle"
                        fontSize="7"
                        fontWeight="900"
                        fill="white"
                      >
                        {number}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="42" fill="hsl(30 40% 22%)" />
                <circle cx="100" cy="100" r="34" fill="hsl(240 22% 9%)" />
              </motion.svg>
            </div>

            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Gewinnzahl
              </p>
              <p
                className={cn(
                  "tabular text-5xl font-black sm:text-6xl",
                  pocket === null
                    ? "text-muted-foreground"
                    : pocketColor(pocket) === "red"
                      ? "text-rose-500"
                      : pocketColor(pocket) === "green"
                        ? "text-emerald-400"
                        : "text-foreground",
                )}
              >
                {spinning ? "…" : (pocket ?? "—")}
              </p>
              {pocket !== null && !spinning && (
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {pocketColor(pocket) === "red"
                    ? "Rot"
                    : pocketColor(pocket) === "black"
                      ? "Schwarz"
                      : "Zéro"}
                </p>
              )}
            </div>
          </div>

          {/* Betting felt */}
          <div className="overflow-x-auto">
            <div className="min-w-[34rem] space-y-1.5">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => place("straight:0")}
                  disabled={spinning}
                  className={cn(
                    "relative w-10 shrink-0 rounded-md bg-emerald-700 text-sm font-black text-white transition-all hover:bg-emerald-600",
                    pocket === 0 && "ring-2 ring-gold",
                  )}
                >
                  0
                  {chipOn("straight:0") && <Chip amount={chipOn("straight:0")!} />}
                </button>

                <div className="flex-1 space-y-1.5">
                  {TABLE_ROWS.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1.5">
                      <div className="grid flex-1 grid-cols-12 gap-1.5">
                        {row.map((value) => (
                          <NumberCell key={value} value={value} />
                        ))}
                      </div>
                      <OutsideCell
                        betKey={`column:${(3 - rowIndex) as 1 | 2 | 3}`}
                        className="w-14 shrink-0"
                      >
                        2:1
                      </OutsideCell>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ml-[2.875rem] grid grid-cols-3 gap-1.5 pr-[3.875rem]">
                <OutsideCell betKey="dozen:1">1. Dutzend</OutsideCell>
                <OutsideCell betKey="dozen:2">2. Dutzend</OutsideCell>
                <OutsideCell betKey="dozen:3">3. Dutzend</OutsideCell>
              </div>

              <div className="ml-[2.875rem] grid grid-cols-6 gap-1.5 pr-[3.875rem]">
                <OutsideCell betKey="low">1–18</OutsideCell>
                <OutsideCell betKey="even">Gerade</OutsideCell>
                <OutsideCell betKey="red" className="bg-rose-700/70 hover:bg-rose-600">
                  Rot
                </OutsideCell>
                <OutsideCell betKey="black" className="bg-slate-900 hover:bg-slate-800">
                  Schwarz
                </OutsideCell>
                <OutsideCell betKey="odd">Ungerade</OutsideCell>
                <OutsideCell betKey="high">19–36</OutsideCell>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            Europäisches Rad mit einer Null · Zahl 35:1 · Dutzend/Kolonne 2:1 ·
            Einfache Chancen 1:1 · Nur Demo-Guthaben
          </p>
        </div>
      }
      belowBoard={<HistoryStrip slug={GAME.slug} />}
    />
  );
}
