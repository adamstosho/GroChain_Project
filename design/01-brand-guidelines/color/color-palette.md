# Color Palette

Machine-readable version: [design-tokens.json](design-tokens.json). This file is the
explanation; that file is the source other tools should read.

## Current (2026-08-27): designed identity greens

| Role | Hex |
|---|---|
| Deep (favicon tiles, OG ground) | `#0B3D1E` |
| Forest (UI `--primary` light, charts, emails) | `#166534` |
| Grass (dark-mode primary / accents) | `#22C55E` |
| Lime | `#A3E635` |

The sections below retain the earlier `#398526` leaf-era audit history. Live app code no longer
uses `#398526`.

## Resolved 2026-08-25: one canonical green

**`#398526`** (`oklch(0.55 0.15 140)`) was the leaf-era single brand green — used for `--primary` in
both light and dark mode, the logo mark fill, every favicon/app icon, and
`manifest.json`/`viewport.themeColor`. See
[audit finding #1](../../02-audits/2026-08-25-brand-design-system-audit.md#1-four-different-brand-green-values-are-in-production-at-once)
for the original four-greens evidence and the
[resolution log](../../02-audits/2026-08-25-brand-design-system-audit.md#resolution-log-2026-08-25-round-2--canonical-green-simplified-logo-tagline-photography-direction)
for how this specific value was chosen (it's not arbitrary — see below).

Why this value and not a new invention: it's the exact hex already shipping as the *dark-mode*
`--primary` token before this fix — i.e. it reuses the original design intent (hue 140°, chroma
0.15) rather than replacing it, just at a lightness (`L=0.55`) that doesn't clip in sRGB the way
the old light-mode value (`oklch(0.35 0.15 140)` → `#004b00`, effectively near-black) did.
Verified by computation, not eyeballing:

| Pairing | Contrast ratio | WCAG AA (4.5:1) |
|---|---|---|
| `#398526` vs. white text (light-mode button/link use) | 4.61 | Pass |
| `#398526` vs. near-black text (dark-mode button use — `--primary-foreground` in `.dark` is near-black, not white) | 4.56 | Pass |

Both pass with the same single value, which is why light and dark mode now share it exactly
instead of needing separately-tuned numbers.

| Role | Light | Dark | Notes |
|---|---|---|---|
| `primary` | `#398526` | `#398526` | Design-system token. Drives buttons, links, focus rings. Same value in both themes as of 2026-08-25. |
| `secondary` | `#ad8522` | `#b18827` | Golden yellow. Darkened 2026-08-25, then re-tuned lighter 2026-08-26 after it rendered muddy — see Accessibility below. |
| `accent` | `#914f2f` | `#a15d3e` | Earth brown. Dark value audited and deliberately left unchanged — see Accessibility below. |
| `success` | `#398526` | `#398526` | Dark value lightened 2026-08-25 (was `#176700`) — now equals canonical primary. |
| `success-foreground` | (near-white) | (near-black) | Added 2026-08-26 — was missing, `text-success-foreground` resolved to nothing on solid badges. |
| `warning` | `#9c6a00` | `#a97600` | Amber. Light value darkened 2026-08-25 (was `#c99500`) — see Accessibility below. |
| `warning-foreground` | `#0a0c04` | `#0a0c04` | Added 2026-08-26 — `bg-warning` had no matching foreground token; components were hardcoding `text-white` (invisible). |
| `destructive` | `#df000d` | `#b90000` | |
| `background` | `#fbfcf9` | `#010200` | |
| `foreground` | `#0a0c04` | `#edf0e8` | |

The logo mark's stroke/ink color (`#2d5a3d`, used for the leaf outline and vein, not the fill)
remains a distinct, deliberately-related tone — a slightly deeper shade of the same green used
for linework depth on the mark, not a second competing brand color. The mark's *fill* is the
canonical `#398526`.

## Accessibility — full audit done 2026-08-25 (round 3)

`#398526` (the canonical primary) against white text: **4.61:1**; against near-black text (used
in dark mode): **4.56:1** — both pass WCAG AA's 4.5:1 threshold for normal text.

Every other token actually used as literal text/icon color anywhere in the app (found via
`grep`, not assumed) was checked the same way — computed, not eyeballed. Three real failures
found and fixed, keeping each token's original hue/chroma and only moving lightness:

| Token | Real usage found | Was | Fixed to | New contrast |
|---|---|---|---|---|
| `secondary` (light) | `text-secondary`, 12 files; also `bg-secondary text-white` buttons with literally invisible text | 2.23:1 vs white | `#946d00` (round 3) | 4.72:1 |
| `warning` (light) | `text-warning`, 79 files; same invisible-white-text-on-badge pattern | 2.70:1 vs white | `#9c6a00` | 4.69:1 |
| `success` (dark) | `text-success`, 100 files | 2.73–2.95:1 vs dark bg | `#398526` (= canonical primary) | 4.56:1 |

**`accent` (dark) was checked and deliberately left unchanged.** It's used both as standalone
text (`text-accent`, 44 files — wants a *lighter* value for contrast against the dark page
background) and as the fill half of shadcn's built-in `bg-accent`/`text-accent-foreground`
selection-state pattern in menus, calendar, and the command palette (wants `accent` *darker*
relative to its light foreground). Lightening it to fix the text case measurably worsened the
fill+foreground pairing (3.97:1 → 3.22:1) — fixing the less-common role would have broken the
structurally more important one, so this is a documented trade-off, not an oversight.

## Round 4 (2026-08-26): the math was right, the eyes hadn't checked

Round 3 computed contrast ratios and shipped without ever looking at the rendered result. A
visual QA pass (real screenshots of the running app, light and dark) caught what pure computation
couldn't: `secondary` at `#946d00` technically passed WCAG, but rendered as a **muddy dark-olive
color everywhere it's actually used most** — solid `Badge` fills (`bg-secondary
text-secondary-foreground`), which never needed darkening in the first place (that pairing was
always fine, 8.82:1 even at the original `#d1a84b`).

The real fix: the `bg-secondary text-white` bug (6 component call sites — buttons in
`products/page.tsx`, `verify/[batchId]/page.tsx`, `marketplace-card.tsx`) is now fixed **at the
component level** (`text-white` → `text-secondary-foreground`) instead of by darkening the
shared token. With that fixed separately, `--secondary` only has to satisfy the smaller-stakes
standalone-text case (`text-secondary`/`fill-secondary` — star ratings, small labels), so it was
re-tuned lighter: **`#ad8522`, 3.41:1 vs white** — clears the 3:1 UI-component bar with real
margin, a genuine improvement over the original `#d1a84b` (2.23:1), while reading as gold again
instead of brown.

Two tokens were also missing their `-foreground` pairing entirely: `bg-warning` had no
`--warning-foreground`, so several components were hardcoding `text-white` on it (invisible, same
bug pattern as secondary — 4 more call sites fixed); `bg-success` was being paired with
`text-success-foreground` where no such variable existed at all, so the class silently resolved
to nothing. Both added.

Full method and numbers in [design-tokens.json](design-tokens.json)'s
`contrast_fixes_2026-08-25_round3` and `contrast_fixes_2026-08-26_round4` entries, and the
audit's resolution logs.
