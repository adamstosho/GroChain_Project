/** Shared brand tokens + helpers for printable/export documents. */
import { brandColors } from "@/lib/brand/colors"

export const docBrand = {
  deep: "#0B3D1E",
  forest: brandColors.primary, // #166534
  grass: brandColors.secondary, // #22C55E
  lime: brandColors.accent, // #A3E635
  ink: "#1f2937",
  muted: "#6b7280",
  soft: "#F3F4F6",
  softGreen: "#eef6ea",
  white: "#FFFFFF",
  border: "#e5e7eb",
  tagline: "Building Trust in Nigeria's Food Chain",
  supportEmail: "support@grochain.com",
  logoFullPath: "/logo-full.png",
  logoIconPath: "/logo-icon.png",
} as const

/** Escape text for safe HTML document generation. */
export function escapeHtml(value: unknown): string {
  const s = value == null ? "" : String(value)
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Hex → [r,g,b] for jsPDF. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

let cachedIconDataUrl: string | null = null
let cachedFullDataUrl: string | null = null

async function fetchAsDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** Load transparent logo icon as data URL (cached). */
export async function getLogoIconDataUrl(): Promise<string | null> {
  if (cachedIconDataUrl) return cachedIconDataUrl
  cachedIconDataUrl = await fetchAsDataUrl(docBrand.logoIconPath)
  return cachedIconDataUrl
}

/** Load full lockup as data URL (cached). */
export async function getLogoFullDataUrl(): Promise<string | null> {
  if (cachedFullDataUrl) return cachedFullDataUrl
  cachedFullDataUrl = await fetchAsDataUrl(docBrand.logoFullPath)
  return cachedFullDataUrl
}
