export function getCurrencySymbol(currency?: string | null): string {
  return currency === "INR" ? "₹" : "$";
}

export function formatPrizeAmount(amount: number, currency?: string | null): string {
  return `${getCurrencySymbol(currency)}${(amount ?? 0).toLocaleString()}`;
}
