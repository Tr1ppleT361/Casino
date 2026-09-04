"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMultiplier } from "@/lib/currency";
import { crashPointFrom, floatsFrom, randomHex } from "@/lib/rng";
import { useEffect, useMemo, useState } from "react";

/**
 * Marketing panel on the lobby. The ticker shows freshly derived demo crash
 * points so the section feels alive without pretending to be a live server.
 */
export function CrashSpotlight() {
  const [seed, setSeed] = useState<string | null>(null);

  useEffect(() => {
    setSeed(randomHex(8));
    const timer = setInterval(() => setSeed(randomHex(8)), 4200);
    return () => clearInterval(timer);
  }, []);

  const points = useMemo(() => {
    if (!seed) return [];
    return floatsFrom(seed, "lobby", 0, 14).map((float) => crashPointFrom(float));
  }, [seed]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.18] via-surface to-surface p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/25 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-destructive">
            <TrendingUp className="h-3 w-3" /> Meistgespielt
          </span>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
            CRASH
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Der Multiplikator startet bei 1.00x und steigt. Cash out, bevor die Runde
            crasht. Das Ergebnis jeder Runde steht vor dem Start fest und hängt weder
            von deinem Einsatz noch von deinem Guthaben ab.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/game/crash">
                <Rocket className="h-4 w-4" />
                Jetzt Demo spielen
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/fairness">Wie der Zufall entsteht</Link>
            </Button>
          </div>
        </div>

        <div className="w-full max-w-sm shrink-0 rounded-2xl border border-white/[0.07] bg-surface-sunken/80 p-4 backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Letzte Demo-Multiplikatoren
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {points.map((point, index) => (
              <motion.span
                key={`${seed}-${index}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`tabular rounded-lg px-2 py-1 text-xs font-black ${
                  point >= 10
                    ? "bg-gold/20 text-gold"
                    : point >= 2
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                }`}
              >
                {formatMultiplier(point)}
              </motion.span>
            ))}
            {points.length === 0 && (
              <span className="text-xs text-muted-foreground">Lade Demo-Runden…</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
