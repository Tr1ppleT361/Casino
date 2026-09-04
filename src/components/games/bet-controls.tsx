"use client";

import { useEffect, useRef, useState } from "react";
import { Coins, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatMultiplier, formatNumber, parseAmountInput } from "@/lib/currency";
import { useCurrency } from "@/hooks/use-currency";
import { useHydrated } from "@/hooks/use-hydrated";
import { MIN_BET } from "@/hooks/use-game";
import { useCasino } from "@/store/casino";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

interface BetControlsProps {
  /** Stake in base demo units. */
  bet: number;
  onBetChange: (value: number) => void;
  onHalve: () => void;
  onDouble: () => void;
  onMax: () => void;
  disabled?: boolean;
  /** Multiplier used for the "potential win" readout. */
  multiplier?: number;
  /** Explicit potential payout in base units (wins over `multiplier`). */
  potentialWin?: number;
  children?: React.ReactNode;
  /** Extra controls rendered between the stake row and the action button. */
  extra?: React.ReactNode;
  className?: string;
}

/**
 * The single stake widget used by every game: manual input, 1/2, 2x and MAX,
 * plus the always-visible bet / potential win / multiplier / balance readout.
 */
export function BetControls({
  bet,
  onBetChange,
  onHalve,
  onDouble,
  onMax,
  disabled,
  multiplier,
  potentialWin,
  children,
  extra,
  className,
}: BetControlsProps) {
  const { currency, format, formatSmart, toDisplay, toBase, decimals, numberFormat } =
    useCurrency();
  const balance = useCasino((state) => state.balance);
  const hydrated = useHydrated();
  const [text, setText] = useState(() => formatNumber(toDisplay(bet), decimals, "full"));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) {
      setText(formatNumber(toDisplay(bet), decimals, "full"));
    }
  }, [bet, decimals, toDisplay]);

  const commit = (raw: string) => {
    const display = parseAmountInput(raw);
    const base = Math.max(MIN_BET, toBase(display));
    onBetChange(base);
    setText(formatNumber(toDisplay(base), decimals, "full"));
  };

  const win = potentialWin ?? (multiplier !== undefined ? bet * multiplier : undefined);

  return (
    <div className={cn("space-y-3.5", className)}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="bet-amount">Bet Amount</Label>
          <span className="tabular text-[11px] text-muted-foreground">
            {currency.name}
          </span>
        </div>

        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
            <input
              id="bet-amount"
              inputMode="decimal"
              value={text}
              disabled={disabled}
              onFocus={() => {
                focused.current = true;
              }}
              onBlur={(event) => {
                focused.current = false;
                commit(event.target.value);
              }}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commit((event.target as HTMLInputElement).value);
                  (event.target as HTMLInputElement).blur();
                }
              }}
              className="tabular h-11 w-full rounded-xl border border-white/10 bg-surface-sunken pl-9 pr-14 text-sm font-bold transition-colors focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-50"
              aria-label="Einsatz in Demo-Währung"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-muted-foreground">
              {currency.symbol}
            </span>
          </div>

          {(
            [
              { label: "½", action: onHalve, title: "Einsatz halbieren" },
              { label: "2×", action: onDouble, title: "Einsatz verdoppeln" },
              { label: "MAX", action: onMax, title: "Ganzes Demo-Guthaben" },
            ] as const
          ).map((item) => (
            <Button
              key={item.label}
              type="button"
              variant="secondary"
              disabled={disabled}
              title={item.title}
              onClick={() => {
                item.action();
                playSound("click");
              }}
              className="h-11 min-w-[3rem] px-2 text-xs font-black"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {extra}

      <dl className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-surface-sunken/70 p-3 text-xs">
        <Readout label="Bet Amount" value={formatSmart(bet)} />
        <Readout
          label="Potential Win"
          value={win !== undefined ? formatSmart(win) : "—"}
          tone="success"
        />
        <Readout
          label="Current Multiplier"
          value={multiplier !== undefined ? formatMultiplier(multiplier) : "—"}
          tone="accent"
        />
        <Readout
          label="Balance"
          value={hydrated ? formatSmart(balance) : formatSmart(0)}
          icon={<Wallet className="h-3 w-3" />}
        />
      </dl>

      {children}

      <p className="text-center text-[10px] leading-relaxed text-muted-foreground/70">
        Virtual demo currency only. No deposits, withdrawals or real-money prizes.
        {numberFormat === "compact" && " Anzeige gekürzt (z. B. 125,43M)."}
      </p>
    </div>
  );
}

function Readout({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "success" | "accent";
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd
        title={value}
        className={cn(
          "tabular mt-0.5 truncate text-sm font-black",
          tone === "success" && "text-success",
          tone === "accent" && "text-accent",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
