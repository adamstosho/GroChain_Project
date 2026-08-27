/** Canonical brand hex for surfaces that cannot use CSS tokens (Recharts, canvas, inline styles). */
export const brandColors = {
  primary: "#166534",
  primaryInk: "#0B3D1E",
  secondary: "#22C55E",
  accent: "#A3E635",
  warning: "#9c6a00",
  destructive: "#df000d",
  /** Secondary chart series (soil / earth tone) */
  chartEarth: "#914f2f",
  /** Tertiary chart series (harvest gold) */
  chartGold: "#ad8522",
} as const

export const chartSeries = [
  brandColors.primary,
  brandColors.secondary,
  brandColors.accent,
  brandColors.warning,
  brandColors.destructive,
  brandColors.primaryInk,
  brandColors.chartEarth,
  brandColors.chartGold,
] as const
