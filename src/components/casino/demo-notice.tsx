import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const DEMO_HEADLINE = "DEMO CASINO – NO REAL MONEY";
export const DEMO_DISCLAIMER =
  "Virtual demo currency only. No deposits, withdrawals or real-money prizes.";

/** Slim always-on strip. Rendered at the very top of every page. */
export function DemoStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 border-b border-gold/20 bg-gold/[0.07] px-3 py-1.5 text-center",
        className,
      )}
    >
      <ShieldCheck className="hidden h-3.5 w-3.5 shrink-0 text-gold sm:block" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold sm:text-[11px]">
        {DEMO_HEADLINE}
      </p>
      <span className="hidden text-[11px] text-gold/70 md:inline">— {DEMO_DISCLAIMER}</span>
    </div>
  );
}

/** Boxed variant used inside pages and game panels. */
export function DemoNotice({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-gold/20 bg-gold/[0.06] p-3",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider text-gold">
          {DEMO_HEADLINE}
        </p>
        {!compact && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {DEMO_DISCLAIMER} Es gibt keine Zahlungsanbieter, keine Wallets und keinen
            Weg, echtes Geld einzusetzen oder auszuzahlen.
          </p>
        )}
      </div>
    </div>
  );
}
