const CURRENCY_MAP: Record<string, { symbol: string; locale: string }> = {
  USD: { symbol: "$", locale: "en-US" },
  BDT: { symbol: "৳", locale: "en-BD" },
  EUR: { symbol: "€", locale: "de-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
  INR: { symbol: "₹", locale: "en-IN" },
  AED: { symbol: "د.إ", locale: "ar-AE" },
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_MAP) as CurrencyCode[];

export type CurrencyCode = keyof typeof CURRENCY_MAP;

export function getCurrencySymbol(code: string): string {
  return CURRENCY_MAP[code]?.symbol ?? "$";
}

export function formatCurrency(amount: number, code: string): string {
  const entry = CURRENCY_MAP[code];
  if (!entry) {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  return `${entry.symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCurrencyPrecise(amount: number, code: string): string {
  const entry = CURRENCY_MAP[code];
  if (!entry) {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${entry.symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
