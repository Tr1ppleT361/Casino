import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { DEMO_DISCLAIMER, DEMO_HEADLINE } from "@/components/casino/demo-notice";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-white/[0.06] bg-surface-sunken/60">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-2">
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gold">
              <ShieldCheck className="h-4 w-4" />
              {DEMO_HEADLINE}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {DEMO_DISCLAIMER} LumenPlay ist ein reines Social-/Demo-Casino zu
              Demonstrationszwecken. Es existieren keine Zahlungsanbieter, keine
              Krypto-Wallets und keine Möglichkeit, echtes Geld einzuzahlen,
              auszuzahlen oder zu gewinnen. Alle Guthaben, Einsätze und Gewinne sind
              virtuelle Werte ohne realen Gegenwert.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-xs sm:text-right">
            <Link href="/fairness" className="text-muted-foreground transition-colors hover:text-foreground">
              Fairness
            </Link>
            <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
              Statistiken
            </Link>
            <Link href="/history" className="text-muted-foreground transition-colors hover:text-foreground">
              Historie
            </Link>
            <Link href="/profile" className="text-muted-foreground transition-colors hover:text-foreground">
              Einstellungen
            </Link>
          </nav>
        </div>

        <p className="mt-6 border-t border-white/[0.05] pt-4 text-[11px] text-muted-foreground/70">
          Alle Grafiken, Namen und Spielthemen sind eigene Demo-Inhalte. Keine echten
          Marken oder Lizenzprodukte.
        </p>
      </div>
    </footer>
  );
}
