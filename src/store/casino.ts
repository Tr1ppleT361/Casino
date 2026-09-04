"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { casinoStorage, STORAGE_PREFIX } from "@/lib/persistence";
import { createSeedPair, hashSeed, randomHex, type SeedPair } from "@/lib/rng";
import { roundBase, uid } from "@/lib/utils";
import type { HistoryEntry, Stats } from "@/types";

/** Every new demo wallet starts here. Virtual value only. */
export const STARTING_BALANCE = 10_000;
const MAX_HISTORY = 250;
const MAX_RECENT = 12;

export interface RoundCommit {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface SettleInput {
  game: string;
  gameSlug: string;
  bet: number;
  payout: number;
  multiplier: number;
  detail?: string;
}

const emptyStats: Stats = {
  totalGames: 0,
  totalWagered: 0,
  totalWon: 0,
  biggestWin: 0,
  biggestMultiplier: 0,
  wins: 0,
  losses: 0,
  perGame: {},
};

interface CasinoState {
  balance: number;
  seeds: SeedPair;
  history: HistoryEntry[];
  stats: Stats;
  favorites: string[];
  recent: string[];
  topUps: number;
  hydrated: boolean;

  /** Reserve a bet. Returns false when the demo balance is too low. */
  placeBet: (amount: number) => boolean;
  /** Credit a payout and record history + statistics. */
  settle: (input: SettleInput) => HistoryEntry;
  /** Reserve the next provably-fair nonce for a round. */
  commitRound: () => RoundCommit;
  rotateServerSeed: () => void;
  setClientSeed: (seed: string) => void;

  topUp: () => void;
  toggleFavorite: (slug: string) => void;
  markPlayed: (slug: string) => void;
  clearHistory: () => void;
  resetAll: () => void;
}

export const useCasino = create<CasinoState>()(
  persist(
    (set, get) => ({
      balance: STARTING_BALANCE,
      seeds: createSeedPair(),
      history: [],
      stats: emptyStats,
      favorites: [],
      recent: [],
      topUps: 0,
      hydrated: false,

      placeBet: (amount) => {
        const value = roundBase(amount);
        if (!Number.isFinite(value) || value <= 0) return false;
        if (value > get().balance + 1e-9) return false;
        set((state) => ({ balance: roundBase(state.balance - value) }));
        return true;
      },

      settle: ({ game, gameSlug, bet, payout, multiplier, detail }) => {
        const entry: HistoryEntry = {
          id: uid("round"),
          game,
          gameSlug,
          bet: roundBase(bet),
          payout: roundBase(payout),
          multiplier,
          profit: roundBase(payout - bet),
          timestamp: Date.now(),
          detail,
        };

        set((state) => {
          const perGame = { ...state.stats.perGame };
          const current = perGame[gameSlug] ?? { plays: 0, wagered: 0, won: 0 };
          perGame[gameSlug] = {
            plays: current.plays + 1,
            wagered: roundBase(current.wagered + entry.bet),
            won: roundBase(current.won + entry.payout),
          };

          return {
            balance: roundBase(state.balance + entry.payout),
            history: [entry, ...state.history].slice(0, MAX_HISTORY),
            stats: {
              totalGames: state.stats.totalGames + 1,
              totalWagered: roundBase(state.stats.totalWagered + entry.bet),
              totalWon: roundBase(state.stats.totalWon + entry.payout),
              biggestWin: Math.max(state.stats.biggestWin, entry.profit),
              biggestMultiplier: Math.max(
                state.stats.biggestMultiplier,
                entry.payout > 0 ? multiplier : 0,
              ),
              wins: state.stats.wins + (entry.profit > 0 ? 1 : 0),
              losses: state.stats.losses + (entry.profit > 0 ? 0 : 1),
              perGame,
            },
          };
        });

        return entry;
      },

      commitRound: () => {
        const { seeds } = get();
        set({ seeds: { ...seeds, nonce: seeds.nonce + 1 } });
        return {
          serverSeed: seeds.serverSeed,
          serverSeedHash: seeds.serverSeedHash,
          clientSeed: seeds.clientSeed,
          nonce: seeds.nonce,
        };
      },

      rotateServerSeed: () =>
        set((state) => {
          const serverSeed = randomHex(32);
          return {
            seeds: {
              serverSeed,
              serverSeedHash: hashSeed(serverSeed),
              clientSeed: state.seeds.clientSeed,
              nonce: 0,
            },
          };
        }),

      setClientSeed: (seed) =>
        set((state) => ({
          seeds: {
            ...state.seeds,
            clientSeed: seed.trim().slice(0, 64) || randomHex(8),
            nonce: 0,
          },
        })),

      topUp: () =>
        set((state) => ({
          balance: STARTING_BALANCE,
          topUps: state.topUps + 1,
        })),

      toggleFavorite: (slug) =>
        set((state) => ({
          favorites: state.favorites.includes(slug)
            ? state.favorites.filter((item) => item !== slug)
            : [...state.favorites, slug],
        })),

      markPlayed: (slug) =>
        set((state) => ({
          recent: [slug, ...state.recent.filter((item) => item !== slug)].slice(
            0,
            MAX_RECENT,
          ),
        })),

      clearHistory: () => set({ history: [], stats: emptyStats }),

      resetAll: () =>
        set({
          balance: STARTING_BALANCE,
          history: [],
          stats: emptyStats,
          favorites: [],
          recent: [],
          topUps: 0,
          seeds: createSeedPair(),
        }),
    }),
    {
      name: `${STORAGE_PREFIX}.casino`,
      version: 1,
      storage: casinoStorage<CasinoState>(),
      partialize: ({ hydrated: _hydrated, ...rest }) => rest as CasinoState,
      onRehydrateStorage: () => () => {
        useCasino.setState({ hydrated: true });
      },
    },
  ),
);

/** Selector helpers keep component re-renders tight. */
export const selectBalance = (state: CasinoState) => state.balance;
export const selectStats = (state: CasinoState) => state.stats;
