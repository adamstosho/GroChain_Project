---
title: GroChain Brand & Design System Audit
date: 2026-08-25
author: Claude (acting as brand designer, at request of Adam Tosho)
status: findings delivered — fixes pending owner decision
---

# GroChain Brand & Design System Audit

Scope: the logo (all files/variants), the color system, typography, iconography/favicons, and
imagery, as they exist in `client/` today. This is a diagnostic pass — what's inconsistent,
what's broken, and what's structurally missing — not a redesign. Findings are ordered by
severity: **Critical** (users/crawlers see something broken or wrong), **High** (undermines
brand consistency or trust), **Medium** (cleanup, dead weight, best-practice gaps).

---

## Critical

### 1. Four different "brand green" values are in production at once
No single source of truth for the primary brand color exists. Four different greens are live
right now, each in a different surface a user actually sees:

| Surface | Value | Where |
|---|---|---|
| Design-token `--primary` (buttons, links, focus rings — the color used *inside* the product) | `oklch(0.35 0.15 140)` → **`#004b00`** | [globals.css:11](../../client/app/globals.css#L11) |
| Browser tab favicon / PWA icons | **`#1baf51`** (measured directly from the PNG pixels) | [favicon-32x32.png](../../client/public/favicon-32x32.png), [icon-192x192.png](../../client/public/icon-192x192.png) |
| Logo mark itself (leaf gradient) | **`#2d5a3d → #1e3d2a`** | [logo.svg:5-7](../../client/public/logo.svg#L4-L7), [grochain-logo.tsx:46-47](../../client/components/ui/grochain-logo.tsx#L46-L47) |
| Browser chrome / PWA theme-color / manifest | **`#16a34a`** | [layout.tsx:79](../../client/app/layout.tsx#L79), [manifest.json:8](../../client/public/manifest.json#L8) |

None of these are the same color, and none of them were derived from another — they're four
independent decisions. `--primary` (`#004b00`) is close to black on a phone screen; the favicon
(`#1baf51`) is a bright kelly green nowhere near it; the logo itself splits the difference at a
muted forest green. A user who opens the app, glances at the browser tab, then looks at the
in-product buttons is looking at three unrelated greens in under two seconds.

**Root cause of the favicon mismatch specifically:** [`scripts/generate-logos.js`](../../client/scripts/generate-logos.js#L12-L78)
hardcodes its *own* copy of the icon SVG — with different gradient stops (`#22c55e`→`#16a34a`
leaf, plus a **blue** `#3b82f6`→`#1d4ed8` chain gradient) — instead of reading the real
`logo-icon.svg`. Every favicon and app icon on disk was generated from a palette that has since
drifted from the actual logo. Confirmed by sampling pixels directly:

```
favicon-32x32.png   → #1aaf51
icon-192x192.png    → #1bb152
apple-touch-icon.png→ #1bb152
```

**Fix:** pick one primary green as the canonical brand color, derive the CSS token, the logo
gradient, and the favicon generator from it, and regenerate the icon files from the *actual*
`logo-icon.svg` — not a second hardcoded copy. See [color-palette.md](../01-brand-guidelines/color/color-palette.md).

### 2. The homepage's main headline silently loses its display typeface
[`hero.tsx:21`](../../client/components/sections/hero.tsx#L21) sets the H1 — "Building Trust in
Nigeria's Food Chain," the single most-seen brand headline on the site — to `font-serif`,
clearly intending a distinct serif display treatment against the sans body copy. But
[`globals.css:82`](../../client/app/globals.css#L82) maps `--font-serif` to **Nunito**, which is
a rounded *sans-serif*, not a serif typeface. The same broken mapping is used in
`about.tsx`, `testimonials.tsx`, `features.tsx`, and `cta.tsx` — five landing-page sections in
total. Nobody sees a rendering error; the intended typographic contrast just silently
never happens. Either load a real serif and fix the token, or stop calling it `font-serif` and
use `font-nunito`/a second sans weight instead — right now the code says one thing and does
another.

### 3. Open Graph / Twitter share image is an SVG — most crawlers won't render it
[`layout.tsx:49-63`](../../client/app/layout.tsx#L49-L63) sets `og:image` and `twitter:image` to
`/logo.svg`. Facebook's, LinkedIn's, and Slack's link-preview crawlers do not reliably rasterize
SVG for `og:image` — the spec and every major platform's docs call for JPG/PNG. In practice this
means a shared GroChain link is likely to show **no image at all**, or a broken-image icon, in
the exact moment a prospective farmer, buyer, or investor is deciding whether to click. On top of
the format problem, the declared dimensions (`width: 1200, height: 630`, a 1.9:1 ratio) don't
match the actual file (`viewBox 0 0 200 60`, a 3.3:1 ratio) — even a crawler that did rasterize it
would letterbox or distort it.

**Fix:** export a purpose-built 1200×630 PNG/JPG social card (not a stretched favicon) and point
`openGraph.images` / `twitter.images` at that.

---

## High

### 4. The logo mark carries four unrelated metaphors and doesn't survive shrinking
The icon ([logo-icon.svg](../01-brand-guidelines/logo/source/logo-icon.svg),
[grochain-logo.tsx:36-127](../../client/components/ui/grochain-logo.tsx#L36-L127)) combines, in a
single 64×64 mark: an organic leaf, three chain-link ellipses, a 3×3 QR-code grid, and an
animated "scan line." That's leaf (agriculture) + chain (supply chain / blockchain) + QR
(traceability) + scan effect (tech), four distinct ideas stacked on top of each other. A mark is
supposed to reduce to a clean, recognizable silhouette — this is the opposite: it's detail that
only reads at large sizes. At the sizes it's actually used — a 16px browser tab, a 32px nav bar,
a mobile home-screen icon — it degrades to an indistinct green blob; the QR squares and chain
ellipses are sub-pixel and just add noise. Confirmed by the pixel sample above: at 32×32 the mark
already reads as a flat green circle.

**Recommendation:** pick the one idea that's most distinctively GroChain (the leaf-plus-trace
motif is the strongest candidate) and let it stand alone as the icon mark; keep the fuller
story — supply chain, QR traceability — for the wordmark lockup, marketing pages, and the "about"
narrative, where there's room to explain it.

### 5. `og:image`'s baked-in tagline text won't match on-brand fonts
Independent of the SVG-rasterization problem above, [`logo.svg:87-94`](../../client/public/logo.svg#L87-L94)
and [`logo-animated.svg:140-148`](../01-brand-guidelines/logo/source/logo-animated-unused.svg#L140-L148)
hard-code the wordmark and tagline as `<text font-family="Inter, system-ui, sans-serif">`. The
app loads **DM Sans** and **Nunito** ([layout.tsx:18-28](../../client/app/layout.tsx#L18-L28));
Inter is never loaded anywhere in the project. Any renderer that does honor the SVG's own
font-family (image editors, some crawlers, PDF export) will fall back to a generic system sans
instead of the brand typeface.

### 6. Two different taglines in play
`logo.svg` bakes in "Digital Agriculture Platform" as the on-mark tagline. The site's actual
`<title>` and hero copy use "Building Trust in Nigeria's Food Chain"
([layout.tsx:31](../../client/app/layout.tsx#L31), [hero.tsx:22](../../client/components/sections/hero.tsx#L22)).
Both are reasonable lines, but a visitor who sees the logo's tagline and then reads the page
headline is getting two different one-line pitches for what GroChain is. Pick one as the
canonical tagline and use it everywhere the mark appears with text.

### 7. Hero/marketing photography reads as AI-generated stock, not real documentation
`public/nigerian-farmer-woman.png`, `nigerian-businessman.png`,
`nigerian-agricultural-agent.png`, and `nigerian-agricultural-landscape-with-modern-farmin.png`
(note the truncated filename — a signature of an AI image-generation tool auto-naming from a
prompt) are large (1.2–1.9 MB each), generic-looking generated portraits. For a platform whose
core pitch is **trust and transparency in Nigeria's food chain**, leading with imagery that
reads as synthetic stock photography — the moment a visitor notices it — cuts directly against
the brand promise. This is a strategic call for the team, not a pure design fix: either commission
or source real photography of actual farmers/partners, or commit deliberately to an illustration
style instead of photorealism (illustration doesn't carry the same "is this real" risk).

---

## Medium

### 8. `apple-touch-icon.png` exists on disk but is never wired up
[`generate-logos.js:90`](../../client/scripts/generate-logos.js#L90) generates
`apple-touch-icon.png` (180×180), and the file sits in `public/`, but
[`layout.tsx:37-41`](../../client/app/layout.tsx#L37-L41)'s `metadata.icons.apple` points at
`/favicon.ico` instead — a 16px `.ico`, not the PNG Apple's spec actually wants for home-screen
icons. iOS home-screen saves of the site are using the wrong file, at the wrong format and size.

### 9. Dead, orphaned logo asset
`public/logo-animated.svg` (copied here as
[`logo-animated-unused.svg`](../01-brand-guidelines/logo/source/logo-animated-unused.svg) for
reference) is never imported or linked anywhere in the codebase — the actual animated-logo
behavior is implemented separately, inline, inside `grochain-logo.tsx`'s `animated` prop. The
file is pure dead weight (5.8 KB of unused, hand-animated SVG) and a maintenance trap: someone
will eventually edit it, not realize it does nothing, and wonder why nothing changed.

### 10. Three parallel, drifting copies of the same mark
The same leaf/chain/QR artwork is independently duplicated in four places: `logo.svg`,
`logo-icon.svg`, `logo-animated.svg`, and inline inside `grochain-logo.tsx` (twice — once for
`variant="icon"`, once for `variant="full"`). There is no single source SVG that the others are
generated from. That's exactly how finding #1's color drift happened, and it will keep
happening — any future tweak has to be manually applied in four places to stay in sync, and
nothing enforces that it is.

### 11. Deleted QA/demo scaffolding suggests this has been flagged before, informally
`git status` shows `client/app/logo-demo/page.tsx`, `dev-preview-profile/page.tsx`, and
`test-google-auth/page.tsx` were recently deleted (visible via `git show HEAD:...`, not currently
on disk). `logo-demo/page.tsx` was a page rendering every `GroChainLogo` size/variant combination
side by side — exactly the kind of scratch tool you'd build to spot inconsistency by eye. Worth
confirming with whoever deleted it whether it was cleanup of finished scratch work, or whether
the review it enabled never actually happened.

---

## What's *not* broken

Worth naming, since an audit that only lists problems is misleading: the OKLCH-based token
system in `globals.css` (light/dark pairs for every semantic color, chart colors, sidebar
colors) is a genuinely solid, modern foundation — better than most projects this size have. The
`GroChainLogo` component's API (`variant` / `size` / `animated` props) is a reasonable shape for
a logo component, and its usage across `header.tsx`, `footer.tsx`, `dashboard-layout.tsx`,
`auth-layout.tsx`, and `partners/page.tsx` is consistent — nobody's hand-rolling a one-off logo
somewhere. The gap isn't discipline, it's that no canonical source of truth was ever written
down — which is exactly what `design/` (see [../README.md](../README.md)) now exists to fix.

---

## Recommended next step

This audit is deliberately read-only — nothing in `client/` was changed. The next decision is
yours: which of the above (favicon regeneration, `font-serif` fix, OG image, apple-touch-icon
wiring, dead file removal — all mechanical and low-risk) should be applied now, and which
(logo simplification, tagline consolidation, photography direction) need a call from you first
since they're brand decisions, not bugs.

---

## Resolution log — 2026-08-25

Adam approved applying the five mechanical fixes the same day. Per this directory's append-only
rule for audits (see [../README.md](../README.md)), the findings above are left exactly as
written — this section records what changed against them, not a rewrite of the findings
themselves.

| Finding | Status | What changed |
|---|---|---|
| #1 (four brand greens) | **Partially resolved** | The favicon/logo mismatch specifically is fixed: `generate-logos.js` now reads the real `public/logo-icon.svg` instead of an independent hardcoded copy, and all icon files were regenerated — verified by re-sampling pixels (`favicon-32x32.png` now `#234831`, the logo's actual dark leaf tone, was `#1baf51`). **Still open:** picking one canonical primary green and reconciling it with the `--primary` CSS token (`#004b00`) — that's a brand decision, not a mechanical fix, and was deliberately left alone. |
| #2 (`font-serif` → Nunito) | **Resolved** | Added a real serif (Fraunces, via `next/font/google`) and repointed the `--font-serif` token at it instead of Nunito. Nunito wasn't dropped — it's still loaded and now exposed honestly as its own `font-nunito` utility (`--font-nunito: var(--font-nunito-sans)`) so it doesn't become dead weight. Verified in the compiled CSS: `.font-serif { font-family: var(--font-fraunces); }`. No component files needed changes since the class name `font-serif` was kept. |
| #3 (SVG `og:image`) | **Resolved** | Added `scripts/generate-og-image.js`, which composites the real logo mark onto a proper 1200×630 PNG (`public/og-image.png`). `layout.tsx`'s `openGraph.images` / `twitter.images` now point at it instead of `/logo.svg`. |
| #8 (`apple-touch-icon.png` not wired up) | **Resolved** | `metadata.icons.apple` in `layout.tsx` now points at `/apple-touch-icon.png` (regenerated at 180×180 from the real source alongside fix #1) instead of `/favicon.ico`. |
| #9 (dead `logo-animated.svg`) | **Resolved** | Deleted from `client/public/`. A copy remains archived at [`../01-brand-guidelines/logo/source/logo-animated-unused.svg`](../01-brand-guidelines/logo/source/logo-animated-unused.svg) for reference only. |

New npm scripts for discoverability: `npm run generate:icons` (was previously only runnable via
`node scripts/generate-logos.js` directly) and `npm run generate:og-image`.

Findings #4–#7, #10, #11 were unchanged in round 1 — brand/strategy calls that needed a decision
rather than a mechanical fix. Round 2 below makes those calls.

## Resolution log — 2026-08-25, round 2 (canonical green, simplified logo, tagline, photography direction)

Adam asked to "follow the best" on the remaining open decisions rather than leaving them
pending. Decisions made and applied:

### Finding #1, fully resolved: one canonical primary green, `#398526`

Round 1 only fixed the *accidental* drift (favicon vs. logo). The deliberate part — picking one
green and reconciling it with the `--primary` token — is resolved now. Chosen value:
**`#398526`** / `oklch(0.55 0.15 140)`.

This is not an arbitrary fifth color: it's the exact value already shipping as the *dark-mode*
`--primary` token before this fix. Investigating **why** light and dark mode used different
lightness values (`oklch(0.35 ...)` vs `oklch(0.55 ...)`) turned up the real root cause of
`#004b00`: at `L=0.35, C=0.15, H=140`, the OKLCH color falls outside the sRGB gamut for that hue
and gets clipped toward black by the browser — `#004b00` was never a deliberate "near-black
green" design choice, it was a rendering accident. The dark-mode value at `L=0.55` with the same
hue/chroma doesn't clip, and renders as an ordinary, attractive mid-green. So the fix reuses the
original hue/chroma intent (140°, 0.15) at a lightness that actually renders as intended, rather
than inventing a new brand color.

Verified accessible in both directions, not just assumed: `--primary-foreground` is near-white
in light mode but **near-black** in dark mode (`.dark` overrides it to match `--background`) —
so the same primary value has to pass contrast against white text *and* against near-black text.
Computed both:

| Pairing | Contrast | WCAG AA (4.5:1 normal text) |
|---|---|---|
| `#398526` vs. `#ffffff` (light-mode button/link text) | 4.61 | Pass |
| `#398526` vs. `#010200` (dark-mode button text, effectively black) | 4.56 | Pass |

Applied to: `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring` in both `:root` and
`.dark` in `globals.css` (light mode now matches dark mode exactly); the logo mark fill in
`logo.svg`/`logo-icon.svg`/`grochain-logo.tsx`; every regenerated favicon/app icon;
`manifest.json`'s `theme_color`; `layout.tsx`'s `viewport.themeColor` (was `#16a34a`, an
unrelated fifth value).

### Finding #4, resolved: logo mark simplified to one motif

Rebuilt the mark as a single solid-fill leaf silhouette + one vein stroke, in the canonical
green. Removed: both linear gradients, the glow filter, the three chain-link ellipse pairs, the
3×3 QR-code grid, and the animated scan-line from the *base* glyph. Applied identically to
`logo.svg`, `logo-icon.svg`, and `grochain-logo.tsx` (which now shares one internal `LeafMark`
component between its `icon` and `full` variants, rather than two separately hand-drawn copies —
a partial step toward fixing finding #10's duplication problem, though the three files themselves
are still independent). The `animated` prop still exists on `<GroChainLogo>`, but now applies a
gentle `animate-pulse-slow` (already defined in `globals.css`) to the whole glyph instead of a
hand-rolled scan-line tied to the now-removed QR elements.

Confirmed the mark actually reads at small sizes now by rendering it at 192×192 and inspecting
the output — a clear, unambiguous leaf silhouette, not the flat blob the old four-metaphor
version produced at the same size (see round 1's favicon pixel sample for comparison).

### Finding #5, incidentally resolved: `og:image` no longer references a font that's never loaded

Not separately scoped, but fixed as part of the round-1 OG-image work and the logo rebuild:
`logo.svg`'s embedded `<text>` no longer claims `font-family="Inter"` (never loaded anywhere in
the project) — it now specifies `Arial, Helvetica, system-ui, sans-serif`, a stack any renderer
can actually satisfy, verified by rendering it and confirming it comes out as sans-serif rather
than silently falling back to serif (which is what the untested `"DM Sans, system-ui,
sans-serif"` stack did in this project's SVG rasterizer — corrected after visually checking the
rendered output, not assumed).

### Finding #6, resolved: one tagline

*"Building Trust in Nigeria's Food Chain"* is now the only tagline in use anywhere. Removed the
competing *"Digital Agriculture Platform"* line from: the logo SVG (dropped the baked-in tagline
entirely, rather than fitting the longer correct line into a tight 200×60 lockup — see
`logo-usage-notes.md`), `layout.tsx`'s `openGraph.title` and `twitter.title`, and
`manifest.json`'s `name` field.

### Finding #7, decided but deliberately not executed: illustration over continued photorealism

Made the call: move toward a deliberate illustration style rather than sourcing more
photorealistic imagery (AI-generated or otherwise) — reasoning in
[`03-brand-assets/photography/README.md`](../03-brand-assets/photography/README.md). Did **not**
apply this to the live homepage. Swapping the actual marketing-page imagery
(`nigerian-farmer-woman.png` and siblings) is a large, highly visible content change — a
different kind of task than a design-system/token fix, and worth its own deliberate pass with
eyes on the result before it ships, not something to fold silently into this round.

### New finding, found and fixed same day: a sixth green, in transactional emails

The original audit scoped `client/` only. Checking whether the canonical-green fix needed to
reach further turned up `#4CAF50` (a generic Material Design green, unrelated to any of the
other five) hardcoded into `backend/`'s HTML email templates — the verify-email, welcome, and
password-reset emails in `auth.controller.js` (8 occurrences) and a notification template in
`notification.service.js` (2 occurrences). These are arguably the highest-trust surface in the
whole product — account security emails — and they were on a color with no connection to the
brand at all. Replaced all 10 with the canonical `#398526`; contrast re-verified for this
context too (heading text and white-on-fill button both clear WCAG AA, same math as the primary
token). `backend/routes/debug.route.js` has one unrelated blue heading (`#2563eb`) in an internal
test-only route — left alone, not a brand-facing surface. `harvest.controller.js`'s
`cropColors` array (`#22c55e` among 8 categorical chart colors) is a qualitative data-viz
palette, not a brand-identity use — correctly out of scope, left alone.

## Resolution log — 2026-08-25, round 3 (everything remaining)

Adam asked to resolve everything still open, starting with the highest-value items. All of the
following were decided and applied — nothing from the round-2 punch list was left pending.

### Finding #10, now actually resolved: single source of truth for the mark

Round 2 reduced the cost of the three-way duplication (`logo.svg`, `logo-icon.svg`,
`grochain-logo.tsx`) by simplifying the shape; it didn't remove the duplication itself. Fixed
now: mark geometry and colors live in exactly one place,
[`client/lib/brand/logo-mark.json`](../../client/lib/brand/logo-mark.json) (leaf path, vein
path, viewBox, canonical green, ink color). `grochain-logo.tsx` imports it directly (TypeScript's
`resolveJsonModule`, already enabled in `tsconfig.json`). `scripts/generate-logos.js` was
rewritten to *build* `public/logo-icon.svg` and `public/logo.svg` from the same JSON — they're
generated output now, not hand-maintained source — before rendering every favicon/app-icon PNG
from that output. Changing the mark going forward means editing the JSON and running `npm run
generate:icons`; there's no second file to remember.

### Contrast audit, done — and three real accessibility bugs fixed, not just documented

Computed WCAG contrast (not eyeballed) for every color token used as literal text/icon color,
grounded in actual usage counts (`grep`, not assumption) rather than checking tokens that happen
to be easy to reason about:

| Token | Real usage found | Original contrast | Fixed to | New contrast |
|---|---|---|---|---|
| `--warning` (light) | `text-warning` in 79 files; also `bg-warning text-white` badges | 2.70:1 vs white — fails AA, and white-on-badge text was near-invisible | `oklch(0.56 0.15 85)` | 4.69:1 |
| `--secondary` (light) | `text-secondary` in 12 files; also `bg-secondary text-white` buttons | 2.23:1 vs white — same white-text-invisible bug, in real buttons (`products/page.tsx`, `verify/[batchId]/page.tsx`) | `oklch(0.56 0.12 85)` | 4.72:1 |
| `--success` (dark) | `text-success` in 100 files | 2.73–2.95:1 vs dark background — fails AA | `oklch(0.55 0.15 140)` (= canonical primary) | 4.56:1 |

All three keep their original hue/chroma exactly (`85°/0.12` and `85°/0.15` for the gold/amber
family, `140°/0.15` for green) — only the lightness moved, the same pattern as the primary-color
fix in round 2. Before applying the `--secondary` change, checked it wouldn't quietly break the
`bg-secondary/15 text-secondary-foreground` badge pattern used in 6 files — that pairing is
always used at 15% opacity, so the effective background stays near-white regardless of
`--secondary`'s exact value; unaffected.

**`--accent` (dark), deliberately left unchanged.** Real usage exists both as standalone text
(`text-accent`, 44 files) and, more heavily, as a `bg-accent`/`text-accent-foreground` fill pair
inside shadcn's own menu/calendar/command-palette selection states. Those two roles pull in
opposite directions — text-on-dark-page wants `--accent` lighter, but the fill+foreground pairing
(already only marginal at 3.97:1) gets *worse* as `--accent` lightens (dropped to 3.22:1 when
tested). Fixing the less-common role would have broken the more structurally important one, so
this was left as a known, documented trade-off rather than forced through the same fix pattern
as the other three.

### New finding, found and fixed same day: a sixth green, in transactional emails

The original audit scoped `client/` only. Checking whether the canonical-green fix needed to
reach further turned up `#4CAF50` (a generic Material Design green, unrelated to any of the
other five) hardcoded into `backend/`'s HTML email templates — the verify-email, welcome, and
password-reset emails in `auth.controller.js` (8 occurrences) and a notification template in
`notification.service.js` (2 occurrences). These are arguably the highest-trust surface in the
whole product — account security emails — and they were on a color with no connection to the
brand at all. Replaced all 10 with the canonical `#398526`; contrast re-verified for this
context too (heading text and white-on-fill button both clear WCAG AA, same math as the primary
token). `backend/routes/debug.route.js` has one unrelated blue heading (`#2563eb`) in an internal
test-only route — left alone, not a brand-facing surface. `harvest.controller.js`'s
`cropColors` array (`#22c55e` among 8 categorical chart colors) is a qualitative data-viz
palette, not a brand-identity use — correctly out of scope, left alone.

### Nunito, dropped

Was loaded, exposed as a `font-nunito` utility, used by zero components. Rather than keep an
unused font loaded "in reserve" (its own small version of the dead-asset problem this whole
audit has been about), removed it entirely: the `next/font/google` import and loader in
`layout.tsx`, the `--font-nunito` theme token in `globals.css`, and a stale fallback reference
to the old (pre-round-1-rename) `var(--font-nunito)` in `tailwind.config.js`'s legacy
`fontFamily.sans` array, which had been silently broken since round 1 anyway. Two typefaces now:
DM Sans (body/UI) and Fraunces (display headings).

### Lockup rules, type scale, and voice & tone — documented for the first time

None of these existed anywhere before this round. Full content lives in the guideline docs
themselves, not duplicated here — see
[`logo-usage-notes.md`](../01-brand-guidelines/logo/logo-usage-notes.md#lockup-rules--decided-2026-08-25)
(approved variants, minimum sizes, clear space, incorrect usage),
[`typography.md`](../01-brand-guidelines/typography/typography.md#scale--decided-2026-08-25)
(H1–micro scale, grounded in what the hero H1 already did rather than invented from nothing), and
[`brand-guidelines.md`](../01-brand-guidelines/brand-guidelines.md#voice--tone--decided-2026-08-25)
(five voice adjectives, audience-by-audience register notes). All three are marked as first
drafts to be corrected by real use, not settled rulebooks — there was no existing material to
extract them from, so they're reasoned decisions, not documentation of prior practice.

### Finding #7, now executed: illustration set replaces the AI-generated photography

Round 2 decided the direction (illustration over continued photorealism) but deliberately didn't
touch the live homepage. Executed now: all five AI-generated images
(`nigerian-farmer-woman.png`, `nigerian-businessman.png`, `nigerian-agricultural-agent.png`,
`nigerian-agricultural-landscape-with-modern-farmin.png`, `herosection-image.png`) removed from
`client/public/` and replaced in `hero.tsx`, `about.tsx`, and `testimonials.tsx` with a
five-image flat-illustration set built from the brand palette via a new generator script
(`scripts/generate-illustrations.js`, `npm run generate:illustrations`). Full detail — what
replaced what, the style rationale, why avatar faces are deliberately minimal/abstract — in
[`03-brand-assets/photography/README.md`](../03-brand-assets/photography/README.md). Also fixed
in passing: `app/marketplace/layout.tsx`'s `openGraph.images` pointed at the now-deleted
`herosection-image.png` with no `width`/`height` — repointed at `og-image.png` (the branded
social card from round 1) with correct dimensions, matching the root layout's fix.

Verified via a running dev server: all five new image files return HTTP 200, the homepage
renders, and the corrected `--warning`/`--secondary`/`--success` tokens are present in the
compiled CSS — not just written and assumed correct.

### Unchanged from round 2

Finding #11 (deleted QA scaffolding, `logo-demo/page.tsx` and siblings) wasn't investigated
further — it's a question about what a previous session intended, not something this round could
resolve either way.

## Resolution log — 2026-08-26, round 4 (visual QA — actually looking at the rendered app)

Rounds 1–3 fixed real bugs, but every color/contrast decision was made by computation alone —
grep for usage, compute contrast, ship. Round 4 was the first pass that actually launched the
app (Playwright against a live `next dev` server, light and dark, screenshots inspected directly)
instead of reasoning about it from source. That surfaced things a token/text grep structurally
cannot catch.

**New finding: `.agricultural-pattern`'s hardcoded colors were never touched by rounds 1–3.**
Used on the hero, auth-layout, and profile-hero surfaces (`client/app/globals.css`), this
decorative background texture had `rgba(22, 163, 74, ...)` and `rgba(255, 215, 0, ...)` baked in
— the old drifted favicon green and a pure "gold" web color unrelated to any token. A `grep` for
Tailwind `text-*`/`bg-*` classes would never find this; it only showed up as a visibly busy,
slightly off-brand dot pattern in a screenshot. Recolored to the canonical `#398526`/`#d1a84b`
and the tile density reduced (it read as a checkerboard, not a subtle texture) — see
[color-palette.md](../01-brand-guidelines/color/color-palette.md).

**Real bug: `about.tsx`'s illustration wasn't positioned correctly.** The `<Image fill>` for
`illustration-about.png` (added in round 3) sat inside a div missing `position: relative` —
Next.js flagged this directly in the browser console (`parent element with invalid "position"`).
Not something round 3 could have caught without running the app. Fixed, plus added the missing
`sizes` prop to both hero and about images (a real, separate Next.js performance warning).

**Real bug: `metadataBase` was never set.** Round 1 pointed `openGraph`/`twitter` images at
relative URLs (`/og-image.png`) on the assumption Next.js would resolve them against the site's
real domain. Without `metadataBase` set on the root layout's metadata, Next.js's own dev console
warns that it falls back to `http://localhost:3000` — meaning the actual production `og:image`
URL could have been wrong. Added `metadataBase: new URL("https://grochain.com")`, matching the
domain already used in `alternates.canonical`.

**Design-quality correction: `--secondary`'s round-3 value regressed visually.** Full story in
[color-palette.md](../01-brand-guidelines/color/color-palette.md#round-4-2026-08-26-the-math-was-right-the-eyes-hadnt-checked) —
summary: round 3's contrast-driven darkening (`#946d00`) technically passed WCAG but made every
`Badge variant="secondary"` in the app look muddy/olive instead of golden, because that dominant
use case (`bg-secondary text-secondary-foreground`) never needed darkening in the first place.
Fixed properly this time: the actual white-text bug moved to the 6 component call sites that had
it (`text-white` → `text-secondary-foreground`), and the token was re-tuned to `#ad8522` — lighter,
still meaningfully better than the original, and visually gold again.

**Concurrent work found mid-session, not mine, left in place.** While this round was in
progress, another session was independently editing the same area of `client/` — it added a
`--success-foreground` token (fixing `bg-success` badges paired with an undefined
`text-success-foreground` class, same invisible-text bug pattern as the warning/secondary fixes
above) and fixed at least one `bg-warning text-white` instance in
`app/dashboard/harvests/[id]/page.tsx`. Verified the addition was sound (real usage in 9 files,
correct value) and left it as-is rather than reverting or duplicating it — see
`design-tokens.json`'s dark/light `success-foreground` entries, which now reflect it.

### Method note for future rounds

Rounds 1–3 were thorough about grep-based coverage (every `text-*`/`bg-*` Tailwind usage,
every hardcoded hex in `.ts`/`.tsx`/`.js`) but never rendered the app. Round 4's most valuable
finding (`.agricultural-pattern`) was invisible to every grep-based method used so far, and the
`--secondary` correction only happened because the *rendered* badge looked wrong, not because
any number was incorrect. **Static analysis and computed contrast ratios are necessary but not
sufficient — screenshot the real thing before calling a color decision final.**

## Resolution log — 2026-08-26, round 5 (dark mode — a systemic bug across the whole app)

Round 4 checked the homepage in dark mode. Round 5 checked the marketplace page in dark mode and
found the search bar and filter sidebar stayed solid white while everything around them went
dark — a `bg-white` hardcoded instead of `bg-card`. That single finding turned out to be one
instance of a pattern repeated **54 times across 27 files** app-wide.

**Scope.** `grep -rn "bg-white" --include="*.tsx"` (checked for real solid usage, not `bg-white/NN`
opacity variants) found the pattern in dashboard pages (harvests, favorites, orders, shipments,
QR codes, commissions, scanner, marketplace listings), marketing sections, onboarding, analytics,
and shared components (`marketplace-card.tsx`, `harvest-card.tsx`, `harvest-form.tsx`). Every one
of these would have shown the same "island of white in a dark page" bug the marketplace page did
— this was never marketplace-specific, it was systemic.

**Fix, with two carve-outs that needed manual judgment, not blind substitution:**
1. **51 of 54** were solid card/panel/modal-shell backgrounds with no reason to differ from the
   theme — changed to `bg-card` (bulk `perl -i -pe 's/bg-white(?!\/)/bg-card/g'` per file, after
   manually excluding the QR lines below).
2. **5 instances must stay literally white and were protected from the bulk edit**: QR code
   display containers (`harvests/[id]/page.tsx`, `qr-codes/generate/page.tsx`,
   `qr-codes/page.tsx`, `qr-codes/[id]/page.tsx`, `harvest-card.tsx`) — QR codes need real
   white-on-dark-modules contrast to stay scannable; a QR code rendered on a dark theme's card
   color would risk failing to scan. This isn't a token/text-contrast question, it's a barcode
   readability requirement, so these were deliberately left as `bg-white` rather than "fixed."
3. **4 floating buttons/badges overlaid on photos or a fullscreen camera view** (favorites'
   wishlist-remove button, the scanner's fullscreen-close button, both of `marketplace-card.tsx`'s
   image-overlay icon buttons) initially got their `hover:` state bulk-converted to `hover:bg-card`
   alongside their `bg-white/90`/`bg-white/95` base — which would have made them flip from white
   to near-black on hover, since these sit on unpredictable image content rather than the page
   background and were correctly white-family in the first place. Caught by re-reading the diff,
   not by screenshot; reverted the hover states to `hover:bg-white` to match their base.
4. **Two "glass card" headers** (`shipments/create/page.tsx`, `shipments/[shipmentId]/page.tsx`)
   used `bg-white/40 backdrop-blur-md` sitting directly on the page background (not an image) —
   in dark mode this renders as a washed-out gray haze rather than a proper dark glass panel.
   Changed to `bg-background/40` with a matching `border-border/40`, plus their `bg-white/80`
   buttons/badge to `bg-background/80`.
5. One straggler (`dashboard/marketplace/new/page.tsx:772`) was missed by the initial file
   discovery — the grep pattern used to *find* candidate files excluded matches where `bg-white`
   sat immediately before a closing quote, which the actual *fix* pattern didn't exclude. Caught
   by re-running discovery with the corrected pattern before declaring the sweep done, not
   assumed complete after the first pass.

**A real, unrelated bug found and correctly left alone.** `components/profile/settings-form.tsx`
has active `tsc` errors (`avatarFile`, `setAvatarPreview`, etc. — undefined names) from another
session's in-progress, uncommitted edit to that file. Confirmed via `git diff` that this session
made zero changes to it. Not fixed — it isn't this round's work to finish someone else's edit,
and doing so risked guessing wrong about what they were building toward. Flagged instead.

### Method note, again

The marketplace-page finding that started this round came from *navigating to a second page* in
dark mode, not from re-checking the homepage harder. The systemic scope (54 occurrences) came
from generalizing that one finding into a full-codebase grep instead of treating it as
marketplace-specific. Neither step was mechanical — both required treating a single observed bug
as a hypothesis about the codebase, not an isolated incident.

## Round 6 (2026-08-26): the dashboard itself — clean result, no new findings

Every round so far checked pages reachable without logging in. The dashboard (`/dashboard/*`,
gated by `middleware.ts` on an `auth_token` cookie plus a Zustand-persisted `grochain-auth`
client state) was the largest unchecked surface. With no backend running, real login wasn't
possible — instead, a locally-crafted unsigned JWT-shaped cookie (passes `middleware.ts`'s shape
+ expiry check, which doesn't verify a signature) plus a hand-built `grochain-auth` localStorage
entry matching `useAuthStore`'s persisted shape (`{user, token, refreshToken, isAuthenticated}`)
let Playwright reach `/dashboard`, `/dashboard/harvests`, and `/dashboard/products` as if logged
in. Data fetches still correctly fail (no backend), surfacing as visible error toasts/cards —
same graceful-degradation behavior already seen on the public marketplace page — but the full UI
chrome (sidebar, stat cards, badges, search/filter controls, empty states) renders and was
checked in both light and dark mode.

**Result: clean.** No white-in-dark-mode islands, no off-palette colors, no layout breaks. The
round-5 `bg-white` sweep holds up on pages that were never individually screenshotted — evidence
the systemic grep-based fix actually was systemic, not a lucky guess. One pre-existing,
environment-level flake was hit and worked around, not fixed: a cold `next dev` start plus
near-simultaneous navigation to freshly-compiled routes intermittently threw
`Cannot find module './vendor-chunks/@radix-ui.js'` / `ENOENT routes-manifest.json` — the same
Windows dev-server race documented in round 1's audit. Resolved by warming the server with one
sequential request before driving it with Playwright, not by changing any application code.

## Round 7 (2026-08-26): the other three roles — also clean

Round 6 only checked the dashboard as `role: "farmer"`. The dashboard renders a completely
different component per role (`buyer-dashboard.tsx`, `partner-dashboard.tsx`,
`admin-dashboard.tsx`, `farmer-dashboard.tsx` — four separate files, four separate layouts, four
separate sidebars), so "the dashboard was clean" only actually established one of the four. Reused
the same locally-crafted-session technique, swapping the fake user's `role` field, to check all
three remaining roles' dashboard home in both themes.

**Also clean.** Buyer, partner, and admin dashboards all render correctly in dark mode — sidebar
navigation (different per role, correctly themed in each), stat cards, trend pills, and even the
partner dashboard's full-width error state (`bg-destructive/10`-style card, not a hardcoded
light-only error box) all pass. Grep had already confirmed none of the four role dashboard
components carried the round-5 `bg-white` bug; this converts that into a verified visual result
rather than an inference from absence of a grep match.

At this point the reasonably-reachable-by-inspection surface is covered: marketing site, auth
pages, marketplace, and all four dashboard roles, each in both themes. What's left is what no
static/screenshot audit can reach without a live backend — real data states (not just
error/empty states), actual multi-step flows (checkout, onboarding, harvest logging end-to-end),
and anything gated behind server-side business logic.

## Round 8 (2026-08-26): the real backend, with Adam's explicit go-ahead

Every round so far tested against either static analysis or a fake/local session with no real
backend — chosen deliberately, since a live backend meant real writes and real third-party side
effects (email, SMS). Asked first; Adam approved testing real flows with a clearly-marked test
account.

**Found a running backend already on port 5000** (uptime ~56 minutes at discovery, connected to
a live MongoDB Atlas cluster) — belonging to the concurrent session that's been active throughout
this whole audit. Rather than starting a second instance (which briefly happened by accident —
`npm run dev` in `backend/` crashed on `EADDRINUSE` but kept logging cron activity afterward;
stopped via `TaskStop` the moment that was noticed, confirmed back down to one process on the
port). Verified Paystack/Flutterwave keys were sandbox (`sk_test_`/`FLWSECK_TEST`), not live, before
proceeding — no real-money risk either way. Frontend dev servers were already running on ports
3000 and 3001 too (also the concurrent session's); rather than compete for a port, drove Playwright
directly against the already-running :3001 instance, since it's serving the same live-edited
codebase.

**Registered a real, clearly-marked test account**: name "Design Audit Test Account", email
`grochain.design.audit.test@example.com` (a non-deliverable placeholder domain — this account can
never complete real email verification, and receives no real mail). Registration succeeded
end-to-end against the live database. This surfaced one thing worth knowing: `CORS_ORIGIN` in
`backend/.env` is hardcoded to exactly `localhost:3000`/`3001` (+ `127.0.0.1` variants) — any other
dev port gets a CORS rejection, which is why the first attempt (against a fresh instance on
:3460) failed before the port was switched.

**Result: the registration → email-verification-required flow renders correctly** (the banner on
`/login?verify=1` is properly themed, canonical green, clear copy). Login was then correctly
**blocked** — `DISABLE_EMAIL_VERIFICATION=false` in the real `.env`, so the unverified test
account can't reach the dashboard without clicking a real verification link, which doesn't exist
for a non-deliverable test address. This is where the round stopped: reaching a verified session
would require either real inbox access or bypassing verification server-side, and the latter
wasn't part of what was approved — it's a security gate, not a bug, and manipulating account
verification state directly is a different kind of action than a design audit.

**Housekeeping:** the `grochain.design.audit.test@example.com` account now exists,
permanently unverified, in the live database — worth a note for whoever has DB access, in case
it's worth deleting. Confirmed the concurrent session's backend (port 5000) and frontend
instances (3000/3001) were left healthy and undisturbed afterward.

## Round 9 (2026-08-26): the mark itself, redrawn

Adam asked directly whether the logo was "up to standard, international" — a craft question,
not a bug hunt. Answer: no. The leaf silhouette in use since round 2 was inherited unchanged
from the original cluttered mark; simplifying the mark (dropping chain/QR) never included
redrawing the leaf itself, and at full size it read as a lopsided blob, not a leaf — no pointed
tip, no bilateral structure. Rendered three candidates for comparison rather than describing them:
a redrawn leaf with genuine venation (tip top and bottom, asymmetric bulge, central + side
veins); the same leaf as a solid-tile app icon (leaf reversed in white on a green rounded
square — the Slack/Linear/Notion convention, replacing the light-circle-badge treatment); and a
version with a small circular "trace node" cut into the vein, testing whether a literal
traceability device could be added back in cleanly. It couldn't — the node read as a stray hole,
not as "verification," repeating the original mark's mistake of reaching for a concept the
shape can't carry. Adam approved the plain redrawn leaf (no node) as the new canonical mark, in
both the bare (inline/header) and tile (favicon/app-icon/OG) treatments. Applied to
`logo-mark.json`, `grochain-logo.tsx`, `generate-logos.js`, and every generated favicon/icon/OG
asset.

## Round 10 (2026-08-27): a concurrent-session conflict on the same asset

While verifying the round-9 mark, another session working in this repo overwrote the same three
files with a different concept — "Linked Leaf v3.1": the leaf silhouette with a large painted
ring-and-stem device on top. Rendered it to check before saying anything (raw path data isn't
trustworthy to read by eye): at icon size it reads as a magnifying glass or a balloon on a
string — the leaf is almost entirely obscured, and a single ring doesn't read as "chain" any
more clearly than the round-9 node experiment did. Flagged the conflict directly to Adam rather
than resolving it unilaterally either way (revert or keep) — this is a byproduct of two sessions
editing the same live asset, not a design call I should make alone. Adam confirmed: restore the
round-9 mark.

**Restored, not just reverted** — the other session had also added two genuinely good pieces of
infrastructure alongside their concept: `generate-logos.js` now auto-copies the generated
SVGs into `design/01-brand-guidelines/logo/source/` (previously a manual `cp` step), and a new
`scripts/export-logo-pack.js` generates a full SVG/PNG/JPG export set (color + white-on-dark,
7 variants, multiple sizes) into `design/03-brand-assets/logo/exports/`. Both kept; both adapted
from the Linked Leaf field names (`linkRingPath`, `stemPath`, `stemOnLeaf`) back to the round-9
schema (`veinPath`, `sideVeinsPath`) so they build the approved mark instead of sitting broken
or silently reintroducing the reverted concept.

## Round 11 (2026-08-27): console/runtime error sweep — one real bug, several ruled out

Adam asked to fix all console and runtime errors and get the app "fully optimized." Baseline
check first: `tsc --noEmit` clean (0 errors), `next lint` clean of actual errors (1699
warnings, all `@typescript-eslint/no-explicit-any` or unused-vars — style/type-safety debt
across ~200 files, not runtime bugs; flagged to Adam rather than attempted as a blanket
refactor, since that's a large, separately-scoped decision, not a bug fix).

Ran a Playwright sweep across ~20 routes (public + all four dashboard roles via the
locally-crafted-session technique from round 6) collecting every console error/warning/pageerror.
Three things looked like bugs at first pass and weren't, confirmed by retesting on a freshly
restarted, isolated server before concluding either way:
- A `SyntaxError: Invalid or unexpected token` pageerror on `/login` and `/dashboard/harvests` —
  gone on retest, an artifact of the concurrent session's heavy file-editing activity triggering
  webpack HMR churn (same category as round 1's dev-server race), not a code defect.
- `/dashboard/favorites` returning 404 — the route file was mid-write by the concurrent session
  at the exact moment tested; existed and worked seconds later.
- The bulk of "issues" on every dashboard page were `401 Unauthorized` from the fake auth
  session's unsigned JWT correctly failing real backend signature verification — expected given
  the testing method, not a bug.

**One real, reproducible bug found and fixed:** a genuine React hydration mismatch on
`/notifications` (and everywhere `NotificationList` renders while logged out — i.e. most
dashboard pages, via the shared notification bell). Root cause: `useNotifications`'s
initialization effect resolved `loading` to `false` fast enough, for logged-out visitors, that
React's client-side hydration check compared against it rather than the server's `loading:true`
HTML. Tried gating the effect on `isHydrated` from the auth store first — didn't fix it (that
store's own hydration flag isn't a reliable enough signal here). Fixed properly with the
textbook pattern: a local `mounted` flag in `NotificationList` (`useState(false)` +
`useEffect(() => setMounted(true), [])`), which is guaranteed identical on server and the
client's first paint regardless of any external timing — the loading card renders until mount is
confirmed, then real state takes over. Verified by direct comparison of the raw curl'd SSR HTML
against the client hydration diff (not just re-running the page and hoping), then re-confirmed
clean across 3 repeated runs and a from-scratch server restart.
