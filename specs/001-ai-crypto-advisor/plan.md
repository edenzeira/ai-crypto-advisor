# Implementation Plan: AI Crypto Advisor Dashboard

**Branch**: `001-ai-crypto-advisor` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-ai-crypto-advisor/spec.md`

---

## Summary

Build a full-stack personalized crypto investor dashboard: React + TypeScript + Vite frontend (Vercel), Node.js + Express + TypeScript backend (Render), SQLite database. Users register, complete one-time onboarding, and see a daily dashboard with four content sections (Market News, Coin Prices, AI Insight, Fun Meme), each with thumbs-up/down voting. All external APIs have static fallbacks; no paid services required.

---

## Technical Context

**Language/Version**: TypeScript 5.x throughout (frontend + backend); Node.js 20 LTS

**Primary Dependencies**:
- Frontend: React 18, Vite 5, React Router 6, Tailwind CSS 3, Axios
- Backend: Express 4, better-sqlite3, jsonwebtoken, bcryptjs, cors, dotenv

**Storage**: SQLite via better-sqlite3 — file stored on Render disk; schema auto-initialised on server start

**Testing**: Manual smoke test checklist (no automated test framework in MVP — scope constraint for assignment)

**Target Platform**: Modern browser, desktop + mobile responsive; Vercel (frontend) + Render free tier (backend)

**Project Type**: Full-stack web application — monorepo with `/frontend` and `/backend` deployed independently

**Performance Goals**: All four dashboard sections load within 5 seconds on broadband; graceful fallback within the same window

**Constraints**: Free APIs only; Render free tier spins down after 15 min (cold start ~30–60 s, documented in README); SQLite on ephemeral Render disk (re-seeded on cold start — acceptable for assignment)

**Scale/Scope**: Single-user demo / assignment submission; no high-concurrency requirements

---

## Constitution Check

Constitution file contains template placeholders only — no project-specific governance gates defined. Proceeding without violations.

*Post-design re-check*: Design follows simplicity-first approach. Raw SQL via better-sqlite3 chosen over an ORM to keep dependencies minimal. No unnecessary abstractions. Constitution check remains clear.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-crypto-advisor/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── api.md           ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
crypto-advisor/                        ← repo root (GitHub)
│
├── frontend/                          → deployed to Vercel
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx      # Nav + protected shell
│   │   │   │   └── AuthLayout.tsx     # Centered card for login/signup
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── SignupForm.tsx
│   │   │   ├── onboarding/
│   │   │   │   ├── OnboardingWizard.tsx
│   │   │   │   ├── AssetSelector.tsx
│   │   │   │   ├── InvestorTypeSelector.tsx
│   │   │   │   └── ContentTypeSelector.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardSection.tsx   # Wrapper: title + fallback badge + content
│   │   │   │   ├── NewsCard.tsx
│   │   │   │   ├── CoinCard.tsx
│   │   │   │   ├── InsightCard.tsx
│   │   │   │   └── MemeCard.tsx
│   │   │   └── shared/
│   │   │       ├── VoteButtons.tsx        # Thumbs up/down + counts
│   │   │       ├── Spinner.tsx
│   │   │       ├── FallbackBadge.tsx      # "Using cached data" indicator
│   │   │       └── ErrorBoundary.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── OnboardingPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts               # Auth context consumer
│   │   │   └── useVotes.ts              # Load + submit votes
│   │   ├── services/
│   │   │   └── api.ts                   # Axios instance + typed helpers
│   │   ├── context/
│   │   │   └── AuthContext.tsx          # JWT storage + user state
│   │   ├── types/
│   │   │   └── index.ts                 # Shared TS interfaces
│   │   ├── data/
│   │   │   └── fallbacks.ts             # Client-side static fallbacks
│   │   ├── App.tsx                      # Router + AuthProvider
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── vercel.json                      # SPA rewrite: /* → /index.html
│   └── package.json
│
├── backend/                             → deployed to Render
│   ├── src/
│   │   ├── db/
│   │   │   └── index.ts                 # DB init: open file, run CREATE TABLE IF NOT EXISTS
│   │   ├── middleware/
│   │   │   ├── auth.ts                  # Verify Bearer JWT, attach req.userId
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.ts                  # POST /register, POST /login, GET /me
│   │   │   ├── onboarding.ts            # POST /onboarding
│   │   │   ├── dashboard.ts             # GET /news, /prices, /insight, /meme
│   │   │   └── votes.ts                 # GET /, POST /, DELETE /:id/:type
│   │   ├── services/
│   │   │   ├── coinGecko.ts             # Fetch + fallback
│   │   │   ├── cryptoPanic.ts           # Fetch + fallback
│   │   │   ├── aiInsight.ts             # Generate/cache + fallback
│   │   │   └── redditMeme.ts            # Fetch + fallback
│   │   ├── data/
│   │   │   ├── fallback-news.json
│   │   │   ├── fallback-prices.json
│   │   │   ├── fallback-insights.json
│   │   │   └── fallback-memes.json
│   │   └── index.ts                     # Express app: middleware, routes, listen
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── README.md
└── .gitignore
```

**Structure Decision**: Web application monorepo. `/frontend` and `/backend` are independent deployable units sharing no code packages — types are co-located within each project to avoid premature abstraction.

---

## Development Milestones

### M1 — Project Scaffolding (≈ 2 h)
- Initialise `/frontend`: `npm create vite@latest` → React + TypeScript; add Tailwind, React Router, Axios
- Initialise `/backend`: `npm init`; add Express, TypeScript, better-sqlite3, jsonwebtoken, bcryptjs, cors, dotenv
- Configure `tsconfig.json`, `tailwind.config.ts`, `.env.example`, `.gitignore`
- DB init on server start — verify SQLite file created with all four tables

### M2 — Authentication (≈ 3 h)
- Backend: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`; bcrypt password hashing; JWT signing
- JWT middleware for protected routes
- Frontend: `AuthContext`, `useAuth` hook; `LoginPage`, `SignupPage` with forms
- Route guards: unauthenticated → `/login`; post-login → check `onboarding_complete`

### M3 — Onboarding (≈ 2 h)
- Backend: `POST /api/onboarding` — upsert user_preferences, set `onboarding_complete = 1`
- Frontend: `OnboardingPage` three-step wizard with multi-select for assets and content types
- Route guard: authenticated but `onboarding_complete = false` → `/onboarding`

### M4 — Dashboard Shell with Static Data (≈ 3 h)
- Backend: all four `/api/dashboard/*` routes returning static fallback JSON
- Frontend: `DashboardPage` grid, `DashboardSection` wrapper, all four card components
- `FallbackBadge` visible on every section (removed later when live data confirmed)
- `ErrorBoundary` wrapping each section independently

### M5 — Real API Integration (≈ 4 h)
- CoinGecko: `GET /coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20`; prioritise user coins
- CryptoPanic: `GET /posts/?auth_token=…&public=true`; fallback if key absent or request fails
- Reddit: `GET https://www.reddit.com/r/CryptoCurrency/hot.json?limit=20` (public, no key); pick first image post; fallback on failure
- OpenRouter (primary) / Hugging Face (secondary): prompt for daily crypto insight; cache result in `daily_insights` table keyed by date; serve cache on same-day repeat requests; fallback static insight if both fail

### M6 — Voting (≈ 2 h)
- Backend: `POST /api/votes` (upsert), `DELETE /api/votes/:contentId/:contentType`, `GET /api/votes`
- Frontend: `VoteButtons` component; `useVotes` hook loads all votes on dashboard mount
- Optimistic UI — update count immediately, revert on API error

### M7 — Polish & README (≈ 2 h)
- Loading skeletons per section while data fetches
- Toast / redirect on JWT expiry (401 response interceptor in Axios)
- Responsive layout audit on mobile viewport
- README: local setup, architecture, API routes table, deployment links, AI usage summary, bonus recommendation training section

### M8 — Deployment (≈ 2 h)
- Push to public GitHub repo
- Deploy backend → Render; set env vars; verify health endpoint responds
- Deploy frontend → Vercel; set `VITE_API_URL`; verify SPA routing works
- End-to-end smoke test on production URLs

---

## Deployment Plan

### Backend → Render

| Step | Action |
|------|--------|
| 1 | Connect GitHub repo to Render; set root directory to `/backend` |
| 2 | Build command: `npm install && npm run build` |
| 3 | Start command: `node dist/index.js` |
| 4 | Environment variables: `JWT_SECRET`, `CRYPTOPANIC_API_KEY`, `OPENROUTER_API_KEY`, `NODE_ENV=production`, `PORT=3001` |
| 5 | Add `DATABASE_PATH=./data/database.sqlite`; ensure `/backend/data/` is in `.gitignore` but directory is created at runtime |

> Render free tier: spins down after 15 min idle. First request after sleep is slow. Frontend shows a loading state; README documents this behaviour.

### Frontend → Vercel

| Step | Action |
|------|--------|
| 1 | Connect GitHub repo to Vercel; set root directory to `/frontend` |
| 2 | Framework preset: Vite; build command: `npm run build`; output: `dist` |
| 3 | Environment variable: `VITE_API_URL=https://<your-backend>.onrender.com` |
| 4 | `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` |

### Environment Variables Reference

```bash
# backend/.env  (never commit this file)
JWT_SECRET=<64-char random string>
CRYPTOPANIC_API_KEY=           # optional — fallback used if blank
OPENROUTER_API_KEY=            # optional — fallback used if blank
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/database.sqlite

# frontend/.env  (never commit this file)
VITE_API_URL=http://localhost:3001
```

---

## Testing Checklist

### Authentication
- [ ] Register with valid name/email/password → JWT returned, redirect to `/onboarding`
- [ ] Register with duplicate email → error shown, no account created
- [ ] Login with correct credentials → JWT returned, redirect to `/dashboard`
- [ ] Login with wrong password → clear error shown, no JWT
- [ ] Access `/dashboard` without JWT → redirect to `/login`
- [ ] Expired / tampered JWT → redirect to `/login` with "Session expired" message

### Onboarding
- [ ] First login redirects to `/onboarding`
- [ ] Submit with no asset selected → validation error shown
- [ ] Complete all 3 steps → preferences in DB, redirect to `/dashboard`
- [ ] Second login skips onboarding → land directly on `/dashboard`
- [ ] Navigate to `/dashboard` URL directly before completing onboarding → redirected to `/onboarding`

### Dashboard
- [ ] All 4 sections render with data (live or fallback) — none empty, none crashed
- [ ] Remove all API keys from `.env` → all 4 sections show fallback data + `FallbackBadge`
- [ ] User's preferred coins appear at top of Coin Prices list
- [ ] Reload page multiple times on same day → AI insight text is the same (served from cache)

### Voting
- [ ] Thumbs-up on a news item → icon fills, upvote count increments
- [ ] Click thumbs-down on same item → vote switches, upcount decrements, downcount increments
- [ ] Click active thumb again → vote removed (toggle), counts revert
- [ ] Reload page → all vote states correctly restored
- [ ] Unauthenticated vote attempt → redirected to login (or error toast)

### Deployment
- [ ] Frontend live at Vercel URL; all routes return the app (no 404 on refresh)
- [ ] Backend live at Render URL; `GET /api/auth/me` returns 401 without token (not 500)
- [ ] CORS: frontend origin accepted; other origins blocked
- [ ] No API keys visible in browser DevTools → Sources or Network tabs
- [ ] No secrets in public GitHub repository (check `.gitignore` covers `.env`)

---

## Submission Checklist

- [ ] Public GitHub repository URL provided
- [ ] Deployed frontend URL (Vercel)
- [ ] Deployed backend URL (Render) and DB setup instructions in README
- [ ] README: local setup steps, architecture overview, API routes table, deployment steps, AI usage summary
- [ ] Short English project description (≤ 1 page)
- [ ] AI tool usage during development — which tools, what tasks
- [ ] **Bonus**: Explanation of how votes + onboarding preferences could train a future recommendation model
