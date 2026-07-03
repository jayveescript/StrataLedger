# StrataLedger

Transparent strata fund management for Australian owners corporations.

## Repository Structure

```
├── demo/   Static demo (Next.js 14, static export → GitHub Pages)
└── app/    Production app (Next.js 15, React 19, Tailwind CSS v4 → Vercel)
```

### `demo/` — Static Demo

The original static-export build, deployed to GitHub Pages via the workflow in
`.github/workflows/deploy.yml` (triggers on pushes that touch `demo/`).

```bash
cd demo
npm install
npm run dev
```

### `app/` — Production App (Vercel)

The current application, built on the latest stack:

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS v4** (CSS-first config in `app/globals.css` — no `tailwind.config`)
- **TypeScript** (strict)
- **shadcn/ui**-style components (Radix UI + CVA)
- **Recharts** for data visualization

```bash
cd app
npm install
npm run dev
```

#### Deploying to Vercel

1. Import this repository into Vercel
2. Set **Root Directory** to `app`
3. Framework preset: **Next.js** (auto-detected) — no other configuration needed

## Features

- Manager portal: dashboard, strata plans, owners, levies (incl. debt recovery),
  expenses, suppliers & work orders, commission disclosure register, reports
  (incl. auditor workflow), capital works (special levy risk predictor),
  AGM & voting, complaints (VCAT package generator), settings (branding, handover pack)
- **3-layer Strata Rules Engine** (`/rules`): L1 State Law (NSW/VIC/QLD) →
  L2 Company Policy → L3 Building Override, with a rule resolver that enforces
  legal minimums/maximums and a full rule inspector UI
- Owner portal: levies, fund balances, documents, complaints lodgement
- Public pages: landing, security & compliance, API docs

All data is static mock data — no backend.
