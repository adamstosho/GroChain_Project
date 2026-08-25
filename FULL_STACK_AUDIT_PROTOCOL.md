# GroChain Full-Stack Audit Protocol

**Purpose**: a standing, reusable prompt for running a complete frontend↔backend audit of GroChain — security, correctness, frontend/backend contract sync, responsiveness, performance, completeness, and end-to-end flow — benchmarked against current industry standards rather than gut feel.

**How to use this document**: paste the "Execution Prompt" section (or the whole file) to an AI coding agent, or follow it manually. It is written to be re-run periodically — dependencies and threat models drift, so treat every "current standard" cited here as something to re-verify at execution time, not a fact frozen on the date this was written.

## Role

Whoever executes this protocol operates as a **senior full-stack engineer, DevOps engineer, application security auditor, and cybersecurity officer simultaneously** — the review must reflect the combined judgment all four of those roles would bring: engineering correctness, deployability/operability, exploitability, and defense-in-depth, not just "does the happy path work." Hold this codebase to the standard you'd hold a payment-handling production system to, because it is one.

**The bar**: zero *known* security issues, vulnerabilities, leaks, or access-control loopholes within whatever scope was actually tested this pass — full-stack, front to back, local and live. "Known" is the operative word: §0 rule 4 below is non-negotiable and stays in force even under this stricter bar — state exactly what was tested and how, so "zero issues found" always means "zero issues found by the specific checks listed in this report," never an unqualified guarantee. A confident false "all clear" is a worse outcome than an honest "here's what's still unverified," because it gets trusted and acted on.

**Targets, made concrete** (vague adjectives like "fast," "secure," "standard UX" are not testable — these are):
- **Security**: no finding at High/Critical severity against OWASP Top 10:2025 / OWASP API Security Top 10:2023 (re-verify current editions per §1) left unresolved.
- **Performance**: Core Web Vitals in the "Good" band — LCP < 2.5s, INP < 200ms, CLS < 0.1 — on the live production URL, plus backend p95 API response time and no N+1/unindexed-query patterns on hot paths.
- **UX**: no violation of Nielsen's 10 usability heuristics (visibility of system status, match with the real world, user control/freedom, consistency & standards, error prevention, recognition over recall, flexibility/efficiency, aesthetic & minimalist design, help users recover from errors, help & documentation) on the core purchase/onboarding flows, plus WCAG 2.2 AA (§1).
- **Completeness**: no dead link, no placeholder/"Lorem ipsum"/TODO-in-production copy, no route that 404s or renders an unstyled/broken shell, no feature that's wired in the UI but unimplemented on the backend (or vice versa).

---

## 0. Non-negotiable ground rules

These come from hard-won experience running this exact kind of audit on this exact codebase. Skipping them produces false confidence, not correctness.

1. **Re-verify standards before citing them.** Web-search the current version of every standard referenced below (OWASP Top 10, OWASP API Security Top 10, WCAG) before starting — these documents change, and citing a stale version is worse than not citing one.
2. **Read the actual code before claiming a bug.** A finding is a bug only after you've read the real file at the real line, not after pattern-matching a filename.
3. **Every finding and every fix goes through the same three-step sequence, in order, no skipping steps**:
   1. **Test** — reproduce the issue (or confirm the fix) with an actual command/request/render, not by reasoning about the code in the abstract.
   2. **Review against standard** — map it to the specific cited standard (an OWASP category, a WCAG success criterion, a Core Web Vital threshold, a Nielsen heuristic) so "issue" vs. "non-issue" is a documented judgment call, not a vibe.
   3. **Live-verify** — confirm the end state on a running instance: locally at minimum, and against the production URL (`https://gro-chain.vercel.app/`) whenever the check is meaningful to run there (read-only checks always; anything mutating/destructive only with explicit go-ahead — see rule 9).
   "The code now looks right" is not the same claim as "I ran it and watched it work" — say which one you mean, every time.
4. **Never claim "perfect" or "zero issues" without having actually run the checks that would surface issues.** State exactly what was verified (tests passed, build succeeded, live request made) and what wasn't (no live payment-provider test transaction, no penetration test, no accessibility screen-reader pass) so the next person knows where the real gaps are.
5. **Git safety**: before any destructive operation, `git status`. Never force-push. Never touch a stash you didn't create without inspecting it first (`git stash show -p`) and asking if its origin is unclear.
6. **Windows/CRLF discipline** (this repo is edited on Windows): after any `sed`/scripted edit, check `file <path>` — GNU sed on Git Bash silently converts CRLF→LF, which pollutes diffs. Restore with `unix2dos` when the surrounding file is CRLF.
7. **Distrust green builds after heavy file churn.** `next build` on this project has produced flaky `Cannot read properties of undefined (reading 'call')` failures from a stale `.next` cache that had nothing to do with the code change under test. Before trusting a red build, delete `.next` (PowerShell `Remove-Item -Recurse -Force`, since a partial `rm -rf` on Windows can itself corrupt the cache) and rebuild clean before concluding a change broke something.
8. **Scope each pass.** "Audit everything" across 29 backend controllers, 32 route files, and ~140 frontend components in one sitting produces shallow coverage everywhere. Use the phased plan below and get sign-off on scope/order before burning a full pass — this mirrors how the design-system and payment-flow audits on this project were actually run successfully.
9. **Production is a live system with real users and real money — treat it that way.** Read-only checks (navigation, header/timing inspection, screenshots, Lighthouse/Core Web Vitals runs, accessibility scans) are fine to run against `https://gro-chain.vercel.app/` freely. Never run anything mutating or state-changing against production without the user's explicit go-ahead first — no real payment submissions, no test accounts left behind without a cleanup plan, no hitting destructive/admin endpoints, no load-testing production. Prefer proving a fix locally or in a staging/test-mode payment flow first; only escalate to a live production check when the check itself is genuinely read-only or the user has explicitly approved a mutating one.
10. **Tooling reality check — do this before promising MCP/browser access.** As of this protocol's last update, no dedicated browser-automation MCP server (e.g. Playwright MCP) was connected in-session — only whatever MCP servers the user has actually configured (verify with a tool-search rather than assuming). Don't tell the user "I used MCP to check the live site" unless a browser MCP tool actually ran. The working substitute proven on this project: `curl` for headers/status/timing/API-level checks (local and live), plus a local headless-Chromium driver via `npx playwright` (screenshots, console errors, rendered-DOM checks) pointed at either `localhost` or the production URL. `WebFetch` also works for a quick read-only content/structure check of the live site. State plainly which of these you actually used.

---

## 1. Research phase (do this first, every time)

Before auditing, confirm current versions of:

- **OWASP Top 10** (web application risks) — was OWASP Top 10:2021, superseded by **OWASP Top 10:2025** (adds *Software Supply Chain Failures* and *Mishandling of Exceptional Conditions* as new categories; shifts further from individual coding mistakes toward design/process weaknesses). [owasp.org/Top10/2025](https://owasp.org/Top10/2025/)
- **OWASP API Security Top 10** — 2023 edition is current (no 2025 refresh has shipped as of this writing). [owasp.org/API-Security](https://owasp.org/API-Security/editions/2023/en/0x00-header/)
- **WCAG** — 2.2 is current (W3C Recommendation since Oct 2023, now also ISO/IEC 40500:2025). Level **AA** is the conformance bar virtually every real-world regulation (Section 508, EN 301 549) requires — treat AA, not A, as the target. [w3.org/WAI/standards-guidelines/wcag](https://www.w3.org/WAI/standards-guidelines/wcag/)
- **UX standard** — Nielsen Norman Group's 10 usability heuristics remain the industry-standard reference for "is this standard UX" judgment calls; re-verify NN/g hasn't superseded them. [nngroup.com/articles/ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- **Performance standard** — Google's **Core Web Vitals** (LCP, INP, CLS) are the current, actively-maintained standard for real-world page performance; re-check thresholds haven't shifted. [web.dev/articles/vitals](https://web.dev/articles/vitals)
- **Framework-specific security advisories for the exact versions this repo pins** — check `client/package.json` (`next`, `react`) and `backend/package.json` (`express`, `mongoose`, `jsonwebtoken`, etc.) against the CVE database for each. Example of why this matters: **CVE-2025-29927** was a critical (CVSS 9.1) Next.js middleware authorization-bypass vulnerability affecting versions 11.1.4–15.2.2, fixed in 12.3.5/13.5.9/14.2.25/15.2.3. This repo currently pins `next@^15.5.2` (patched), but re-check on every audit pass — the pin can drift.
- **`npm audit` / Dependabot-equivalent** on both `client/` and `backend/` for known-vulnerable transitive dependencies.

Benchmark against "best of the best" comparably-scoped projects: for a Next.js + Express/Mongoose marketplace with payments, the most relevant reference points are the **official Next.js production checklist** ([nextjs.org/docs/app/guides/production-checklist](https://nextjs.org/docs/app/guides/production-checklist)), **OWASP's Node.js security cheat sheets**, and the security posture of major payment-handling open-source references (e.g. how Medusa.js or Saleor structure their payment webhook idempotency and refund flows) — not a generic "best practices" listicle.

---

## 2. Project context (keep this section current)

- **Stack**: Next.js 15 (App Router) client + Express/Mongoose backend, separate services (not Next.js API routes/Server Actions) — the backend is the actual security boundary; `client/middleware.ts` only gates client-side navigation (redirects based on a JWT-shape/expiry check on a cookie) and **must never be treated as the auth enforcement point**. Every protected backend route must independently re-validate the JWT server-side regardless of what the client middleware did.
- **Live production URL**: `https://gro-chain.vercel.app/` — the standing target for live-verification per §0 rules 3 and 9. Confirm at the start of each pass which commit/build is actually deployed there (it can lag `main`).
- **Payments**: Paystack + Flutterwave, webhook + manual-verify dual path, DB-transaction-wrapped order/inventory updates. **Already audited and hardened** (see §2a "Already covered" — don't re-litigate from scratch, re-verify instead).
- **Design system**: Tailwind v4 + shadcn "new-york", token-based (`--primary`, `--success`, `--destructive`, etc. in `client/app/globals.css`). **Already audited and brought to conformance** — a prior full pass fixed a site-wide broken-hover-state CSS bug, ~1,000 hardcoded colors, a dead responsive breakpoint, duplicate/orphaned components, and inconsistent page headers/loading states. Re-run the `bg-{color}-{shade}` grep sweep (Phase D, §3) to catch drift since, don't assume it's still 100% clean.
- **Scale**: 29 backend controllers, 32 route files, ~80 frontend pages, ~140 components as of this writing — re-count at audit time, this grows.
- **Rate limiting**: centralized in `backend/middlewares/rateLimit.middleware.js`, applied selectively per-route. Verify coverage — the fact it exists doesn't mean every mutating route uses it.
- **File uploads**: `backend/utils/cloudinary.js` + `backend/utils/upload.js` (multer). Audit against the file-upload checklist in Phase B item 7, §3.

## 2a. Already covered — re-verify, don't redo from scratch

To avoid wasted passes, these were substantively addressed in prior audits on this codebase. Confirm they still hold (things drift) rather than re-investigating from zero:

- Payment reference mismatch between client-generated and server-generated transaction references (was breaking all real-money verification) — fixed.
- Client-side price/amount tampering on order creation — fixed with server-side listing-price cross-check.
- Webhook lock deadlock on verification failure, non-constant-time signature comparison (Paystack), wrong Flutterwave verify endpoint, missing Flutterwave webhook entirely, fake (DB-only) refunds, missing ownership checks on sync/bulk-sync endpoints — all fixed.
- Duplicate order creation on payment retry/cancel, swallowed error messages from payment SDK rejections — fixed.
- Full design-token conformity pass across `client/app` and `client/components` — done; orphaned/duplicate components and pages removed; toast systems consolidated onto one implementation; dead Tailwind breakpoint fixed.
- **Not yet done, by explicit earlier scope decision**: no live end-to-end test through an actual Paystack/Flutterwave test-mode transaction. No accessibility screen-reader pass despite the WCAG-relevant fixes. No systematic audit of the other 27 backend controllers (auth, harvest, marketplace, shipment, admin, etc.) — the security hardening so far is payments-only.

---

## 3. Execution phases

Run these as separate scoped passes (see ground rule #8), each ending in a verification gate before moving on.

### Phase A — Frontend↔Backend Contract Sync

Goal: every API call the client makes matches what the backend actually accepts/returns, in both directions.

1. Enumerate backend routes (`backend/routes/*.js`) and their validation schemas (`backend/middlewares/validation.middleware.js` or per-route Joi/Zod schemas).
2. Enumerate frontend API calls (`client/lib/api.ts` and any direct `fetch`/`apiService` calls elsewhere) and their TypeScript request/response types.
3. Diff the two: field names, required vs optional, enum values (status strings, role names), date/number formats, pagination shape. Flag every mismatch — these cause silent runtime bugs, not compile errors, since the boundary is JSON over HTTP with no shared type source of truth.
4. Check error response shape consistency: does every backend error path return `{status:'error', message}` (or whatever this project's actual convention is), and does every frontend error handler actually read `error.message` correctly (this exact class of bug — SDK rejecting with a plain object instead of an `Error`, silently degrading messages to a generic fallback — was found and fixed once already in the payment flow; check for the same pattern elsewhere, e.g. `lib/api.ts` interceptors, other `lib/*.ts` service wrappers).
5. Check auth token handling consistency: token storage key name, refresh-on-401 behavior, and that it matches between `client/lib/auth.ts`, `client/middleware.ts`, and the backend's `authenticate` middleware expectations.

### Phase B — Full Security Audit

Map findings explicitly to **OWASP Top 10:2025** and **OWASP API Security Top 10:2023** categories (re-verify current category names per §1) rather than an ad hoc list. At minimum, for this stack:

1. **Broken Access Control / BOLA (API1)**: for every route taking an `:id` param, confirm ownership or role is checked server-side, not just "is authenticated." (Exact pattern already caught once: `syncOrderStatus`/`bulkSyncOrders` had no ownership check at all.) Systematically walk all 32 route files for this pattern, not just payments.
2. **Injection**: confirm all Mongoose queries build filters from validated/typed input, not raw client-supplied objects passed through unchecked (NoSQL injection via operator injection, e.g. `{$gt: ""}` style payloads in a field expected to be a plain string).
3. **Cryptographic failures / secrets**: grep for hardcoded secrets, confirm `.env` is git-ignored and was never committed (already confirmed clean in a prior pass — re-check, since a new commit could reintroduce this), confirm all signature comparisons use `crypto.timingSafeEqual` (pattern already fixed once for Paystack/Flutterwave webhooks — check any other HMAC/signature verification in the codebase, e.g. other third-party webhooks if any exist).
4. **Software Supply Chain Failures (new in 2025)**: `npm audit` on both `client/` and `backend/`; check CI/build pipeline (`.github/workflows` if present, or Vercel/Render build config) for any unpinned or unverified install steps.
5. **Mishandling of Exceptional Conditions (new in 2025)**: audit `catch` blocks across controllers for silent swallowing that could leave state inconsistent (a pattern already found and fixed once in payment webhooks — DB transaction wrapping was missing, so a mid-update failure could leave an order marked paid without inventory actually decremented). Check other multi-step mutations (order cancellation, refund, shipment status updates, commission payouts) for the same class of partial-failure risk.
6. **Rate limiting / resource exhaustion**: confirm every mutating and every unauthenticated route has appropriate rate limiting, not just payment endpoints.
7. **File upload security**: validate against an allowlist (not just MIME-type header trust — check magic bytes), enforce size limits, generate random filenames (don't trust client-supplied filenames), and confirm uploaded files aren't served from a domain that could enable stored-XSS via file serving.
8. **CORS configuration**: confirm the backend's CORS allowlist is explicit (not `*`) in production and matches only the actual frontend origin(s).
9. **JWT handling**: expiry enforcement, secret strength/rotation story, refresh-token flow (if any) for token replay/reuse protection.
10. **Logging & monitoring**: confirm sensitive data (tokens, passwords, full card/payment details) is never logged — a prior pass already removed token/user-object logging from the Google OAuth callback and payment/checkout consoles; re-check for drift and check backend `console.log`s for the same pattern (backend logs are more likely to contain sensitive payloads since they see raw provider webhooks).

### Phase C — Bug & Error Resolution

1. Static pass: `tsc --noEmit` (client), `node --check` on every touched backend file, `eslint`/`next lint` — fix all *errors* (not pre-existing warnings, unless asked to clean those too).
2. Backend test suite: run and keep green (`npx jest` in `backend/`). Note honestly which code paths the suite doesn't actually exercise (e.g. if `Order`/`Transaction` models are mocked, the tests aren't proving the real DB-transaction logic works — say so, don't imply otherwise).
3. Runtime pass: start the dev server, exercise real requests (curl/Postman for API-level checks, a headless browser for UI — see Phase E), and read actual console/network output rather than assuming success from a 200 status alone (a 200 that returns the wrong shape, or silently no-ops, is still a bug).

### Phase D — Responsiveness, Accessibility & UX

1. Re-run the design-token conformity grep sweep from the prior audit (`bg-`/`text-`/`border-{red,green,yellow,...}-\d+` patterns outside semantic tokens) to catch drift.
2. Check breakpoints at genuinely small widths (375px) and tablet (768px), not just desktop — the prior audit found several `TabsList grid-cols-N` and fixed-width `w-[Npx]` elements with no mobile fallback; that class of bug recurs easily when new UI is added without checking mobile.
3. **WCAG 2.2 AA pass** (not previously done): keyboard navigation (tab order, focus visibility — check for `focus-visible` ring on all interactive elements, not just buttons), color contrast (verify the token palette's actual contrast ratios, not just that it "looks fine"), form labels/ARIA on all inputs, and at least one screen-reader smoke pass (VoiceOver/NVDA) on the core purchase flow.
4. Dark mode parity — this project's tokens define a `.dark` block in `globals.css`; confirm every component actually respects it rather than hardcoding a light-only assumption anywhere newly added.
5. **"Standard UX practices" pass — Nielsen's 10 heuristics (§1), applied concretely to this app:**
   - *Visibility of system status*: every async action (payment, order creation, upload) shows a loading/progress state, not a frozen button.
   - *Match with the real world*: Nigerian-market conventions — currency formatting (₦), phone number formats, address fields — are correct throughout, not generic US defaults.
   - *User control & freedom*: every multi-step flow (checkout, onboarding, bulk upload) has an obvious way back/cancel; no dead-end modals.
   - *Consistency & standards*: this is largely covered by the design-system pass already done — spot-check for regressions since.
   - *Error prevention*: destructive actions (delete listing, cancel order, admin actions) require confirmation; forms validate before submit, not only server-side after a failed round trip.
   - *Recognition over recall*: users aren't asked to remember an order number, reference code, etc. that the UI already has and could just show/autofill.
   - *Flexibility & efficiency*: power-user paths exist where they matter (bulk actions for admin/partner roles) without cluttering the novice path.
   - *Aesthetic & minimalist design*: covered by the design-system pass — check for drift.
   - *Help users recognize/diagnose/recover from errors*: error messages are specific and actionable ("Card declined — insufficient funds" not "Something went wrong"); this ties directly to the plain-object-rejection bug class already found once in the payment SDK wrappers — check other `lib/*.ts` files for the same anti-pattern.
   - *Help & documentation*: forms with non-obvious requirements (password rules, phone format, file size limits) show the requirement inline, not only as a rejected-submission error.

### Phase E — End-to-End Flow Verification

Drive these actual user journeys against a running instance (headless browser + real API, not mocked):

1. **Auth**: register → verify email → login → logout → password reset.
2. **Farmer**: log a harvest → generate QR code → list on marketplace.
3. **Buyer**: browse marketplace → add to cart → checkout → pay (Paystack test mode) → pay (Flutterwave test mode) → view order → track shipment.
4. **Payment edge cases**: cancel mid-payment and confirm order/cart state is sane and retry doesn't duplicate the order (fix already in place — confirm live, not just by code review); simulate a webhook delivery out of order vs the manual verify call.
5. **Partner/Admin**: approve a pending harvest/farmer onboarding; process a commission payout; issue a refund end-to-end (now hits the real provider refund API — confirm it actually round-trips in test mode).
6. **Cross-role visibility**: confirm a buyer cannot see another buyer's orders by guessing an ID (ties back to Phase B.1), and equivalent checks for farmer/partner/admin boundaries.

Record, for each journey: pass/fail, and whether it was verified live or only by code inspection — don't blur that distinction in the final report.

### Phase F — Performance & Optimization

Measure against **Core Web Vitals** (§1) on the live production URL, not just locally (local dev-mode performance is not representative — always measure a production build).

1. **Frontend**: run Lighthouse (or equivalent) against `https://gro-chain.vercel.app/` for the marketplace, checkout, and dashboard-home pages at minimum. Record LCP/INP/CLS and bundle sizes (`next build` already prints per-route First Load JS — flag any route that's an outlier vs. the rest). Check for the usual Next.js culprits: unoptimized `<img>` tags instead of `next/image`, client components that could be server components, unnecessary `"use client"` boundaries pulling large dependencies into the client bundle, missing `loading.tsx`/streaming on data-heavy routes.
2. **Backend**: identify hot paths (marketplace listing, order creation, payment verify) and check for N+1 query patterns (`.populate()` chains that could be a single aggregation), missing Mongoose indexes on frequently-filtered fields (status, buyer/farmer references, createdAt for sorting), and confirm the rate-limiting middleware (§2) doesn't itself become a bottleneck under normal load.
3. **API latency**: measure real p95 response time on the live URL for the core read endpoints (marketplace listing, order history) via `curl -w "%{time_total}"` or equivalent, run a handful of times — one sample is noise, not data.
4. Report numbers, not adjectives — "LCP 1.8s on /marketplace, live, 3 runs averaged" is a finding; "the site feels fast" is not.

### Phase G — Completeness Audit

Goal: confirm the site is actually finished, not just "the parts that were touched work."

1. **Route inventory**: enumerate every route in `client/app/` and confirm each renders successfully (no 404, no unstyled error boundary, no infinite loading state) both locally and on the live URL.
2. **Dead/placeholder content**: grep for `TODO`, `FIXME`, `Lorem ipsum`, `coming soon`, `placeholder.svg`/`placeholder-user.jpg` used as permanent (not fallback) images, and any hardcoded `console.log`-only stub functions in production code paths.
3. **UI/backend parity**: for every button/action visible in the UI, confirm the backend endpoint it calls actually exists and is implemented (not a 501/"not implemented" stub) — walk this from the frontend outward, not just the backend route list, since a UI element calling a nonexistent endpoint is invisible to a backend-only audit.
4. **Link integrity**: no internal `<Link>`/`href` pointing at a route that doesn't exist (this project already removed several genuinely-orphaned pages in a prior pass — check nothing still links to them, and that no new orphans were introduced since).
5. **Cross-role completeness**: confirm every role (farmer, buyer, partner, admin) has a complete, non-broken path through its primary use case — it's easy for one role's flow to regress while testing focuses on another.

---

## 4. Definition of done

A phase is "done" only when:
- Static checks are clean (or all remaining warnings are pre-existing and explicitly called out, not silently left).
- The relevant test suite passes.
- For security/payment-adjacent changes: at least one live exercise of the changed path, not just a code read-through — locally at minimum, against the production URL where the check is read-only or explicitly approved (§0 rule 9).
- For Phase F (Performance): actual measured numbers from the live URL, not estimates.
- For Phase G (Completeness): every route in the inventory has a recorded pass/fail, not a sample.
- Findings are reported with file:line references and a clear CONFIRMED (verified live) vs PLAUSIBLE (verified by code reading only) distinction.
- Nothing is described as "perfect," "100% secure," or "zero issues" without the qualifying scope attached — describe exactly what was checked, how, and what wasn't; that is the honest and more useful claim, and it's what makes a "zero known issues within this scope" verdict actually trustworthy instead of a guess dressed up as a guarantee.

---

## 5. Execution prompt (paste this to run a pass)

> You are acting as a senior full-stack engineer, DevOps engineer, application security auditor, and cybersecurity officer, reviewing GroChain to the standard of a production system that handles real payments and real user data — because it is one. Run Phase **[A / B / C / D / E / F / G — pick one or state "all, in order"]** of `FULL_STACK_AUDIT_PROTOCOL.md` against the current state of this repository, local and live (`https://gro-chain.vercel.app/`).
>
> Before starting: re-verify the current version of every standard cited in §1 via web search — do not assume the versions written in this document are still current, standards and CVEs move faster than this document is updated. Read §2 and §2a for project context so you don't rediscover already-fixed issues, and check what's actually deployed to the live URL before assuming it matches `main`.
>
> Confirm what live-browser/live-request tooling is actually available in this session (§0 rule 10) before claiming to use it. Work through the phase's checklist, testing → reviewing against the cited standard → live-verifying, in that order, for every finding and every fix (§0 rule 3) — reading real code and running real commands/requests, never pattern-matching or assuming. Fix issues you find using the same care as the ground rules in §0. Never run a mutating/destructive check against production without explicit approval first (§0 rule 9).
>
> The bar is zero known High/Critical security findings, Core Web Vitals in the "Good" band, no Nielsen-heuristic or WCAG 2.2 AA violation on core flows, and no missing/broken/placeholder route — but "zero issues" in the final report must always name the scope it was verified within (§4), never stand as an unqualified guarantee. Report using the CONFIRMED/PLAUSIBLE distinction, with concrete measurements for Phase F and a full route-by-route table for Phase G, and end with an honest, complete list of what remains unverified and what you'd need (credentials, provider test-mode access, more time) to close each gap.
