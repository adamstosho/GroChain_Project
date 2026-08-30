/** Safe error message extraction for unknown catch values. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error.trim()) return error
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === "string" && msg.trim()) return msg
  }
  return fallback
}

/** HTTP status from API/network errors when present. */
export function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined
  const e = error as { status?: unknown; response?: { status?: unknown } }
  if (typeof e.status === "number") return e.status
  if (typeof e.response?.status === "number") return e.response.status
  return undefined
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
