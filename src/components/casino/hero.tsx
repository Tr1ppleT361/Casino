"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopUpButton } from "@/components/wallet/top-up-button";
import { useCurrency } from "@/hooks/use-currency";
import { useHydrated } from "@/hooks/use-hydrated";
import { STARTING_BALANCE, useCasino } from "@/store/casino";
import { GAMES } from "@/lib/games";

export function Hero() {
  const balance = useCasino((state) => state.balance);
  const hydrated = useHydrated();
  const { format, currency } = useCurrency();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-primary/[0.16] via-surface to-accent/[0.1] p-6 sm:p-10">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />

      <div className="relative max-w-2xl">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-gold"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Demo Casino — No Real Money
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-4 text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
        >
          THE ULTIMATE <span className="text-gradient">DEMO CASINO</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-base text-muted-foreground sm:text-lg"
        >
          Play. Win. Repeat. Zero real money.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-6 flex flex-wrap items-center gap-3"
        >
          <Button asChild size="lg" className="gap-2">
            <Link href="/game/crash">
              <Rocket className="h-4 w-4" />
              Crash spielen
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/category/originals">
              <Sparkles className="h-4 w-4" />
              Originals ansehen
            </Link>
          </Button>
          <TopUpButton size="lg" variant="secondary" label="Guthaben auffüllen" />
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.24 }}
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <Stat
            label="Demo-Guthaben"
            value={hydrated ? format(balance) : format(STARTING_BALANCE)}
          />
          <Stat label="Währung" value={currency.name} />
          <Stat label="Spiele" value={`${GAMES.length}`} />
          <Stat label="Echtgeld" value="0,00 €" hint="Immer" />
        </motion.dl>
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-surface-sunken/70 px-3 py-2.5 backdrop-blur">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="tabular mt-0.5 truncate text-sm font-black text-foreground">
        {value}
        {hint && <span className="ml-1 text-[10px] font-medium text-muted-foreground">{hint}</span>}
      </dd>
    </div>
  );
}
