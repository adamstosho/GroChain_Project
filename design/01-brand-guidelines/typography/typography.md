# Typography

## Typefaces in use

| Family | Loaded via | CSS variable | Tailwind utility | Role |
|---|---|---|---|---|
| **DM Sans** | `next/font/google` in [layout.tsx](../../../client/app/layout.tsx) | `--font-dm-sans` | `font-sans` (default body) | Body copy, UI, H3 and smaller headings |
| **Fraunces** | `next/font/google` in [layout.tsx](../../../client/app/layout.tsx) | `--font-fraunces` | `font-serif` | Display contrast — H1/H2 only, see the scale below |

Exactly two typefaces, both actively used. Nunito was dropped 2026-08-25 (loaded, mapped to
`font-serif` incorrectly at first, later exposed as its own `font-nunito` utility, but never
used by any component either way — removed rather than kept as dead weight; see the audit's
round-3 resolution log).

## `font-serif` — fixed 2026-08-25

Originally `globals.css` mapped `--font-serif: var(--font-nunito)`. Nunito is a rounded
sans-serif, not a serif — five landing-page sections (`hero.tsx`, `about.tsx`,
`testimonials.tsx`, `features.tsx`, `cta.tsx`) were applying `font-serif` expecting display
contrast against the DM Sans body copy and silently getting none. See
[audit finding #2](../../02-audits/2026-08-25-brand-design-system-audit.md#2-the-homepages-main-headline-silently-loses-its-display-typeface)
and its resolution log entry. `--font-serif` now points at Fraunces.

## Scale — decided 2026-08-25, corrected 2026-08-26

Grounded in what the hero H1 already does, extended into a full scale:

| Level | Use | Tailwind classes |
|---|---|---|
| Display / H1 | Hero headline, one per page max | `font-serif font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl` |
| H2 | Section headings | `font-serif font-bold tracking-tight text-3xl sm:text-4xl` |
| H3 | Subsection / card headings | `font-sans font-semibold text-xl` |
| H4 | Small headings, prominent labels | `font-sans font-semibold text-lg` |
| Body | Paragraph text | `font-sans font-normal text-base leading-relaxed` |
| Small | Secondary/supporting text | `font-sans font-normal text-sm text-muted-foreground` |
| Micro | Badges, tags, metadata labels | `font-sans font-medium text-xs tracking-wide` |

Rule of thumb behind the split: **Fraunces (`font-serif`) is reserved for H1/H2** — the level
where a display face earns its keep — everything H3 and smaller stays DM Sans (`font-sans`),
since mixing serif/sans much further down the hierarchy stops reading as "considered contrast"
and starts reading as inconsistent.

**Correction, 2026-08-26:** the H2 row originally read `lg:text-4xl`, written without checking
against real usage first. Checking `about.tsx`, `testimonials.tsx`, `features.tsx`, and
`cta.tsx` (all four independently written, not copy-pasted from a shared component) found they
already agree with each other exactly — `text-3xl font-bold tracking-tight sm:text-4xl
font-serif` in every one. The **documentation** was wrong, not the code: fixed the breakpoint
above from `lg:` to `sm:` to match what was already consistently shipping, rather than editing
four already-aligned components to match a table that had a typo in it. H3 (`CardTitle` in
`features.tsx`, `text-xl`) also already matches the table as written, so nothing needed changing
there either — the scale turned out to already reflect real practice for H2/H3 once corrected.
Nothing has actually been retrofitted onto components; this scale's value going forward is
giving future headings a named target to match, not a set of live changes made today.
