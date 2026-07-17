---
name: verify
description: Build, launch, and drive this app in a headless browser to verify changes end-to-end.
---

# Verifying the Mortgage Calculator

Vite + React SPA; no backend needed except `/api/rates` (Netlify function), which
fails locally — the rates card falls back to its offline message and everything
else works.

## Build and serve

```bash
npm install                # fresh containers start without node_modules
npm run build              # tsc -b && vite build
npm run preview -- --port 4173 --strictPort   # serves dist/ (run in background)
```

## Drive it (headless Chromium + Playwright)

Playwright is installed globally; local `import 'playwright'` fails. In a
standalone .mjs script import it by absolute path:

```js
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
```

Use a phone viewport (390×844) — the app is mobile-first.

## Selector gotchas

- Form inputs: exact labels `"Purchase price"`, `"Down payment"`, `"Loan amount"`,
  `"Interest rate"`, `"Property taxes"`, `"Home insurance"`. Avoid `/rate/i` —
  it collides with the "Current Rates" section.
- Segmented controls (loan type, %/$ toggle) render `role="radio"` options, not
  buttons: `page.getByRole('radio', { name: '7-yr ARM' })`.
- Cards are `section[aria-label="..."]` — scope locators to a card to avoid
  cross-card matches.

## Flows worth driving

- Calculator: change inputs → Monthly Payment card updates live (known-good:
  $400k loan @ 6.5% → P&I ≈ $2,528.27).
- Templates: save (inline name form), reload page (persistence), load
  (Active badge), edit input (Modified badge + Update template), rename,
  delete (inline Confirm). Storage key `mortgage-calculator:templates`;
  seed/corrupt it via `page.evaluate` to test tolerance.
