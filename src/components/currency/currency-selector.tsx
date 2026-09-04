"use client";

import Link from "next/link";
import { ChevronDown, Coins, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CURRENCY_LIST, formatNumber, resolveCurrency } from "@/lib/currency";
import { useSettings } from "@/store/settings";
import { useCasino } from "@/store/casino";
import { useHydrated } from "@/hooks/use-hydrated";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type { CurrencyId } from "@/types";

export function CurrencySelector({ className }: { className?: string }) {
  const currencyId = useSettings((state) => state.currency);
  const customCurrency = useSettings((state) => state.customCurrency);
  const setCurrency = useSettings((state) => state.setCurrency);
  const numberFormat = useSettings((state) => state.numberFormat);
  const balance = useCasino((state) => state.balance);
  const hydrated = useHydrated();

  const active = resolveCurrency(currencyId, customCurrency);
  const options = [...CURRENCY_LIST, customCurrency];

  const preview = (id: CurrencyId) => {
    const currency = resolveCurrency(id, customCurrency);
    return formatNumber(
      (hydrated ? balance : 10_000) * currency.multiplier,
      currency.decimals,
      numberFormat,
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-xl border border-white/[0.07] bg-surface-sunken px-3 py-2 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-primary/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className,
        )}
        aria-label="Anzeige-Währung wählen"
      >
        <Coins className="h-4 w-4 text-gold" />
        <span className="hidden sm:inline">{active.name}</span>
        <span className="sm:hidden">{active.symbol}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Anzeige-Währung</DropdownMenuLabel>
        <p className="px-2.5 pb-2 text-[11px] leading-relaxed text-muted-foreground">
          Ändert nur die Darstellung des virtuellen Demo-Guthabens. Kein realer
          Geldwert.
        </p>
        <DropdownMenuSeparator />

        {options.map((currency) => (
          <DropdownMenuItem
            key={currency.id}
            onSelect={() => {
              setCurrency(currency.id);
              playSound("click");
            }}
            className={cn(
              "flex-col items-start gap-0.5",
              currency.id === currencyId && "bg-primary/12",
            )}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-semibold">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: `hsl(${currency.accent})` }}
                />
                {currency.name}
              </span>
              <span className="tabular text-xs text-muted-foreground">
                {currency.symbol}
              </span>
            </span>
            <span className="tabular text-[11px] text-muted-foreground">
              {preview(currency.id)} · {currency.blurb}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile#currency" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Eigene Währung konfigurieren
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
