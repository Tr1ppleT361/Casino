"use client";

import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FREE_SPINS_AWARDED,
  FREE_SPIN_MULTIPLIER,
  LINE_COUNT,
  PAYTABLE,
  SCATTER_PAYS,
  type SlotTheme,
} from "@/lib/slots";

const TIER_LABEL = {
  low: "Niedrig",
  mid: "Mittel",
  high: "Hoch",
  wild: "Wild",
  scatter: "Scatter",
} as const;

export function PaytableDialog({ theme }: { theme: SlotTheme }) {
  const grouped = {
    low: theme.symbols.filter((symbol) => symbol.tier === "low"),
    mid: theme.symbols.filter((symbol) => symbol.tier === "mid"),
    high: theme.symbols.filter((symbol) => symbol.tier === "high"),
    wild: theme.symbols.filter((symbol) => symbol.tier === "wild"),
  };

  const scatter = theme.symbols.find((symbol) => symbol.tier === "scatter");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Info className="h-4 w-4" />
          Gewinntabelle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{theme.name} — Gewinntabelle</DialogTitle>
          <DialogDescription>
            Auszahlungen als Vielfaches des Einsatzes pro Linie ({LINE_COUNT} Linien,
            Einsatz pro Linie = Gesamteinsatz ÷ {LINE_COUNT}). Nur Demo-Guthaben.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {(["high", "mid", "low", "wild"] as const).map((tier) => (
            <div key={tier} className="rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {TIER_LABEL[tier]}
                </span>
                <span className="flex gap-1.5 text-xl">
                  {grouped[tier].map((symbol) => (
                    <span key={symbol.id}>{symbol.glyph}</span>
                  ))}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                {([3, 4, 5] as const).map((count) => (
                  <div key={count} className="rounded-lg bg-white/[0.04] py-1.5">
                    <p className="text-[10px] text-muted-foreground">{count}x</p>
                    <p className="tabular font-black">{PAYTABLE[tier][count]}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-accent/25 bg-accent/[0.07] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-accent">
                Scatter {scatter?.glyph}
              </span>
              <span className="text-[11px] text-muted-foreground">
                zahlt auf dem gesamten Feld
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              {([3, 4, 5] as const).map((count) => (
                <div key={count} className="rounded-lg bg-white/[0.05] py-1.5">
                  <p className="text-[10px] text-muted-foreground">{count}x</p>
                  <p className="tabular font-black">{SCATTER_PAYS[count]}× Gesamteinsatz</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Ab 3 Scattern gibt es {FREE_SPINS_AWARDED} Freispiele. Während der
              Freispiele zählen alle Gewinne {FREE_SPIN_MULTIPLIER}-fach, und weitere
              Scatter verlängern die Runde.
            </p>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Wild ersetzt jedes Symbol außer Scatter. Gewinnlinien zahlen von links
            nach rechts ab dem ersten Feld. Der gemessene RTP dieser Mathematik liegt
            bei 95,3 % (per Simulation über 2,4 Mio. Runden ermittelt).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
