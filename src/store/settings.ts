"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { casinoStorage, STORAGE_PREFIX } from "@/lib/persistence";
import { DEFAULT_CUSTOM_CURRENCY } from "@/lib/currency";
import type { CurrencyDefinition, CurrencyId, NumberFormat } from "@/types";

export const AVATARS = [
  "royal-flush",
  "neon-dice",
  "gold-chip",
  "lucky-seven",
  "diamond-hand",
  "rocket",
  "crown",
  "joker",
] as const;

export type AvatarId = (typeof AVATARS)[number];

interface SettingsState {
  username: string;
  avatar: AvatarId;
  currency: CurrencyId;
  customCurrency: CurrencyDefinition;
  numberFormat: NumberFormat;
  sound: boolean;
  music: boolean;
  animations: boolean;
  darkMode: boolean;
  hydrated: boolean;

  setUsername: (name: string) => void;
  setAvatar: (avatar: AvatarId) => void;
  setCurrency: (id: CurrencyId) => void;
  updateCustomCurrency: (patch: Partial<CurrencyDefinition>) => void;
  setNumberFormat: (format: NumberFormat) => void;
  toggle: (key: "sound" | "music" | "animations" | "darkMode") => void;
  reset: () => void;
}

const initial = {
  username: "DemoPlayer",
  avatar: "neon-dice" as AvatarId,
  currency: "COINS" as CurrencyId,
  customCurrency: DEFAULT_CUSTOM_CURRENCY,
  numberFormat: "full" as NumberFormat,
  sound: true,
  music: false,
  animations: true,
  darkMode: true,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...initial,
      hydrated: false,

      setUsername: (username) =>
        set({ username: username.slice(0, 24) || "DemoPlayer" }),
      setAvatar: (avatar) => set({ avatar }),
      setCurrency: (currency) => set({ currency }),
      updateCustomCurrency: (patch) =>
        set((state) => ({
          customCurrency: {
            ...state.customCurrency,
            ...patch,
            id: "CUSTOM",
            multiplier:
              patch.multiplier !== undefined
                ? Math.max(0.000001, patch.multiplier)
                : state.customCurrency.multiplier,
            decimals:
              patch.decimals !== undefined
                ? Math.min(Math.max(Math.round(patch.decimals), 0), 8)
                : state.customCurrency.decimals,
          },
        })),
      setNumberFormat: (numberFormat) => set({ numberFormat }),
      toggle: (key) => set((state) => ({ [key]: !state[key] }) as Partial<SettingsState>),
      reset: () => set({ ...initial }),
    }),
    {
      name: `${STORAGE_PREFIX}.settings`,
      version: 1,
      storage: casinoStorage<SettingsState>(),
      partialize: ({ hydrated: _hydrated, ...rest }) => rest as SettingsState,
      onRehydrateStorage: () => () => {
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);
