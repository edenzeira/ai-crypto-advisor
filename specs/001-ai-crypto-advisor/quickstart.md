# Quickstart & Validation Guide: AI Crypto Advisor Dashboard

**Date**: 2026-06-11

This guide covers how to run the project locally and validate that each feature works end-to-end. For the full API contract see [contracts/api.md](./contracts/api.md). For the data model see [data-model.md](./data-model.md).

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 20 LTS | `node --version` |
| npm | 9+ | `npm --version` |
| Git | any | `git --version` |

No database installation needed — SQLite is bundled via `better-sqlite3`.

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/crypto-advisor.git
cd crypto-advisor
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
# Edit .env — only JWT_SECRET is required; all API keys are optional (fallbacks used if absent)
npm install
npm run dev
# Server starts on http://localhost:3001
# SQLite database created at ./data/database.sqlite on first run
```

### 3. Set up the frontend (new terminal)

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:3001 is the default — no changes needed for local dev
npm install
npm run dev
# App starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## Validation Scenarios

Work through these in order. Each scenario builds on the previous.

---

### Scenario 1 — New User Registration

**What this validates**: FR-001, FR-002, FR-003; User Story 1

**Steps**:
1. Open `http://localhost:5173`
2. Click "Sign up"
3. Enter name, email, and password; submit

**Expected**:
- Redirected to `/onboarding` (not `/dashboard`)
- JWT stored in `localStorage` (verify: DevTools → Application → Local Storage → `token` key exists)
- `onboarding_complete` is `0` in the database

---

### Scenario 2 — Onboarding Completion

**What this validates**: FR-006 through FR-009; User Story 2

**Steps**:
1. On the onboarding screen, select 2–3 crypto assets (e.g. Bitcoin, Ethereum)
2. Select investor type (e.g. HODLer)
3. Select 1–2 content types (e.g. Market News, Fun)
4. Submit

**Expected**:
- Redirected to `/dashboard`
- `user_preferences` row exists in DB with correct JSON arrays
- `onboarding_complete` is `1` in `users` table

---

### Scenario 3 — Dashboard Loads All Four Sections

**What this validates**: FR-010 through FR-022; User Story 3

**Steps**:
1. After onboarding, observe `/dashboard`

**Expected**:
- All four sections visible: Market News, Coin Prices, AI Insight of the Day, Fun Meme
- Each section contains at least one item
- No section is empty or shows a JavaScript error

---

### Scenario 4 — Fallback Data When API Keys Missing

**What this validates**: FR-011, FR-015, FR-019, FR-022; SC-003

**Steps**:
1. In `backend/.env`, blank out `CRYPTOPANIC_API_KEY` and `OPENROUTER_API_KEY`
2. Restart backend (`Ctrl+C` → `npm run dev`)
3. Reload `/dashboard`

**Expected**:
- All four sections still show content
- Market News section shows `FallbackBadge` ("using cached data")
- AI Insight section shows a static insight; `source` = `"static"` in response
- Coin Prices still loads (CoinGecko requires no key); if CoinGecko is rate-limited, fallback badge appears

---

### Scenario 5 — Preferred Coins at Top of Prices List

**What this validates**: FR-014

**Steps**:
1. Log out; register a new account
2. During onboarding select "Solana" (a mid-cap coin not in the top 10 by default)
3. Open `/dashboard` → Coin Prices section

**Expected**:
- Solana appears in the first few rows of the prices list (above coins with higher market cap that the user did not select)

---

### Scenario 6 — Content Voting

**What this validates**: FR-023 through FR-027; User Story 4

**Steps**:
1. On the dashboard, click the 👍 button on the first news item
2. Verify the button shows an active/filled state and the upvote count increments
3. Click 👎 on the same item
4. Verify vote switches (upcount decrements, downcount increments)
5. Reload the page

**Expected**:
- After reload, the thumbs-down button is still active for that news item
- Vote was persisted in the `votes` table

---

### Scenario 7 — Session Guard: Returning User Skips Onboarding

**What this validates**: FR-008; User Story 2 (acceptance scenario 3)

**Steps**:
1. Log out
2. Log back in with the same credentials

**Expected**:
- Redirected directly to `/dashboard` (not `/onboarding`)

---

### Scenario 8 — Route Guards

**What this validates**: FR-004; edge case — direct navigation

**Steps**:
1. Clear `localStorage` in DevTools (simulates logged-out state)
2. Navigate directly to `http://localhost:5173/dashboard`

**Expected**:
- Redirected to `/login`

Then:
1. Log in
2. Clear DB row's `onboarding_complete` manually (or register a new account without completing onboarding)
3. Navigate to `http://localhost:5173/dashboard`

**Expected**:
- Redirected to `/onboarding`

---

### Scenario 9 — AI Insight Caching

**What this validates**: FR-017, FR-020

**Steps**:
1. Call `GET /api/dashboard/insight` (via browser or curl)
2. Note the `text` value
3. Call the same endpoint again

**Expected**:
- Both responses return identical `text`
- The `daily_insights` table has exactly one row for today's date
- Server logs show the AI API was called only once

---

## Validating Deployment

After deploying to Vercel + Render, repeat Scenarios 1–6 using the production URLs to confirm:
- CORS is configured correctly (no blocked requests in browser console)
- JWT tokens work end-to-end on production
- No API keys appear in browser DevTools → Sources

Refer to the Deployment Plan section in [plan.md](./plan.md) for step-by-step deployment instructions.

---

## Useful Commands

```bash
# Backend
npm run dev          # Start with ts-node-dev (hot reload)
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled dist/index.js

# Frontend
npm run dev          # Start Vite dev server
npm run build        # Production build to dist/
npm run preview      # Preview production build locally

# Inspect SQLite database (optional)
npx better-sqlite3 ./data/database.sqlite ".tables"
npx better-sqlite3 ./data/database.sqlite "SELECT * FROM users;"
```
