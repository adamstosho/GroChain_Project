# Logo — designed GroChain identity (adopted 2026-08-27)

The official mark is the **designed** identity (globe + network + leaf + chain link), not the
earlier geometric leaf SVG. Source masters and the brand sheet live in
[`source/`](./source/).

## Masters

| File | Role |
|---|---|
| [`source/logo-icon-master.png`](./source/logo-icon-master.png) | Circular mark (on black) |
| [`source/logo-full-lockup.png`](./source/logo-full-lockup.png) | Primary horizontal lockup + tagline |
| [`source/brand-identity-guidelines.png`](./source/brand-identity-guidelines.png) | Full brand sheet |

## In-app assets (generated)

From `client/`: `npm run generate:icons` then optionally `npm run generate:og-image` and
`npm run generate:logo-exports`.

| Public file | Use |
|---|---|
| `/logo-icon.png` | Mark only (transparent) |
| `/logo-full.png` | Full lockup (transparent) |
| `/favicon-*.png`, `/icon-*.png`, `/apple-touch-icon.png` | App / tab icons on deep green `#0B3D1E` tile |
| `/og-image.png` | Social share card |

Component: `client/components/ui/grochain-logo.tsx`  
(`variant="full" | "icon" | "text"`)

## Brand colors (from guidelines)

| Token | Hex |
|---|---|
| Deep | `#0B3D1E` |
| Forest (UI primary) | `#166534` |
| Grass | `#22C55E` |
| Lime | `#A3E635` |
| White | `#FFFFFF` |
| Off-white | `#F3F4F6` |

Tagline: **Building Trust in Nigeria's Food Chain**  
Type (brand sheet): Poppins — product UI currently uses DM Sans / Fraunces; align later if needed.
