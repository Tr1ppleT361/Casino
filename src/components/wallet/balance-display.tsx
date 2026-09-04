"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { CountUp } from "@/components/fx/count-up";
import { useCurrency } from "@/hooks/use-currency";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCasino } from "@/store/casino";
import { cn } from "@/lib/utils";

export function BalanceDisplay({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "lg";
}) {
  const balance = useCasino((state) => state.balance);
  const hydrated = useHydrated();
  const { format, currency } = useCurrency();

  return (
    <Link
      href="/wallet"
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-surface-sunken px-3 py-1.5 transition-all hover:border-primary/40 hover:bg-primary/[0.07]",
        className,
      )}
      title="Demo-Wallet öffnen"
    >
      <Wallet className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:scale-110" />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Demo-Guthaben
        </span>
        <span
          className={cn(
            "tabular truncate font-black text-foreground",
            size === "lg" ? "text-xl" : "text-sm",
          )}
        >
          {hydrated ? (
            <CountUp value={balance} format={(value) => format(value)} duration={600} />
          ) : (
            format(0)
          )}
        </span>
      </span>
      <span className="sr-only">Aktuelle Währung: {currency.name}</span>
    </Link>
  );
}
