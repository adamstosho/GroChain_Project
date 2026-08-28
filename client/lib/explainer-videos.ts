/** Marketing explainer assets — drop files in public/videos/ to enable real video playback. */

/** Set NEXT_PUBLIC_EXPLAINER_VIDEO=true after adding grochain-explainer.mp4 to public/videos/ */
export const EXPLAINER_VIDEO_ENABLED =
  process.env.NEXT_PUBLIC_EXPLAINER_VIDEO === "true"

export const EXPLAINER_VIDEO = {
  poster: "/illustration-hero.png",
  webm: "/videos/grochain-explainer.webm",
  mp4: "/videos/grochain-explainer.mp4",
  vtt: "/videos/grochain-explainer.vtt",
  title: "How GroChain works",
  description:
    "See how farmers, buyers, and agencies use GroChain to trace produce from harvest to sale in under 30 seconds.",
} as const

export type ExplainerSceneId = "intro" | "harvest" | "qr" | "marketplace" | "cta"

export interface ExplainerScene {
  id: ExplainerSceneId
  stepIndex?: number
  title: string
  subtitle: string
  image: string
  imageAlt: string
  durationMs: number
}

/** Animated storyboard scenes (~22s total) — used when video files are absent or fail to load. */
export const EXPLAINER_SCENES: ExplainerScene[] = [
  {
    id: "intro",
    title: "Building trust in Nigeria's food chain",
    subtitle: "GroChain connects farmers, buyers, and agencies on one transparent record.",
    image: "/illustration-hero.png",
    imageAlt: "Farmer with harvested produce and a phone showing traceability",
    durationMs: 4500,
  },
  {
    id: "harvest",
    stepIndex: 0,
    title: "Log your harvest",
    subtitle: "Farmers record crop details, quality grades, and location — each batch gets a unique ID.",
    image: "/illustration-avatar-farmer.png",
    imageAlt: "Farmer avatar representing harvest logging",
    durationMs: 5000,
  },
  {
    id: "qr",
    stepIndex: 1,
    title: "Generate & scan QR codes",
    subtitle: "Every batch receives a scannable code. Buyers verify origin, grade, and farmer details instantly.",
    image: "/illustration-hero.png",
    imageAlt: "Produce with QR traceability",
    durationMs: 5000,
  },
  {
    id: "marketplace",
    stepIndex: 2,
    title: "Sell with confidence",
    subtitle: "List on the marketplace, accept payments, and track shipments — all on one platform.",
    image: "/illustration-avatar-buyer.png",
    imageAlt: "Buyer avatar representing marketplace purchases",
    durationMs: 5000,
  },
  {
    id: "cta",
    title: "Ready to get started?",
    subtitle:
      "Join farmers, buyers, and partner agencies building a transparent food supply chain across Nigeria.",
    image: "/grochain-logo-3d.png",
    imageAlt: "GroChain logo",
    durationMs: 3500,
  },
]

export function getSceneStartIndex(stepIndex?: number): number {
  if (stepIndex === undefined) return 0
  const idx = EXPLAINER_SCENES.findIndex((s) => s.stepIndex === stepIndex)
  return idx >= 0 ? idx : 0
}
