# Photography & imagery

## Current inventory (in `client/public/`, not yet copied here)

| File | Size | Note |
|---|---|---|
| `nigerian-farmer-woman.png` | 1.9 MB | Reads as AI-generated |
| `nigerian-businessman.png` | 1.3 MB | Reads as AI-generated |
| `nigerian-agricultural-agent.png` | 1.5 MB | Reads as AI-generated |
| `nigerian-agricultural-landscape-with-modern-farmin.png` | 1.4 MB | Filename is truncated at a fixed character count — a signature of an AI image-gen tool auto-naming from its prompt |
| `herosection-image.png` | 1.4 MB | |

None of these are duplicated into this directory yet — they're large, likely to be replaced, and
copying them here would just create a fifth stale copy of something already drifting (see the
pattern in [the audit](../../02-audits/2026-08-25-brand-design-system-audit.md)).

## Decision — 2026-08-25: illustration, not continued photorealism

See [audit finding #7](../../02-audits/2026-08-25-brand-design-system-audit.md#7-heromarketing-photography-reads-as-ai-generated-stock-not-real-documentation)
for the original three options weighed. Decided direction: **move off photorealistic imagery
(AI-generated or otherwise) toward a deliberate illustration style**, in favor of real
photography. Reasoning:

- **Real photography** is the strongest option in principle for a trust-first brand, but it
  requires sourcing actual farmers/partners/produce in the field — outside what a design pass on
  the codebase can execute. It stays the long-term aspiration, not the near-term direction: if
  GroChain can commission real photography later, that should *replace* the illustration system
  described below, not sit alongside it.
- **Continuing with AI-generated photorealism** doesn't actually resolve the concern — a newer
  batch of synthetic "farmer" portraits has the same authenticity risk as the current one, just
  regenerated. Ruled out for that reason, not because AI tooling itself is off-limits.
- **Illustration** sidesteps the "is this real" question entirely (nobody mistakes an
  illustration for a claim of documentary authenticity), is achievable at consistent quality
  without a physical shoot, and is a well-precedented choice for trust-driven fintech/agtech
  products.

### Executed 2026-08-25: first illustration set live

The AI-generated photography (`nigerian-farmer-woman.png`, `nigerian-businessman.png`,
`nigerian-agricultural-agent.png`, `nigerian-agricultural-landscape-with-modern-farmin.png`,
`herosection-image.png`) has been removed from `client/public/` and replaced everywhere it was
used:

| Old file | Used in | Replacement |
|---|---|---|
| `herosection-image.png` | `components/sections/hero.tsx` (hero image) | `illustration-hero.png` |
| `nigerian-agricultural-landscape-...png` | `components/sections/about.tsx` | `illustration-about.png` |
| `nigerian-farmer-woman.png` | `components/sections/testimonials.tsx` (Adunni Adebayo avatar) | `illustration-avatar-farmer.png` |
| `nigerian-businessman.png` | `components/sections/testimonials.tsx` (Chidi Okafor avatar) | `illustration-avatar-buyer.png` |
| `nigerian-agricultural-agent.png` | `components/sections/testimonials.tsx` (Ibrahim Garba avatar) | `illustration-avatar-agent.png` |

**Style:** layered flat illustration — still geometric and on-palette (no photorealism, no AI
faces), but scenes now include a farmer figure, identifiable crops (maize, tomatoes, peppers,
yam), a crate with a QR tag, a phone/tablet, and a storehouse so the pictures actually say
"traceable Nigerian produce" instead of a generic landscape. Built from the brand greens plus a
small derived palette (gold, brown, terracotta) in `client/scripts/generate-illustrations.js`.
Avatars keep abstract faces (dot eyes, a smile) on purpose, with clothing/headwear that
distinguishes farmer, buyer, and partner.

**Source of truth:** [`client/scripts/generate-illustrations.js`](../../../client/scripts/generate-illustrations.js) —
builds each image as SVG, then rasterizes with `sharp` (`npm run generate:illustrations`). Edit
the script and regenerate rather than hand-editing the PNGs in `public/`. PNGs are also copied
into this folder.

**Ceiling of this approach:** this is as far as a coded SVG set can reasonably go. It is
appropriate for a product landing page and better than stock/AI portraits. It is not a
commissioned illustration system. If GroChain later wants "agency-standard" art, commission a
human illustrator in this same palette, or replace scenes with real farm photography — do not
mix those with this set on the same page.
