# GroChain Brand Guidelines

Status: **actively maintained, not a finished/frozen brand book.** Three resolution rounds
(2026-08-25 → 2026-08-26) took this from an undocumented, drifted system to the state below —
see [the audit](../02-audits/2026-08-25-brand-design-system-audit.md) for the full history of
what was wrong and what changed. This document is the current summary; its siblings carry the
depth and the "why":

- [Logo — current state & usage](logo/logo-usage-notes.md)
- [Color palette](color/color-palette.md) · [design-tokens.json](color/design-tokens.json)
- [Typography](typography/typography.md)

**Keeping this page in sync matters as much as writing it once** — it went stale itself for a
day after the round-3 contrast-audit fixes before being caught and corrected 2026-08-26. When
you change something brand-related, update the doc in the same sitting, not "later."

## What GroChain is

Digital agricultural platform connecting farmers, buyers, and agencies through transparent
supply-chain management with QR-code traceability, serving the Nigerian market.
(Source: `client/app/layout.tsx` metadata.)

**Tagline:** ***"Building Trust in Nigeria's Food Chain"*** — the single canonical tagline, used
consistently in the page `<title>`, `openGraph`/`twitter` metadata, `manifest.json`, and
`lib/constants.ts`. A competing line ("Digital Agriculture Platform") was removed from the logo
SVG and from `openGraph`/`twitter` titles rather than kept as a second, conflicting pitch.

## Logo

Official mark (adopted 2026-08-27): **globe + white network + leaf + chain link**, with
wordmark (leaf as the “i” dot) and tagline. Masters live in
[`../03-brand-assets/logo/source/`](../03-brand-assets/logo/source/); the app loads PNG
lockups via `GroChainLogo`. Full usage notes:
[logo-usage-notes.md](logo/logo-usage-notes.md).

## Color

From the designed identity sheet: **Deep `#0B3D1E`**, **Forest `#166534`** (UI `--primary` /
theme-color), **Grass `#22C55E`**, **Lime `#A3E635`**. Favicons sit on deep-green tiles.
Earlier audits used `#398526`; that value is retired in live code. Full palette notes in
[color-palette.md](color/color-palette.md).

## Typography

Two typefaces: **DM Sans** (body, UI, H3-and-smaller headings) and **Fraunces** (H1/H2 display
headings only). A documented H1-through-micro type scale exists — see
[typography.md](typography/typography.md) — grounded in and cross-checked against what the
marketing sections were already doing, not invented in isolation. Nunito, previously loaded but
unused by any component, was removed rather than kept as dead weight.

## Voice & tone

No existing material to audit against, so this is a first draft, not an extraction from
established practice — treat it as a starting point to correct as real copywriting tests it,
not a settled rulebook.

**Five words for how GroChain sounds:** plain-spoken, warm, grounded, encouraging, direct.

- **Plain-spoken** — the platform touches blockchain-adjacent traceability, QR verification,
  and financial products (loans, insurance), but the copy shouldn't. Explain what something
  *does* before what it's built on. "Scan to see where your food came from," not "blockchain-
  verified supply chain provenance."
- **Warm** — this serves individual farmers, not just enterprise buyers. Copy should read like
  it's written by someone who respects the reader's work, not a B2B SaaS deck.
- **Grounded** — confident about what the platform actually does; doesn't oversell with hype
  language ("revolutionary," "disrupting"). The tagline itself ("Building Trust...") is the
  model: a claim about an outcome, stated plainly.
- **Encouraging** — especially in farmer-facing flows (onboarding, harvest logging, first sale)
  — nudge and reassure rather than instruct tersely. Financial/admin flows can be more neutral.
- **Direct** — short sentences, active voice, says what happens next. Avoid hedging ("might
  potentially help you") in favor of clear statements ("helps you get paid faster").

**Audience shifts the register, not the personality:**

| Audience | Adjust toward |
|---|---|
| Farmers | Simpler vocabulary, more encouragement, assume less prior familiarity with the platform's tech |
| Buyers | Slightly more business-formal, can lean on outcomes/numbers (traceability, reliability) |
| Partners / agencies | Can be the most technical/operational — this audience wants specifics |
| Admin / internal UI | Neutral and efficient — voice matters less here than clarity and speed |

None of the five core adjectives change across audiences — only how much vocabulary and
formality get dialed up or down.

Spot-checked against real product copy already shipping (USSD flow strings in
`backend/services/ussd.service.js`) rather than assumed to hold — it already reads consistent
with this (short, direct, "Thank you for using GroChain!"), which is a good sign this voice
description matches reality rather than aspiration.

## Imagery

Direction: **illustration, not photorealism.** Executed, not just decided — all five
AI-generated homepage images (hero, about, and three testimonial avatars) were replaced with a
flat-illustration set built from the brand palette. Source of truth:
[`client/scripts/generate-illustrations.js`](../../client/scripts/generate-illustrations.js).
Full reasoning and what replaced what in
[photography/README.md](../03-brand-assets/photography/README.md).

## How to keep this from going stale again

The root cause behind nearly every finding in the audit was the same: **there was no single
place a designer or engineer could go to find the current, correct version of anything
brand-related**, so copies drifted — including, briefly, this very set of documents. That's what
`design/` is for — see [../README.md](../README.md). The rule: if it's brand-related and it
isn't in here (or isn't generated from something in here), treat it as unofficial. And when a
value changes in code, change the doc that describes it in the same pass — don't let "I'll
update the docs later" happen, because the design-tokens.json/color-palette.md drift on
2026-08-25→26 is exactly what "later" produces.
