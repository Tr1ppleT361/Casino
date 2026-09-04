"use client";

import { motion } from "framer-motion";
import { formatMultiplier } from "@/lib/currency";
import { useCasino } from "@/store/casino";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

/** Compact "last results" rail shown under a game board. */
export function HistoryStrip({ slug, limit = 16 }: { slug: string; limit?: number }) {
  const history = useCasino((state) => state.history);
  const hydrated = useHydrated();

  const rounds = hydrated
    ? history.filter((entry) => entry.gameSlug === slug).slice(0, limit)
    : [];

  if (rounds.length === 0) return null;

  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.06] bg-card p-2.5">
      {rounds.map((entry) => (
        <motion.span
          key={entry.id}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "tabular shrink-0 rounded-lg px-2.5 py-1 text-xs font-black",
            entry.profit > 0
              ? entry.multiplier >= 10
                ? "bg-gold/20 text-gold"
                : "bg-success/15 text-success"
              : "bg-destructive/12 text-destructive",
          )}
          title={`${entry.game} · ${new Date(entry.timestamp).toLocaleTimeString("de-DE")}`}
        >
          {formatMultiplier(entry.payout > 0 ? entry.multiplier : 0)}
        </motion.span>
      ))}
    </div>
  );
}
