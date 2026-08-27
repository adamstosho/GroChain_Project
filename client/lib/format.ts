/** Compact NGN / count formatting that stays readable at zero. */
export function formatCompactCurrency(value: number): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return "₦0"
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: Math.abs(n) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(n) >= 1000 ? 1 : 0,
  }).format(n)
}

export function formatCompactNumber(value: number): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return "0"
  return new Intl.NumberFormat("en-NG", {
    notation: Math.abs(n) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(n) >= 1000 ? 1 : 0,
  }).format(n)
}
