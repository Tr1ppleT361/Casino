"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Rocket, Timer, TrendingUp, Users } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CrashChart,
  type CrashPhase,
} from "@/components/games/crash/crash-chart";
import {
  buildDemoPlayers,
  settleDemoPlayers,
  type DemoPlayer,
} from "@/components/games/crash/demo-players";
import { useGameSession } from "@/hooks/use-game";
import { useCurrency } from "@/hooks/use-currency";
import { crashPointFrom } from "@/lib/rng";
import { formatMultiplier, parseAmountInput } from "@/lib/currency";
import { playPitchedTick, playSound } from "@/lib/sound";
import { toast } from "@/store/toast";
import { getGame } from "@/lib/games";
import { cn } from "@/lib/utils";

const GAME = getGame("crash")!;

const BETTING_MS = 6000;
const AFTERMATH_MS = 3400;
/** Multiplier growth: m(t) = e^(GROWTH * t_seconds). */
const GROWTH = 0.15;

const AUTO_PRESETS = [2, 3, 5, 10];

interface RoundState {
  crashPoint: number;
  nonce: number;
  players: DemoPlayer[];
}

export function CrashGame() {
  const session = useGameSession(GAME);
  const { format } = useCurrency();

  const [phase, setPhase] = useState<CrashPhase>("betting");
  const [countdown, setCountdown] = useState(BETTING_MS);
  const [elapsed, setElapsed] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [round, setRound] = useState<RoundState | null>(null);
  const [players, setPlayers] = useState<DemoPlayer[]>([]);
  const [history, setHistory] = useState<number[]>([]);

  const [stakedBet, setStakedBet] = useState<number | null>(null);
  const [queued, setQueued] = useState(false);
  const [cashedAt, setCashedAt] = useState<number | null>(null);

  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoTarget, setAutoTarget] = useState(2);
  const [autoText, setAutoText] = useState("2.00");

  // Refs mirror state for the animation loop, which must not re-subscribe.
  const roundRef = useRef<RoundState | null>(null);
  const stakedRef = useRef<number | null>(null);
  const cashedRef = useRef<number | null>(null);
  const autoRef = useRef({ enabled: false, target: 2 });
  const queuedRef = useRef(false);
  const betRef = useRef(session.bet);
  const tickRef = useRef(0);

  roundRef.current = round;
  stakedRef.current = stakedBet;
  cashedRef.current = cashedAt;
  autoRef.current = { enabled: autoEnabled, target: autoTarget };
  queuedRef.current = queued;
  betRef.current = session.bet;

  const sessionRef = useRef(session);
  sessionRef.current = session;

  /** Resolve the player's open bet as a loss. */
  const bust = useCallback((crashPoint: number) => {
    const stake = stakedRef.current;
    if (stake === null) return;
    sessionRef.current.finishRound({
      bet: stake,
      payout: 0,
      multiplier: 0,
      detail: `Crashed @ ${formatMultiplier(crashPoint)}`,
    });
    setStakedBet(null);
    stakedRef.current = null;
  }, []);

  const cashOut = useCallback((value: number, auto = false) => {
    const stake = stakedRef.current;
    if (stake === null || cashedRef.current !== null) return;
    const multiplierAtCashout = Math.floor(value * 100) / 100;
    const payout = stake * multiplierAtCashout;

    setCashedAt(multiplierAtCashout);
    cashedRef.current = multiplierAtCashout;
    setStakedBet(null);
    stakedRef.current = null;

    sessionRef.current.finishRound({
      bet: stake,
      payout,
      multiplier: multiplierAtCashout,
      detail: auto
        ? `Auto-Cashout @ ${formatMultiplier(multiplierAtCashout)}`
        : `Cashout @ ${formatMultiplier(multiplierAtCashout)}`,
    });
    playSound("cashout");
  }, []);

  /* ------------------------------------------------------------------ */
  /* Round loop                                                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let frame = 0;
    let cancelled = false;

    const startBetting = () => {
      if (cancelled) return;
      setPhase("betting");
      setElapsed(0);
      setMultiplier(1);
      setCashedAt(null);
      cashedRef.current = null;

      // The outcome is fixed here - before anyone can place or change a bet,
      // and without touching the balance.
      const { commit, random } = sessionRef.current.drawRound();
      const crashPoint = crashPointFrom(random.next());
      const state: RoundState = {
        crashPoint,
        nonce: commit.nonce,
        players: buildDemoPlayers(random),
      };
      setRound(state);
      roundRef.current = state;
      setPlayers(state.players);

      const start = performance.now();
      const tickBetting = (now: number) => {
        if (cancelled) return;
        const remaining = BETTING_MS - (now - start);
        setCountdown(Math.max(0, remaining));
        if (remaining <= 0) {
          startRunning();
          return;
        }
        frame = requestAnimationFrame(tickBetting);
      };
      frame = requestAnimationFrame(tickBetting);
    };

    const startRunning = () => {
      if (cancelled) return;
      setPhase("running");
      tickRef.current = 0;

      // Auto-join the round if the player queued a bet during the countdown.
      if (queuedRef.current) {
        const stake = betRef.current;
        if (sessionRef.current.chargeBet(stake)) {
          setStakedBet(stake);
          stakedRef.current = stake;
        }
        setQueued(false);
        queuedRef.current = false;
      }

      const start = performance.now();
      const crashPoint = roundRef.current?.crashPoint ?? 1;

      const tick = (now: number) => {
        if (cancelled) return;
        const ms = now - start;
        const value = Math.exp(GROWTH * (ms / 1000));

        if (value >= crashPoint) {
          setElapsed((Math.log(crashPoint) / GROWTH) * 1000);
          setMultiplier(crashPoint);
          setPlayers((current) => settleDemoPlayers(current, crashPoint));
          setPhase("crashed");
          setHistory((current) => [crashPoint, ...current].slice(0, 24));
          playSound("crash");
          bust(crashPoint);
          setTimeout(startBetting, AFTERMATH_MS);
          return;
        }

        setElapsed(ms);
        setMultiplier(value);
        setPlayers((current) => settleDemoPlayers(current, value));

        const auto = autoRef.current;
        if (
          auto.enabled &&
          stakedRef.current !== null &&
          cashedRef.current === null &&
          value >= auto.target
        ) {
          cashOut(Math.min(auto.target, crashPoint), true);
        }

        if (ms - tickRef.current > 260) {
          tickRef.current = ms;
          playPitchedTick(Math.min((value - 1) / 8, 1));
        }

        frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
    };

    startBetting();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
    // The loop owns its own lifecycle and reads live values through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeBet = stakedBet ?? (queued ? session.bet : null);
  const potentialWin = stakedBet !== null ? stakedBet * multiplier : undefined;

  const primaryAction = () => {
    if (phase === "running" && stakedBet !== null && cashedAt === null) {
      cashOut(multiplier);
      return;
    }
    if (queued) {
      setQueued(false);
      playSound("click");
      return;
    }
    if (!session.canAfford(session.bet)) {
      toast("Demo-Guthaben reicht nicht", {
        description: "Fülle dein virtuelles Guthaben kostenlos wieder auf.",
        variant: "danger",
      });
      return;
    }
    setQueued(true);
    playSound("bet");
    toast("Einsatz für die nächste Runde vorgemerkt", {
      description: `${format(session.bet)} · wird beim Rundenstart abgebucht.`,
    });
  };

  const canCashOut = phase === "running" && stakedBet !== null && cashedAt === null;

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
          disabled={stakedBet !== null}
          multiplier={canCashOut ? multiplier : undefined}
          potentialWin={potentialWin}
          extra={
            <div className="space-y-2.5 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-cashout">Auto Cashout</Label>
                <Switch
                  id="auto-cashout"
                  checked={autoEnabled}
                  onCheckedChange={(checked) => {
                    setAutoEnabled(checked);
                    playSound("click");
                  }}
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {AUTO_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    size="sm"
                    variant={autoTarget === preset && autoEnabled ? "default" : "secondary"}
                    onClick={() => {
                      setAutoTarget(preset);
                      setAutoText(preset.toFixed(2));
                      setAutoEnabled(true);
                      playSound("click");
                    }}
                    className="text-[11px] font-black"
                  >
                    {preset}.00x
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  inputMode="decimal"
                  value={autoText}
                  onChange={(event) => setAutoText(event.target.value)}
                  onBlur={() => {
                    const value = Math.max(1.01, parseAmountInput(autoText) || 2);
                    setAutoTarget(value);
                    setAutoText(value.toFixed(2));
                  }}
                  className="tabular h-9 flex-1 rounded-lg border border-white/10 bg-surface px-3 text-sm font-bold focus-visible:border-primary/60 focus-visible:outline-none"
                  aria-label="Eigener Auto-Cashout-Multiplikator"
                />
                <span className="text-xs font-black text-muted-foreground">Custom</span>
              </div>

              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Auto-Cashout zahlt automatisch beim Erreichen des Ziels aus – sofern die
                Runde vorher nicht crasht.
              </p>
            </div>
          }
        >
          <Button
            size="xl"
            variant={canCashOut ? "success" : queued ? "secondary" : "default"}
            className="w-full"
            onClick={primaryAction}
            disabled={phase === "crashed" && !queued}
          >
            {canCashOut ? (
              <>
                <TrendingUp className="h-5 w-5" />
                Cash Out {format(stakedBet! * multiplier)}
              </>
            ) : queued ? (
              <>
                <Timer className="h-5 w-5" />
                Vorgemerkt – abbrechen
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5" />
                {phase === "betting" ? "Einsatz platzieren" : "Nächste Runde"}
              </>
            )}
          </Button>

          {activeBet !== null && (
            <p className="text-center text-xs text-muted-foreground">
              Aktiver Demo-Einsatz: <span className="font-bold">{format(activeBet)}</span>
            </p>
          )}
        </BetControls>
      }
      board={
        <div className="p-3 sm:p-4">
          <CrashChart
            phase={phase}
            multiplier={multiplier}
            elapsed={elapsed}
            countdown={countdown}
            crashPoint={round?.crashPoint ?? null}
            cashedAt={cashedAt}
          />

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              Letzte Crashes
            </span>
            <AnimatePresence initial={false}>
              {history.map((point, index) => (
                <motion.span
                  key={`${point}-${index}-${history.length}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "tabular rounded-lg px-2 py-0.5 text-[11px] font-black",
                    point >= 10
                      ? "bg-gold/20 text-gold"
                      : point >= 2
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive",
                  )}
                >
                  {formatMultiplier(point)}
                </motion.span>
              ))}
            </AnimatePresence>
            {history.length === 0 && (
              <span className="text-[11px] text-muted-foreground">
                Noch keine Runde beendet.
              </span>
            )}
          </div>
        </div>
      }
      belowBoard={
        <div className="rounded-2xl border border-white/[0.06] bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black">
              <Users className="h-4 w-4 text-primary" />
              Live Bets
            </h2>
            <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Simulierte Demo-Spieler
            </span>
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 font-bold">Spieler</th>
                  <th className="pb-2 text-right font-bold">Einsatz</th>
                  <th className="pb-2 text-right font-bold">Cashout</th>
                  <th className="pb-2 text-right font-bold">Gewinn</th>
                </tr>
              </thead>
              <tbody>
                {stakedBet !== null && (
                  <tr className="border-t border-primary/20 bg-primary/[0.07]">
                    <td className="py-2 font-black text-primary">Du</td>
                    <td className="tabular py-2 text-right font-bold">
                      {format(stakedBet)}
                    </td>
                    <td className="tabular py-2 text-right">
                      {cashedAt ? formatMultiplier(cashedAt) : "—"}
                    </td>
                    <td className="tabular py-2 text-right text-success">
                      {cashedAt ? format(stakedBet * cashedAt) : "—"}
                    </td>
                  </tr>
                )}
                {players.map((player) => (
                  <tr key={player.id} className="border-t border-white/[0.05]">
                    <td className="py-2 font-semibold text-muted-foreground">
                      {player.name}
                    </td>
                    <td className="tabular py-2 text-right">{format(player.bet)}</td>
                    <td
                      className={cn(
                        "tabular py-2 text-right font-bold",
                        player.cashedAt
                          ? "text-success"
                          : phase === "crashed"
                            ? "text-destructive"
                            : "text-muted-foreground",
                      )}
                    >
                      {player.cashedAt
                        ? formatMultiplier(player.cashedAt)
                        : phase === "crashed"
                          ? "Crash"
                          : "—"}
                    </td>
                    <td className="tabular py-2 text-right text-muted-foreground">
                      {player.cashedAt ? format(player.bet * player.cashedAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {round && (
            <p className="mt-3 border-t border-white/[0.05] pt-3 text-[10px] text-muted-foreground">
              Runde #{round.nonce} · Ergebnis vor dem Rundenstart festgelegt und
              unabhängig von Einsatz und Guthaben.
            </p>
          )}
        </div>
      }
    />
  );
}
