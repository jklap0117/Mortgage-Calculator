# Mortgage Calculator — Design & Build Document

A free, visually appealing, mobile-first mortgage calculator, deployed on Netlify and installable on a phone as a PWA. Development happens in five phases, each driven by a ready-to-paste prompt for Claude Fable (see [Build Phases](#build-phases)).

## Goals & Decisions

| Decision | Choice |
|---|---|
| Rates source | FRED API (Federal Reserve / Freddie Mac weekly national averages) — free and reliable; updates weekly, requires a free API key |
| Stack | Vite + React 18 + TypeScript, built fresh in this repo |
| ARM display | Initial fixed-period payment only (no post-adjustment projections) |
| Distribution | Netlify auto-deploy from this repo; installable PWA with offline support |
| Persistence | `localStorage` only — no backend, no accounts |

## Features

1. **Live rates banner (top of app):** Current 30-yr and 15-yr fixed national average rates from FRED, with the "as of" date. FRED discontinued its ARM series, so ARM rates are user-entered; a one-tap "use current 30-yr rate" quick-fill is provided.
2. **Calculator inputs:**
   - Purchase price
   - Down payment — **toggle between % and $**, with the other value auto-derived and shown
   - Loan amount — auto-derived (price − down payment), but manually overridable
   - Interest rate (pre-fillable from the live rate)
   - **Loan type selector:** 30-yr Conventional / 7-yr ARM / 10-yr ARM (segmented control)
   - Monthly property taxes
   - Monthly homeowner's insurance
3. **Results display:** Large, prominent total monthly payment (PITI) with a visual breakdown of Principal & Interest / Taxes / Insurance (donut chart + legend), plus loan amount, total interest over the term, and down payment summary.
4. **Templates:** Save the current scenario under a name; load, rename, delete saved templates.
5. **PWA:** Installable, offline-capable (last-fetched rates cached and shown with their date).

## Mortgage Math Spec

- Monthly P&I: `M = P · [r(1+r)^n] / [(1+r)^n − 1]` where `P` = loan amount, `r` = annual rate / 12 / 100, `n` = total payments. Handle `r = 0` edge case (`M = P/n`).
- All three loan types amortize over **30 years** (`n = 360`); for ARMs the entered rate is the intro rate and the payment shown is the intro-period payment, labeled "for the first 7/10 years."
- Total monthly payment = P&I + monthly taxes + monthly insurance.
- Currency displayed via `Intl.NumberFormat('en-US', {style:'currency', currency:'USD'})`.
- Known-good test case: $400,000 loan at 6.5% over 30 years → P&I ≈ $2,528.27/mo.

## Architecture

```
┌─ Browser (React PWA) ─────────────────────┐
│  RatesBanner ── fetch("/api/rates")       │
│  Calculator (inputs + results)            │
│  Templates (localStorage)                 │
└───────────────┬───────────────────────────┘
                │ Netlify redirect /api/* → functions
┌─ Netlify Function: rates.ts ──────────────┐
│  GET FRED series MORTGAGE30US +           │
│  MORTGAGE15US using FRED_API_KEY env var  │
│  (key never exposed to the browser)       │
└───────────────────────────────────────────┘
```

- **Why a serverless function:** FRED blocks browser CORS calls and the API key must stay secret. The function caches responses (rates only change weekly) and the client also caches the last result in `localStorage` for offline display.
- **Template data model:** `{ id, name, createdAt, purchasePrice, downPaymentMode: '%'|'$', downPaymentValue, loanAmountOverride?, rate, loanType: '30fixed'|'arm7'|'arm10', monthlyTaxes, monthlyInsurance }`, stored under a single `localStorage` key as `{ version: 1, templates: [...] }`.

### Key files (once built)

- `netlify.toml` — build config + `/api/*` redirect
- `netlify/functions/rates.ts` — FRED proxy
- `src/lib/mortgage.ts` — pure math + unit tests
- `src/lib/templates.ts` — localStorage persistence
- `src/App.tsx` + components: `RatesBanner`, `LoanDetailsForm`, `PaymentResult`, `TemplateList`
- `vite.config.ts` — Vite + PWA plugin

## Design Direction

- Mobile-first single-screen layout; everything reachable without deep navigation.
- Modern fintech look: clean card-based sections, one strong accent color, big readable numbers for the payment result, subtle animation when the payment updates.
- Results update live as inputs change — no "Calculate" button.
- Light + dark mode via `prefers-color-scheme`.

## Your Manual To-Dos (between phases)

1. **Before Phase 3:** Get a free FRED API key at https://fred.stlouisfed.org/docs/api/api_key.html (2-minute signup).
2. **After Phase 1:** Connect this repo to Netlify (existing workflow); confirm the deployed site loads.
3. **Before Phase 3 deploy:** In Netlify → Site settings → Environment variables, add `FRED_API_KEY`.
4. **After Phase 5:** On the phone, open the deployed site and "Add to Home Screen."

---

## Build Phases

One Fable session per phase, roughly one per day. Every phase ends with a commit and push so Netlify auto-deploys and progress is testable on the phone. Paste the block quote under each phase directly into Fable.

### Phase 1 — Scaffold, design system, and Netlify deploy setup

**Goal:** A fresh Vite + React 18 + TS app that builds and deploys on Netlify, with the app shell and visual design system in place.

**Fable prompt:**

> This repo contains DESIGN.md describing a mobile-first mortgage calculator PWA deployed on Netlify — read it first. Scaffold a fresh Vite + React 18 + TypeScript app at the repo root. In this phase build only: (1) a `netlify.toml` with build command `npm run build`, publish directory `dist`, and a redirect from `/api/*` to `/.netlify/functions/:splat`; (2) a clean design system in CSS — design tokens for colors, typography, and spacing, one accent color, light and dark mode via `prefers-color-scheme`, a modern fintech feel; (3) the app shell: a header titled "Mortgage Calculator" and placeholder cards for "Current Rates", "Loan Details", "Monthly Payment", and "Saved Templates", laid out mobile-first (single column on phones, comfortable max-width on desktop). Verify `npm run build` succeeds, then commit and push.

**Verify:** `npm run build` passes; Netlify deploy succeeds; shell looks right on a phone.

### Phase 2 — Core calculator

**Goal:** Fully working calculator with all inputs, loan-type selection, and a visually appealing live-updating results display.

**Fable prompt:**

> Build the core mortgage calculator per DESIGN.md. Create a pure TypeScript module `src/lib/mortgage.ts` with the standard amortization formula (`M = P·[r(1+r)^n]/[(1+r)^n−1]`, handle the 0% edge case) and unit tests (add Vitest). Inputs, in a "Loan Details" card: purchase price; down payment with a %/$ toggle where entering one form live-displays the other; loan amount auto-computed as price minus down payment but manually overridable (with a "reset to auto" affordance); annual interest rate; monthly property taxes; monthly homeowner's insurance. Add a segmented control for loan type: "30-yr Fixed", "7-yr ARM", "10-yr ARM" — all amortize over 30 years; for ARMs label the result "for the first 7 years" / "first 10 years". The "Monthly Payment" card shows a large prominent total (P&I + taxes + insurance), a donut chart breaking down Principal & Interest vs Taxes vs Insurance with a legend showing each dollar amount, plus loan amount, down payment summary, and total interest over the term. Everything recalculates live as inputs change with a subtle animation on the payment number — no Calculate button. Use mobile-friendly numeric inputs (`inputMode="decimal"`) and format currency with Intl.NumberFormat. Verify with `npm test` and `npm run build`, then commit and push.

**Verify:** Cross-check the known case ($400k loan, 6.5%, 30 yr → P&I ≈ $2,528.27); toggle %/$ both directions; test on phone.

### Phase 3 — Live rates from FRED

**Goal:** Rates banner at the top showing current 30-yr and 15-yr national averages with date, via a Netlify Function.

**Prerequisite (you):** FRED API key created and added as `FRED_API_KEY` in Netlify env vars. For local testing, `netlify dev` with the key in a gitignored `.env`.

**Fable prompt:**

> Add live mortgage rates per DESIGN.md. Create a Netlify Function at `netlify/functions/rates.ts` that fetches the latest observation of FRED series `MORTGAGE30US` and `MORTGAGE15US` from `https://api.stlouisfed.org/fred/series/observations` (params: `api_key` from the `FRED_API_KEY` env var, `file_type=json`, `sort_order=desc`, `limit=1`) and returns `{ rate30: number, rate15: number, asOf: string }` with a `Cache-Control: public, max-age=3600` header and graceful JSON error responses. In the app, fill in the "Current Rates" banner card: fetch `/api/rates` on load, show both rates prominently with "Freddie Mac national average, as of {date}", cache the last successful response in localStorage and show it (marked with its date) if the fetch fails or the app is offline, and show a skeleton while loading. Add a small "Use this rate" button next to the 30-yr rate that fills the calculator's interest-rate field. Add `@netlify/functions` as a dev dependency and make sure `.env` is gitignored. Verify locally with `netlify dev` if possible, run `npm run build`, then commit and push.

**Verify:** Deployed site shows real rates; "Use this rate" fills the input; airplane mode shows cached rates with their date.

### Phase 4 — Saved templates

**Goal:** Save/load/delete named scenarios so different homes or loan structures can be compared quickly.

**Fable prompt:**

> Add scenario templates persisted in localStorage, per DESIGN.md. Define a `ScenarioTemplate` type capturing every calculator input (purchase price, down payment mode + value, loan amount override, rate, loan type, monthly taxes, monthly insurance) plus `id`, `name`, `createdAt`. In the "Saved Templates" card: a "Save current scenario" button prompting for a name (inline input, not window.prompt); a list of saved templates, each showing its name and a one-line summary (price, loan type, computed monthly payment) with Load, Rename, and Delete actions; Delete requires an inline confirm tap; Load populates all calculator inputs and indicates which template is active; editing inputs after loading marks the scenario as modified with an "update template" option. Store everything as a JSON array under one localStorage key with versioning (`{ version: 1, templates: [...] }`) and tolerate corrupt/missing data. Keep it visually consistent with the existing cards. Run tests and build, then commit and push.

**Verify:** Save 2–3 templates, reload the page, load/rename/delete each; confirm persistence across sessions on the phone.

### Phase 5 — PWA, polish, and final QA

**Goal:** Installable, offline-capable, and visually finished.

**Fable prompt:**

> Finish the app as an installable PWA and polish it, per DESIGN.md. Add `vite-plugin-pwa` with a web app manifest (name "Mortgage Calculator", short_name "Mortgage", standalone display, theme/background colors matching the design tokens) and generated icons (192/512 + maskable + apple-touch-icon) — create a simple, attractive house/percent glyph icon as SVG and generate the PNGs. Configure the service worker to precache the app shell so the calculator works fully offline (the rates banner already falls back to its localStorage cache). Then do a polish pass: consistent spacing and card styling, focus states, input validation (no negative numbers, sensible max on rate), a friendly empty state for templates, verify dark mode everywhere, and check the layout at 360px, 390px, and desktop widths. Update README.md with what the app is, the stack, local dev instructions (`npm install`, `netlify dev`), and the FRED_API_KEY requirement. Run tests and build, then commit and push.

**Verify (you, on phone):** Deploy → Add to Home Screen → launches full-screen with icon; airplane mode → calculator still works and cached rates show; run through a full realistic scenario end-to-end.

---

## Verification Summary

- Unit tests (Vitest) on the amortization math with known-good values.
- `npm run build` green at the end of every phase.
- Each phase pushed → Netlify deploy → checked on the actual phone.
- Final: offline test, Add to Home Screen test, cross-check payment against an established online calculator.
