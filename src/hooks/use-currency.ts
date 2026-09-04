"use client";

import { useMemo } from "react";
import { useSettings } from "@/store/settings";
import {
  displayStep,
  formatAmount,
  formatNumber,
  resolveCurrency,
  toBase,
  toDisplay,
  type FormatOptions,
} from "@/lib/currency";

/**
 * One place that turns internal demo-base amounts into the player's chosen
 * display currency. Conversion is presentational only.
 */
export function useCurrency() {
  const currencyId = useSettings((state) => state.currency);
  const customCurrency = useSettings((state) => state.customCurrency);
  const numberFormat = useSettings((state) => state.numberFormat);

  return useMemo(() => {
    const currency = resolveCurrency(currencyId, customCurrency);

    const format = (base: number, options: FormatOptions = {}) =>
      formatAmount(base, currency, { format: numberFormat, ...options });

    /**
     * Big multipliers produce very long strings (a 10.000 demo-EUR balance is
     * 1.000.000.000 Coins). Where space is tight we fall back to the compact
     * notation so nothing gets clipped.
     */
    const formatSmart = (base: number, maxChars = 15, options: FormatOptions = {}) => {
      const full = format(base, { ...options, format: "full" });
      if (full.length <= maxChars) return full;
      return format(base, { ...options, format: "compact" });
    };

    return {
      currency,
      numberFormat,
      /** Format a base amount with the currency symbol. */
      format,
      /** Like `format`, but shortens to compact notation when it gets long. */
      formatSmart,
      /** Format a base amount without the symbol. */
      formatBare: (base: number, options: FormatOptions = {}) =>
        format(base, { ...options, bare: true }),
      /** Format a raw display-unit number (already converted). */
      formatUnits: (units: number, options: FormatOptions = {}) =>
        formatNumber(units, currency.decimals, options.format ?? numberFormat),
      toDisplay: (base: number) => toDisplay(base, currency),
      toBase: (display: number) => toBase(display, currency),
      /** Natural increment for stake buttons in the current currency. */
      step: displayStep(currency),
      symbol: currency.symbol,
      decimals: currency.decimals,
    };
  }, [currencyId, customCurrency, numberFormat]);
}
