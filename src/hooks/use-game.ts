"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoundRandom } from "@/lib/rng";
import { playSound } from "@/lib/sound";
import { showWin, winTier } from "@/components/fx/win-overlay";
import { toast } from "@/store/toast";
import { useCasino, type RoundCommit } from "@/store/casino";
import { useCurrency } from "@/hooks/use-currency";
import { clamp, roundBase } from "@/lib/utils";
import type { GameDefinition } from "@/types";

/** Smallest stake we allow, in base demo units. */
export const MIN_BET = 0.01;
const DEFAULT_BET = 1;

export interface RoundHandle {
  commit: RoundCommit;
  random: RoundRandom;
}

export interface FinishInput {
  bet: number;
  payout: number;
  multiplier: number;
  detail?: string;
  /** Skip the celebration overlay (e.g. for auto-play spam). */
  silent?: boolean;
}

/**
 * Shared plumbing for every game: stake handling, provably-fair round seeds,
 * balance movements, history/statistics and the win celebration.
 */
export function useGameSession(game: GameDefinition) {
  const balance = useCasino((state) => state.balance);
  const placeBet = useCasino((state) => state.placeBet);
  const settle = useCasino((state) => state.settle);
  const commitRound = useCasino((state) => state.commitRound);
  const markPlayed = useCasino((state) => state.markPlayed);
  const { format } = useCurrency();

  const [bet, setBetRaw] = useState(DEFAULT_BET);

  useEffect(() => {
    markPlayed(game.slug);
  }, [game.slug, markPlayed]);

  const setBet = useCallback((value: number) => {
    setBetRaw(roundBase(Math.max(MIN_BET, Number.isFinite(value) ? value : MIN_BET)));
  }, []);

  const halveBet = useCallback(
    () => setBet(Math.max(MIN_BET, bet / 2)),
    [bet, setBet],
  );
  const doubleBet = useCallback(
    () => setBet(clamp(bet * 2, MIN_BET, Math.max(MIN_BET, balance))),
    [bet, balance, setBet],
  );
  const maxBet = useCallback(
    () => setBet(Math.max(MIN_BET, balance)),
    [balance, setBet],
  );

  const canAfford = useCallback(
    (amount = bet) => amount >= MIN_BET && amount <= balance + 1e-9,
    [bet, balance],
  );

  /**
   * Reserve the next provably-fair nonce and derive the round outcome without
   * touching the balance. Crash uses this to fix the result *before* anyone can
   * place a bet.
   */
  const drawRound = useCallback((): RoundHandle => {
    const commit = commitRound();
    return {
      commit,
      random: new RoundRandom(commit.serverSeed, commit.clientSeed, commit.nonce),
    };
  }, [commitRound]);

  /** Deduct a stake from the demo balance. Reports why it failed. */
  const chargeBet = useCallback(
    (amount = bet): boolean => {
      const stake = roundBase(amount);
      if (stake < MIN_BET) {
        toast("Einsatz zu klein", {
          description: `Mindestens ${format(MIN_BET)} pro Runde.`,
          variant: "danger",
        });
        return false;
      }
      if (!placeBet(stake)) {
        toast("Demo-Guthaben reicht nicht", {
          description: "Fülle dein virtuelles Guthaben kostenlos wieder auf.",
          variant: "danger",
        });
        return false;
      }
      playSound("bet");
      return true;
    },
    [bet, placeBet, format],
  );

  /** Deduct the stake and hand back a seeded RNG for the round. */
  const startRound = useCallback(
    (amount = bet): RoundHandle | null => {
      if (!chargeBet(amount)) return null;
      return drawRound();
    },
    [bet, chargeBet, drawRound],
  );

  /** Credit the payout, record the round and celebrate when it is worth it. */
  const finishRound = useCallback(
    ({ bet: stake, payout, multiplier, detail, silent }: FinishInput) => {
      const entry = settle({
        game: game.name,
        gameSlug: game.slug,
        bet: stake,
        payout,
        multiplier,
        detail,
      });

      if (entry.profit > 0) {
        const tier = winTier(multiplier);
        if (tier && !silent) {
          showWin({
            profit: entry.profit,
            multiplier,
            tier,
            game: game.name,
          });
        } else {
          playSound("win");
        }
      } else if (payout > 0) {
        playSound("cashout");
      } else {
        playSound("lose");
      }

      return entry;
    },
    [game.name, game.slug, settle],
  );

  return useMemo(
    () => ({
      balance,
      bet,
      setBet,
      halveBet,
      doubleBet,
      maxBet,
      canAfford,
      chargeBet,
      drawRound,
      startRound,
      finishRound,
    }),
    [
      balance,
      bet,
      setBet,
      halveBet,
      doubleBet,
      maxBet,
      canAfford,
      chargeBet,
      drawRound,
      startRound,
      finishRound,
    ],
  );
}
