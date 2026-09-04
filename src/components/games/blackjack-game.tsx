"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Hand, Play, Plus, Split } from "lucide-react";
import { BetControls } from "@/components/games/bet-controls";
import { GameShell } from "@/components/games/game-shell";
import { HistoryStrip } from "@/components/games/history-strip";
import { CardHand } from "@/components/games/cards/playing-card";
import { Button } from "@/components/ui/button";
import { useGameSession } from "@/hooks/use-game";
import { useCurrency } from "@/hooks/use-currency";
import {
  buildShoe,
  canSplit,
  handValue,
  isBlackjack,
  type Card,
} from "@/lib/cards";
import { getGame } from "@/lib/games";
import { playSound } from "@/lib/sound";
import { toast } from "@/store/toast";
import { cn } from "@/lib/utils";

const GAME = getGame("blackjack")!;

type Phase = "idle" | "player" | "dealer" | "done";
type HandResult = "blackjack" | "win" | "push" | "lose" | "bust";

interface PlayerHand {
  cards: Card[];
  bet: number;
  doubled: boolean;
  finished: boolean;
  fromSplit: boolean;
  result?: HandResult;
}

/** Payout multiple of the hand's stake, including the returned stake. */
const PAYOUT: Record<HandResult, number> = {
  blackjack: 2.5,
  win: 2,
  push: 1,
  lose: 0,
  bust: 0,
};

const RESULT_LABEL: Record<HandResult, string> = {
  blackjack: "Blackjack!",
  win: "Gewonnen",
  push: "Push",
  lose: "Verloren",
  bust: "Bust",
};

export function BlackjackGame() {
  const session = useGameSession(GAME);
  const { format } = useCurrency();

  const [shoe, setShoe] = useState<Card[]>([]);
  const [hands, setHands] = useState<PlayerHand[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [summary, setSummary] = useState<string | null>(null);

  const activeHand = hands[active];
  const dealerValue = handValue(dealer).total;
  const totalStake = hands.reduce((sum, hand) => sum + hand.bet, 0);

  const draw = useCallback((from: Card[], count: number): [Card[], Card[]] => {
    return [from.slice(0, count), from.slice(count)];
  }, []);

  /** Resolve every hand against the dealer and pay out in one settle call. */
  const settleAll = useCallback(
    (finalHands: PlayerHand[], dealerCards: Card[]) => {
      const dealerTotal = handValue(dealerCards).total;
      const dealerBJ = isBlackjack(dealerCards);

      const resolved = finalHands.map((hand) => {
        const total = handValue(hand.cards).total;
        let result: HandResult;

        if (total > 21) result = "bust";
        else if (isBlackjack(hand.cards) && !hand.fromSplit)
          result = dealerBJ ? "push" : "blackjack";
        else if (dealerBJ) result = "lose";
        else if (dealerTotal > 21) result = "win";
        else if (total > dealerTotal) result = "win";
        else if (total === dealerTotal) result = "push";
        else result = "lose";

        return { ...hand, result, finished: true };
      });

      const stake = resolved.reduce((sum, hand) => sum + hand.bet, 0);
      const payout = resolved.reduce(
        (sum, hand) => sum + hand.bet * PAYOUT[hand.result!],
        0,
      );

      setHands(resolved);
      setPhase("done");
      setSummary(
        resolved.length === 1
          ? RESULT_LABEL[resolved[0].result!]
          : resolved.map((hand) => RESULT_LABEL[hand.result!]).join(" · "),
      );

      session.finishRound({
        bet: stake,
        payout,
        multiplier: stake > 0 ? Math.round((payout / stake) * 100) / 100 : 0,
        detail: `Dealer ${dealerTotal} · ${resolved
          .map((hand) => handValue(hand.cards).total)
          .join("/")}`,
      });
    },
    [session],
  );

  /** Dealer draws to 17 (stands on all 17s). */
  const playDealer = useCallback(
    (finalHands: PlayerHand[], dealerCards: Card[], remaining: Card[]) => {
      const allBust = finalHands.every(
        (hand) => handValue(hand.cards).total > 21,
      );

      let cards = [...dealerCards];
      let deck = [...remaining];

      if (!allBust) {
        while (handValue(cards).total < 17) {
          cards = [...cards, deck[0]];
          deck = deck.slice(1);
        }
      }

      setDealer(cards);
      setShoe(deck);
      setPhase("dealer");
      playSound("card");

      window.setTimeout(() => settleAll(finalHands, cards), 520);
    },
    [settleAll],
  );

  const advance = useCallback(
    (updated: PlayerHand[], deck: Card[], fromIndex: number) => {
      const nextIndex = updated.findIndex(
        (hand, index) => index > fromIndex && !hand.finished,
      );

      if (nextIndex === -1) {
        playDealer(updated, dealer, deck);
        return;
      }
      setActive(nextIndex);
    },
    [dealer, playDealer],
  );

  const deal = useCallback(() => {
    const handle = session.startRound(session.bet);
    if (!handle) return;

    const fresh = buildShoe(handle.random);
    const [playerCards, afterPlayer] = draw(fresh, 2);
    const [dealerCards, rest] = draw(afterPlayer, 2);

    const hand: PlayerHand = {
      cards: playerCards,
      bet: session.bet,
      doubled: false,
      finished: false,
      fromSplit: false,
    };

    setShoe(rest);
    setHands([hand]);
    setDealer(dealerCards);
    setActive(0);
    setSummary(null);
    setPhase("player");
    playSound("card");

    // Natural blackjack ends the hand immediately.
    if (isBlackjack(playerCards)) {
      window.setTimeout(() => playDealer([{ ...hand, finished: true }], dealerCards, rest), 620);
    }
  }, [session, draw, playDealer]);

  const hit = useCallback(() => {
    if (phase !== "player" || !activeHand) return;
    const card = shoe[0];
    const deck = shoe.slice(1);
    const cards = [...activeHand.cards, card];
    const busted = handValue(cards).total > 21;

    const updated = hands.map((hand, index) =>
      index === active ? { ...hand, cards, finished: busted } : hand,
    );

    setHands(updated);
    setShoe(deck);
    playSound("card");

    if (busted) {
      playSound("lose");
      window.setTimeout(() => advance(updated, deck, active), 420);
    }
  }, [phase, activeHand, shoe, hands, active, advance]);

  const stand = useCallback(() => {
    if (phase !== "player" || !activeHand) return;
    const updated = hands.map((hand, index) =>
      index === active ? { ...hand, finished: true } : hand,
    );
    setHands(updated);
    advance(updated, shoe, active);
  }, [phase, activeHand, hands, active, advance, shoe]);

  const double = useCallback(() => {
    if (phase !== "player" || !activeHand || activeHand.cards.length !== 2) return;
    if (!session.chargeBet(activeHand.bet)) return;

    const card = shoe[0];
    const deck = shoe.slice(1);
    const cards = [...activeHand.cards, card];

    const updated = hands.map((hand, index) =>
      index === active
        ? { ...hand, cards, bet: hand.bet * 2, doubled: true, finished: true }
        : hand,
    );

    setHands(updated);
    setShoe(deck);
    playSound("card");
    window.setTimeout(() => advance(updated, deck, active), 460);
  }, [phase, activeHand, session, shoe, hands, active, advance]);

  const split = useCallback(() => {
    if (phase !== "player" || !activeHand || !canSplit(activeHand.cards)) return;
    if (hands.length >= 4) {
      toast("Maximal vier Hände", { variant: "danger" });
      return;
    }
    if (!session.chargeBet(activeHand.bet)) return;

    const [first, second] = activeHand.cards;
    const deck = [...shoe];
    const handA: PlayerHand = {
      ...activeHand,
      cards: [first, deck.shift()!],
      fromSplit: true,
    };
    const handB: PlayerHand = {
      ...activeHand,
      cards: [second, deck.shift()!],
      fromSplit: true,
    };

    const updated = [
      ...hands.slice(0, active),
      handA,
      handB,
      ...hands.slice(active + 1),
    ];

    setHands(updated);
    setShoe(deck);
    playSound("card");
  }, [phase, activeHand, hands, active, session, shoe]);

  const canDouble =
    phase === "player" &&
    activeHand?.cards.length === 2 &&
    session.balance >= activeHand.bet;
  const canSplitNow =
    phase === "player" &&
    activeHand !== undefined &&
    canSplit(activeHand.cards) &&
    hands.length < 4 &&
    session.balance >= activeHand.bet;

  const potentialWin = useMemo(
    () => (phase === "idle" ? session.bet * 2.5 : totalStake * 2),
    [phase, session.bet, totalStake],
  );

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
          disabled={phase !== "idle" && phase !== "done"}
          multiplier={phase === "idle" ? 2.5 : 2}
          potentialWin={potentialWin}
        >
          {phase === "idle" || phase === "done" ? (
            <Button size="xl" className="w-full" onClick={deal}>
              <Play className="h-5 w-5" />
              {phase === "done" ? "Neue Hand" : "Karten geben"}
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="lg"
                onClick={hit}
                disabled={phase !== "player"}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> Hit
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={stand}
                disabled={phase !== "player"}
                className="gap-1.5"
              >
                <Hand className="h-4 w-4" /> Stand
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={double}
                disabled={!canDouble}
                className="gap-1.5"
              >
                <Copy className="h-4 w-4" /> Double
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={split}
                disabled={!canSplitNow}
                className="gap-1.5"
              >
                <Split className="h-4 w-4" /> Split
              </Button>
            </div>
          )}

          {totalStake > 0 && phase !== "idle" && (
            <p className="text-center text-xs text-muted-foreground">
              Gesamteinsatz dieser Hand:{" "}
              <span className="font-bold">{format(totalStake)}</span>
            </p>
          )}
        </BetControls>
      }
      board={
        <div className="min-h-[26rem] bg-[radial-gradient(60%_60%_at_50%_0%,hsl(152_60%_18%/0.55),transparent_70%)] p-5 sm:p-8">
          <section className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Dealer{" "}
              {phase !== "idle" && phase !== "player" && (
                <span className="text-foreground">· {dealerValue}</span>
              )}
            </p>
            <div className="mt-2 flex justify-center">
              {dealer.length > 0 ? (
                <CardHand cards={dealer} hidden={phase === "player" ? 1 : 0} />
              ) : (
                <p className="py-10 text-sm text-muted-foreground">
                  Setze deinen Demo-Einsatz und lass geben.
                </p>
              )}
            </div>
          </section>

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <section className="space-y-4">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Deine {hands.length > 1 ? `${hands.length} Hände` : "Hand"}
            </p>

            <div className="flex flex-wrap justify-center gap-6">
              {hands.map((hand, index) => {
                const value = handValue(hand.cards);
                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-2xl border p-3 transition-all",
                      index === active && phase === "player"
                        ? "border-gold/50 bg-gold/[0.07] shadow-glow-gold"
                        : "border-white/[0.06] bg-white/[0.02]",
                    )}
                  >
                    <CardHand cards={hand.cards} />
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs">
                      <span className="tabular font-black">
                        {value.total}
                        {value.soft && value.total <= 21 ? " (soft)" : ""}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="tabular text-muted-foreground">
                        {format(hand.bet)}
                      </span>
                      {hand.doubled && (
                        <span className="rounded bg-accent/20 px-1.5 text-[9px] font-black text-accent">
                          2x
                        </span>
                      )}
                    </div>
                    {hand.result && (
                      <p
                        className={cn(
                          "mt-1.5 text-center text-[11px] font-black uppercase tracking-wider",
                          hand.result === "lose" || hand.result === "bust"
                            ? "text-destructive"
                            : hand.result === "push"
                              ? "text-muted-foreground"
                              : "text-success",
                        )}
                      >
                        {RESULT_LABEL[hand.result]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <AnimatePresence>
            {summary && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 text-center text-sm font-black uppercase tracking-[0.2em] text-foreground"
              >
                {summary}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-[10px] text-muted-foreground">
            6 Decks · Dealer zieht bis 17 · Blackjack zahlt 3:2 · Nur Demo-Guthaben
          </p>
        </div>
      }
      belowBoard={<HistoryStrip slug={GAME.slug} />}
    />
  );
}
