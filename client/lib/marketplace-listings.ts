/**
 * Normalize marketplace listing API responses — prevents empty flashes from shape mismatches.
 */
export function extractListingsFromResponse(response: unknown): Record<string, unknown>[] {
  if (!response) return []

  if (Array.isArray(response)) {
    return response as Record<string, unknown>[]
  }

  const root = response as Record<string, unknown>

  if (Array.isArray(root.listings)) {
    return root.listings as Record<string, unknown>[]
  }

  const data = root.data
  if (Array.isArray(data)) {
    return data as Record<string, unknown>[]
  }

  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>
    if (Array.isArray(nested.listings)) {
      return nested.listings as Record<string, unknown>[]
    }
  }

  return []
}
