# Mortgage Calculator

A free, mobile-first mortgage calculator, installable on your phone as a PWA.
Estimate a full monthly payment (principal & interest + taxes + insurance) with
live national average rates, and save named scenarios to compare homes and loan
structures side by side.

**Features**

- Live 30-yr and 15-yr fixed national average rates (Freddie Mac via FRED),
  with one-tap "use this rate" and an offline fallback to the last fetched rates
- Purchase price, down payment with a %/$ toggle, auto-derived (but overridable)
  loan amount, property taxes, and insurance
- Loan types: 30-yr fixed, 7-yr ARM, and 10-yr ARM (intro-period payment,
  amortized over 30 years)
- Live-updating payment breakdown with a donut chart and total interest
- Saved scenario templates (localStorage) with load, rename, and delete
- Installable PWA that works fully offline; light and dark mode

## Stack

- [Vite](https://vite.dev) + React 18 + TypeScript
- Plain CSS with design tokens (light/dark via `prefers-color-scheme`)
- [Vitest](https://vitest.dev) for unit tests
- [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Workbox) for the
  manifest and offline precaching
- Netlify for hosting; a Netlify Function (`netlify/functions/rates.ts`)
  proxies the FRED API so the key stays server-side

## Local development

```bash
npm install
netlify dev     # app + the rates function at /api/rates
```

`netlify dev` requires the [Netlify CLI](https://docs.netlify.com/cli/get-started/).
Plain `npm run dev` also works, but the rates banner will show its offline
fallback since `/api/rates` won't resolve.

Other scripts:

```bash
npm test          # run unit tests once
npm run test:watch
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
```

## FRED API key

Live rates come from the [FRED API](https://fred.stlouisfed.org/docs/api/fred/)
(series `MORTGAGE30US` and `MORTGAGE15US`). Get a free key at
<https://fred.stlouisfed.org/docs/api/api_key.html>, then:

- **Deployed:** set `FRED_API_KEY` in Netlify → Site settings → Environment variables.
- **Local:** put `FRED_API_KEY=...` in a gitignored `.env` file for `netlify dev`.

Without a key the app still works; the rates banner simply shows its
unavailable/offline state.

## Design

See [DESIGN.md](DESIGN.md) for the full design document, mortgage math spec,
architecture, and the phased build plan.
