# Changelog

## 2026-08-25
- Directory created. First audit completed: [02-audits/2026-08-25-brand-design-system-audit.md](02-audits/2026-08-25-brand-design-system-audit.md).
- Baseline brand guidelines, color palette (+ `design-tokens.json`), typography notes, and logo
  usage notes written from the current state of `client/`.
- Current logo source SVGs copied into `01-brand-guidelines/logo/source/` for reference.
- Five mechanical fixes from the audit applied to `client/` same day, approved by Adam Tosho —
  see the audit's [round-1 resolution log](02-audits/2026-08-25-brand-design-system-audit.md#resolution-log-2026-08-25)
  for what changed.
- Same day, round 2: the deeper brand calls were made and applied. Canonical primary green
  unified to `#398526` (chosen and verified for WCAG AA contrast, not picked arbitrarily — see
  the [round-2 log](02-audits/2026-08-25-brand-design-system-audit.md#resolution-log-2026-08-25-round-2--canonical-green-simplified-logo-tagline-photography-direction));
  logo mark simplified to a single leaf motif in that green; the two competing taglines
  consolidated to one; imagery direction decided (illustration over continued photorealism) and
  documented, but **not yet applied** to the live homepage — that's scoped as its own future pass.
- Same day, round 3: everything still open was resolved — see the
  [round-3 log](02-audits/2026-08-25-brand-design-system-audit.md#resolution-log-2026-08-25-round-3-everything-remaining)
  for full detail on each. Summary: the logo mark now has one real source of truth
  (`client/lib/brand/logo-mark.json`), a full contrast audit found and fixed three genuine WCAG
  failures (`--warning` and `--secondary` in light mode, `--success` in dark mode — all three
  were also causing invisible white-on-badge/button text in real components), a sixth
  brand-color drift was found and fixed in backend transactional emails (`#4CAF50` →
  `#398526`), unused Nunito was dropped, lockup rules / a type scale / voice & tone were
  documented for the first time, and the illustration direction decided in round 2 was actually
  executed — five AI-generated images replaced with a brand-palette flat-illustration set on the
  live homepage.

## 2026-08-27
- Adopted the designed GroChain brand identity (globe + network + leaf + chain) as the official
  logo across the app. Masters in `design/03-brand-assets/logo/source/`; live assets via
  `npm run generate:icons`. UI primary aligned to forest `#166534`.
- Logo mark upgraded to **Linked Leaf v3**: crafted leaf + open chain-link ring cutout (evenodd)
  + stem into the ring. Replaces the generic solid leaf (v2) while staying one scalable silhouette.
  Regenerated favicons, app icons, lockup PNGs, OG card, and design/source SVGs from
  `client/lib/brand/logo-mark.json`.
- Full logo export pack added at `design/03-brand-assets/logo/exports/` — 7 variants × SVG/PNG/JPG
  (run \`npm run generate:logo-exports\` from \`client/\`).
- Homepage illustration set upgraded from the first-pass geometric placeholders (hills +
  lollipop plants + smiley avatars) to layered scenes: farmer + crate + QR + phone (hero),
  maize + storehouse + tablet (about), and role-distinct avatars. Still illustration, not
  photography — see `design/03-brand-assets/photography/README.md`.
- Homepage CTA hygiene: dead "Verify Products" / "Try QR Verification" buttons now go to
  `/marketplace`; footer has `id="contact"` so the header Contact link works; About body copy
  no longer repeats the paragraph above it.
- Alignment sweep: checked the whole repo (not just the files already touched) for anything the
  three rounds above missed — no new brand-color drift found (a few more categorical/data-viz
  color arrays in `analytics.controller.js` and the analytics dashboard components, correctly
  out of scope, same as `harvest.controller.js`'s `cropColors`), no competing taglines left, and
  USSD copy (`backend/services/ussd.service.js`) already reads consistent with the documented
  voice.
- Found and fixed real staleness in the docs themselves: `design-tokens.json`,
  `color-palette.md`, `typography.md`, and `brand-guidelines.md` still showed pre-round-3 values
  (old `--secondary`/`--warning`/`--success` colors, Nunito still listed as the serif font) —
  the round-3 code changes shipped without their matching doc updates landing in the same pass.
  All four corrected. This is exactly the failure mode the whole `design/` directory exists to
  prevent, so it's called out explicitly in `README.md` and `brand-guidelines.md` now, not just
  quietly fixed.
- Corrected one doc-only error (not a code bug): the type scale's H2 row said `lg:text-4xl`;
  checking it against the four landing sections that motivated it found they'd already agreed
  with each other on `sm:text-4xl` since before this audit started. Fixed the table to match the
  already-correct code, rather than the other way around.
- Round 4, same day: ran the app for the first time (Playwright against a live dev server,
  screenshots inspected directly) instead of reasoning from source alone — see the
  [round-4 log](02-audits/2026-08-25-brand-design-system-audit.md#resolution-log-2026-08-26-round-4-visual-qa--actually-looking-at-the-rendered-app).
  Found and fixed a real bug no grep could catch (`.agricultural-pattern`'s hardcoded, off-brand
  colors — invisible to any text/class search since they're raw `rgba()` in a CSS rule), two
  genuine Next.js bugs (`about.tsx`'s image missing `position: relative`; `metadataBase` never
  set, meaning production `og:image` URLs could have resolved wrong), and a design-quality
  regression in round 3's own work — `--secondary`'s contrast fix technically passed WCAG but
  made every badge using it look muddy, because the real bug (white text on a button) didn't
  need the *shared token* darkened, just those specific components fixed. Also found — and left
  in place, verified sound — a `--success-foreground` addition made by another session editing
  the same files concurrently mid-round.
- Round 5, same day: checking a second page (marketplace) in dark mode, not just the homepage,
  found the search bar and filter sidebar stayed solid white against an otherwise-dark page —
  see the [round-5 log](02-audits/2026-08-25-brand-design-system-audit.md#resolution-log-2026-08-26-round-5-dark-mode--a-systemic-bug-across-the-whole-app).
  That one finding generalized into a full-codebase grep, which turned up the same hardcoded
  `bg-white` in **54 places across 27 files** — genuinely app-wide, not marketplace-specific.
  Fixed 51 (bulk `bg-white` → `bg-card`); deliberately left 5 QR-code display containers as
  literal white (a barcode-readability requirement, not a token bug); caught and corrected a
  self-introduced mismatch where 4 photo-overlay buttons had their hover states bulk-converted
  to `bg-card` when they should have stayed white (they sit on images, not the page background);
  fixed 2 "glass card" headers that read as a gray haze in dark mode. One more real bug
  (`tsc` errors in `settings-form.tsx`) was found, confirmed to belong to another session's
  in-progress edit, and correctly left untouched rather than guessed at.
- Round 6, same day: got into the authenticated dashboard for the first time (no real backend
  available, so a locally-crafted auth cookie + localStorage session was used to pass
  `middleware.ts`'s check — see the
  [round-6 log](02-audits/2026-08-25-brand-design-system-audit.md#round-6-2026-08-26-the-dashboard-itself--clean-result-no-new-findings))
  and checked the dashboard home, harvests, and products pages in both themes. Clean result — no
  new bugs, and the round-5 `bg-white` fix held up on pages that were never individually
  screenshotted. One pre-existing dev-server race (from round 1) was hit and worked around by
  warming the server before driving it, not by changing application code.
- Round 7, same day: the dashboard has four completely different layouts, one per user role
  (farmer/buyer/partner/admin), and round 6 had only checked farmer. Reused the fake-session
  technique with the role swapped and checked all three remaining roles in both themes — also
  clean. See the
  [round-7 log](02-audits/2026-08-25-brand-design-system-audit.md#round-7-2026-08-26-the-other-three-roles--also-clean).
  This is the point where the reasonably-reachable-without-a-live-backend surface is covered:
  marketing site, auth, marketplace, and all four dashboard roles, each in both themes.
- Round 8, same day, with Adam's explicit go-ahead: tested against the real backend (found
  already running — the concurrent session's live instance, connected to a real MongoDB
  database) rather than a fake session. Registered a real, clearly-marked test account
  (`grochain.design.audit.test@example.com`) end-to-end and confirmed the email-verification-
  required screen renders correctly. Stopped there deliberately — the account can't be verified
  (non-deliverable test address) and bypassing verification server-side wasn't part of what was
  approved. See the
  [round-8 log](02-audits/2026-08-25-brand-design-system-audit.md#round-8-2026-08-26-the-real-backend-with-adams-explicit-go-ahead)
  for the full account of a near-miss (briefly started a duplicate backend instance by accident,
  caught and stopped immediately) and housekeeping notes (that test account now exists,
  permanently unverified, in the live database).
