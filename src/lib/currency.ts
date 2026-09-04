import type { CurrencyDefinition, CurrencyId, NumberFormat } from "@/types";

/**
 * The wallet stores a single virtual balance in "base demo units"
 * (conceptually demo euros). A currency definition only changes how that
 * number is *presented* - it has no real-world value whatsoever.
 */
export const BASE_CURRENCY_LABEL = "Demo-EUR";

export const CURRENCIES: Record<Exclude<CurrencyId, "CUSTOM">, CurrencyDefinition> = {
  EUR: {
    id: "EUR",
    name: "Euro",
    symbol: "€",
    position: "after",
    multiplier: 1,
    decimals: 2,
    blurb: "Basiseinheit des Demo-Guthabens",
    accent: "265 90% 65%",
  },
  USD: {
    id: "USD",
    name: "Dollar",
    symbol: "$",
    position: "before",
    multiplier: 1,
    decimals: 2,
    blurb: "Gleiche Demo-Menge, anderes Symbol",
    accent: "152 72% 45%",
  },
  CREDITS: {
    id: "CREDITS",
    name: "Credits",
    symbol: "CR",
    position: "after",
    multiplier: 100,
    decimals: 0,
    blurb: "1 Demo-EUR = 100 Credits",
    accent: "190 95% 55%",
  },
  COINS: {
    id: "COINS",
    name: "Coins",
    symbol: "COINS",
    position: "after",
    multiplier: 100_000,
    decimals: 0,
    blurb: "1 Demo-EUR = 100.000 Coins",
    accent: "44 96% 58%",
  },
  CHIPS: {
    id: "CHIPS",
    name: "Chips",
    symbol: "CHIPS",
    position: "after",
    multiplier: 10,
    decimals: 0,
    blurb: "1 Demo-EUR = 10 Chips",
    accent: "356 82% 58%",
  },
  DIAMONDS: {
    id: "DIAMONDS",
    name: "Diamonds",
    symbol: "◆",
    position: "after",
    multiplier: 0.5,
    decimals: 2,
    blurb: "1 Diamond = 2 Demo-EUR",
    accent: "205 95% 62%",
  },
  MILLIONAIRE: {
    id: "MILLIONAIRE",
    name: "Millionaire Coins",
    symbol: "MC",
    position: "after",
    multiplier: 1_000_000,
    decimals: 0,
    blurb: "1 Demo-EUR = 1.000.000 MC",
    accent: "280 90% 68%",
  },
};

export const DEFAULT_CUSTOM_CURRENCY: CurrencyDefinition = {
  id: "CUSTOM",
  name: "Mega Coins",
  symbol: "MC",
  position: "after",
  multiplier: 100_000,
  decimals: 0,
  blurb: "Selbst konfiguriert",
  accent: "320 90% 65%",
};

export const CURRENCY_LIST: CurrencyDefinition[] = Object.values(CURRENCIES);

export function resolveCurrency(
  id: CurrencyId,
  custom: CurrencyDefinition,
): CurrencyDefinition {
  if (id === "CUSTOM") return custom;
  return CURRENCIES[id];
}

/** base demo units -> display units */
export function toDisplay(base: number, currency: CurrencyDefinition): number {
  return base * currency.multiplier;
}

/** display units -> base demo units */
export function toBase(display: number, currency: CurrencyDefinition): number {
  if (!currency.multiplier) return display;
  return display / currency.multiplier;
}

const COMPACT_STEPS = [
  { value: 1e12, suffix: "T" },
  { value: 1e9, suffix: "B" },
  { value: 1e6, suffix: "M" },
  { value: 1e3, suffix: "K" },
];

const LOCALE = "de-DE";

export function formatNumber(
  value: number,
  decimals: number,
  format: NumberFormat = "full",
): string {
  if (!Number.isFinite(value)) return "0";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (format === "compact" && abs >= 1000) {
    for (const step of COMPACT_STEPS) {
      if (abs >= step.value) {
        const scaled = abs / step.value;
        const digits = scaled >= 100 ? 1 : 2;
        return (
          sign +
          scaled.toLocaleString(LOCALE, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
          }) +
          step.suffix
        );
      }
    }
  }

  return (
    sign +
    abs.toLocaleString(LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export interface FormatOptions {
  /** Omit the currency symbol. */
  bare?: boolean;
  format?: NumberFormat;
  /** Force a sign, e.g. for profit figures. */
  signed?: boolean;
}

/** Format a *base* amount in the given display currency. */
export function formatAmount(
  base: number,
  currency: CurrencyDefinition,
  options: FormatOptions = {},
): string {
  const { bare = false, format = "full", signed = false } = options;
  const display = toDisplay(base, currency);
  const body = formatNumber(Math.abs(display), currency.decimals, format);
  const sign = signed ? (display >= 0 ? "+" : "-") : display < 0 ? "-" : "";

  if (bare) return `${sign}${body}`;
  return currency.position === "before"
    ? `${sign}${currency.symbol}${body}`
    : `${sign}${body} ${currency.symbol}`;
}

/** Format an already-converted display amount (no base conversion). */
export function formatDisplayUnits(
  display: number,
  currency: CurrencyDefinition,
  options: FormatOptions = {},
): string {
  return formatAmount(display / (currency.multiplier || 1), currency, options);
}

export function formatMultiplier(multiplier: number, decimals = 2): string {
  return `${multiplier.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}x`;
}

/** Parse user input that may contain locale separators. */
export function parseAmountInput(raw: string): number {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

/** A sensible bet step in display units, so buttons feel right at any scale. */
export function displayStep(currency: CurrencyDefinition): number {
  const raw = currency.multiplier;
  if (raw >= 1_000_000) return 100_000;
  if (raw >= 100_000) return 10_000;
  if (raw >= 100) return 10;
  if (raw >= 10) return 1;
  return currency.decimals > 0 ? 0.1 : 1;
}
