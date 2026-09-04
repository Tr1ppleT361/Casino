"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { create } from "zustand";
import { formatMultiplier } from "@/lib/currency";
import { useCurrency } from "@/hooks/use-currency";
import { celebrate } from "@/lib/confetti";
import { playSound } from "@/lib/sound";
import { useSettings } from "@/store/settings";
import { cn } from "@/lib/utils";

export type WinTier = "win" | "big" | "mega";

interface WinPayload {
  /** Profit in base demo units. */
  profit: number;
  multiplier: number;
  tier: WinTier;
  game: string;
}

interface WinState {
  current: (WinPayload & { key: number }) | null;
  show: (payload: WinPayload) => void;
  hide: () => void;
}

const useWinStore = create<WinState>((set) => ({
  current: null,
  show: (payload) => set({ current: { ...payload, key: Date.now() } }),
  hide: () => set({ current: null }),
}));

/** Decide how loud a win should be celebrated. */
export function winTier(multiplier: number): WinTier | null {
  if (multiplier >= 25) return "mega";
  if (multiplier >= 8) return "big";
  if (multiplier >= 3) return "win";
  return null;
}

/** Trigger the celebration overlay from any game. */
export function showWin(payload: WinPayload) {
  useWinStore.getState().show(payload);
}

const TIER_LABEL: Record<WinTier, string> = {
  win: "NICE WIN",
  big: "BIG WIN",
  mega: "MEGA WIN",
};

const TIER_DURATION: Record<WinTier, number> = {
  win: 1800,
  big: 2600,
  mega: 3600,
};

export function WinOverlay() {
  const current = useWinStore((state) => state.current);
  const hide = useWinStore((state) => state.hide);
  const animations = useSettings((state) => state.animations);
  const { format } = useCurrency();

  useEffect(() => {
    if (!current) return;
    playSound(current.tier === "win" ? "win" : "bigwin");
    if (animations) {
      celebrate(current.tier === "win" ? "small" : current.tier === "big" ? "big" : "huge");
    }
    const timer = setTimeout(hide, TIER_DURATION[current.tier]);
    return () => clearTimeout(timer);
  }, [current, hide, animations]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.key}
          className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.6, y: 30, rotate: -3 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.85, y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-3xl border px-8 py-7 text-center backdrop-blur-xl sm:px-16 sm:py-10",
              current.tier === "mega"
                ? "border-gold/40 bg-gold/[0.08] shadow-glow-gold"
                : current.tier === "big"
                  ? "border-primary/40 bg-primary/[0.08] shadow-glow-lg"
                  : "border-success/40 bg-success/[0.08] shadow-glow-success",
            )}
          >
            <span
              className={cn(
                "text-xs font-black uppercase tracking-[0.4em]",
                current.tier === "mega"
                  ? "text-gold"
                  : current.tier === "big"
                    ? "text-primary"
                    : "text-success",
              )}
            >
              {TIER_LABEL[current.tier]}
            </span>

            <span className="tabular text-3xl font-black tracking-tight text-foreground sm:text-5xl">
              +{format(current.profit, { bare: true })}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              {current.game}
            </span>

            <motion.span
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.14, type: "spring", stiffness: 300, damping: 16 }}
              className={cn(
                "tabular mt-1 rounded-full border px-4 py-1 text-xl font-black sm:text-3xl",
                current.tier === "mega"
                  ? "border-gold/40 bg-gold/15 text-gold"
                  : current.tier === "big"
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-success/40 bg-success/15 text-success",
              )}
            >
              {formatMultiplier(current.multiplier)}
            </motion.span>

            <span className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Virtual demo currency only
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
