# Tasks: AI Crypto Advisor Dashboard

**Input**: Design documents from `specs/001-ai-crypto-advisor/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api.md ✓, quickstart.md ✓

**Tests**: Not requested — no automated test tasks included. Use `quickstart.md` scenarios for manual validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to — US1, US2, US3, US4
- Exact file paths are included in every task description

## Path Conventions

- Frontend: `frontend/src/`
- Backend: `backend/src/`
- Static fallback data: `backend/src/data/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding — both apps runnable locally before any feature work begins.

- [ ] T001 Create monorepo root: `.gitignore`, root `README.md` placeholder, `frontend/` and `backend/` directories
- [ ] T002 [P] Initialise frontend: `npm create vite@latest frontend -- --template react-ts`; install Tailwind CSS, React Router 6, Axios; configure `frontend/tailwind.config.ts` and `frontend/src/index.css` with Tailwind directives
- [ ] T003 [P] Initialise backend: `npm init` in `backend/`; install `express`, `better-sqlite3`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `typescript`, `ts-node-dev`, `@types/*`; configure `backend/tsconfig.json`
- [ ] T004 [P] Create `backend/.env.example` with keys: `JWT_SECRET`, `PORT`, `DATABASE_PATH`, `CRYPTOPANIC_API_KEY`, `OPENROUTER_API_KEY`, `FRONTEND_URL`; create `frontend/.env.example` with `VITE_API_URL=http://localhost:3001`
- [ ] T005 [P] Create static fallback JSON files: `backend/src/data/fallback-news.json` (8 articles), `backend/src/data/fallback-prices.json` (10 coins), `backend/src/data/fallback-insights.json` (7 insights array), `backend/src/data/fallback-memes.json` (10 meme objects)

**Checkpoint**: `npm run dev` starts cleanly in both `frontend/` and `backend/` directories — Hello World responses confirmed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Create SQLite database init module `backend/src/db/index.ts`: open/create file at `DATABASE_PATH` env var, run `CREATE TABLE IF NOT EXISTS` for all four tables (`users`, `user_preferences`, `votes`, `daily_insights`) as defined in `data-model.md`; export the `db` instance
- [ ] T007 Create Express app entry point `backend/src/index.ts`: wire `cors` (origin from `FRONTEND_URL`), `express.json()`, error-handler middleware, mount route files under `/api/*`, call DB init, listen on `PORT`
- [ ] T008 Implement JWT auth middleware `backend/src/middleware/auth.ts`: extract Bearer token from `Authorization` header, verify with `jsonwebtoken`, attach `req.userId: number` to request, return `401 UNAUTHORIZED` on failure
- [ ] T009 Implement error-handler middleware `backend/src/middleware/errorHandler.ts`: catch thrown errors, return `{ error: string, message: string }` shape with appropriate status codes
- [ ] T010 Define shared TypeScript interfaces `backend/src/types/index.ts`: `User`, `UserPreference`, `Vote`, `DailyInsight`, `DashboardNewsItem`, `DashboardCoinItem`, `DashboardInsight`, `DashboardMeme`, `DashboardResponse<T>`; extend Express `Request` to include `userId`
- [ ] T011 [P] Create Axios API client `frontend/src/services/api.ts`: instance with `baseURL` from `VITE_API_URL`, request interceptor to attach `Authorization: Bearer <token>` from `localStorage`, response interceptor to catch 401 and dispatch auth-expiry event
- [ ] T012 [P] Create TypeScript interfaces `frontend/src/types/index.ts`: `User`, `AuthResponse`, `Preferences`, `NewsItem`, `CoinItem`, `InsightItem`, `MemeItem`, `DashboardResponse<T>`, `Vote` — mirror the shapes from `contracts/api.md`
- [ ] T013 [P] Create `AuthContext` and `AuthProvider` `frontend/src/context/AuthContext.tsx`: store `user` state and JWT in `localStorage`; expose `login(token, user)`, `logout()`, `isAuthenticated`, `user`; load token on mount via `GET /api/auth/me`
- [ ] T014 Create React Router structure `frontend/src/App.tsx`: define routes `/`, `/login`, `/signup`, `/onboarding`, `/dashboard`; implement `PrivateRoute` (unauthenticated → `/login`) and `OnboardedRoute` (`onboarding_complete = false` → `/onboarding`) guard components; wrap app in `AuthProvider`

**Checkpoint**: Foundation ready — DB initialises on server start, all four tables exist, auth middleware importable, frontend router renders placeholder pages with correct guard redirects.

---

## Phase 3: User Story 1 — Account Registration & Login (Priority: P1) 🎯 MVP

**Goal**: New visitors can create an account; returning users can log in. A JWT is issued and stored. Protected routes redirect unauthenticated users to `/login`.

**Independent Test**: Register a new account → log out → log back in → verify JWT in `localStorage` and `GET /api/auth/me` returns user data. Dashboard and onboarding not needed.

### Implementation

- [ ] T015 [P] [US1] Implement `POST /api/auth/register` in `backend/src/routes/auth.ts`: validate `name`, `email`, `password` (non-empty, valid email format); check email uniqueness; hash password with `bcryptjs` (cost 12); insert into `users`; sign and return JWT + user object per `contracts/api.md`
- [ ] T016 [P] [US1] Implement `POST /api/auth/login` in `backend/src/routes/auth.ts`: validate email + password; query `users` by email; compare hash; sign and return JWT + user object; return `401 INVALID_CREDENTIALS` on mismatch
- [ ] T017 [US1] Implement `GET /api/auth/me` in `backend/src/routes/auth.ts`: use auth middleware; query `users` by `req.userId`; return user object (no password_hash); mount router at `/api/auth` in `backend/src/index.ts`
- [ ] T018 [US1] Create `AuthLayout` component `frontend/src/components/layout/AuthLayout.tsx`: centered card layout wrapping auth forms; include app logo/title
- [ ] T019 [P] [US1] Create `LoginForm` component `frontend/src/components/auth/LoginForm.tsx`: controlled inputs for email + password; submit calls `POST /api/auth/login` via `api.ts`; on success calls `AuthContext.login()`; shows inline error on `INVALID_CREDENTIALS`
- [ ] T020 [P] [US1] Create `SignupForm` component `frontend/src/components/auth/SignupForm.tsx`: controlled inputs for name, email, password; submit calls `POST /api/auth/register`; on success calls `AuthContext.login()`; shows inline error on `EMAIL_TAKEN`
- [ ] T021 [P] [US1] Create `LoginPage` `frontend/src/pages/LoginPage.tsx`: render `AuthLayout` + `LoginForm`; include link to `/signup`
- [ ] T022 [P] [US1] Create `SignupPage` `frontend/src/pages/SignupPage.tsx`: render `AuthLayout` + `SignupForm`; include link to `/login`

**Checkpoint**: Register new account → JWT stored → re-login works → `GET /api/auth/me` returns user → unauthenticated `/dashboard` access redirects to `/login`.

---

## Phase 4: User Story 2 — First-Login Onboarding (Priority: P2)

**Goal**: After registration, users answer three questions (crypto assets, investor type, content types). Answers saved as preferences. Subsequent logins skip onboarding.

**Independent Test**: Register → complete onboarding → verify `user_preferences` row in DB and `onboarding_complete = 1` in `users` → log out → log back in → redirected to `/dashboard` not `/onboarding`.

### Implementation

- [ ] T023 [US2] Implement `POST /api/onboarding` in `backend/src/routes/onboarding.ts`: use auth middleware; validate `cryptoAssets` (non-empty array), `investorType` (enum), `contentTypes` (non-empty array); upsert `user_preferences` row; set `onboarding_complete = 1` in `users`; return preferences; mount at `/api/onboarding` in `backend/src/index.ts`
- [ ] T024 [P] [US2] Create `AssetSelector` component `frontend/src/components/onboarding/AssetSelector.tsx`: multi-select grid of common crypto assets (BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX, DOT, MATIC) with toggle-on/off chips; minimum-one-selected validation
- [ ] T025 [P] [US2] Create `InvestorTypeSelector` component `frontend/src/components/onboarding/InvestorTypeSelector.tsx`: single-select card grid for HODLer, Day Trader, NFT Collector with icon + description for each
- [ ] T026 [P] [US2] Create `ContentTypeSelector` component `frontend/src/components/onboarding/ContentTypeSelector.tsx`: multi-select chips for Market News, Charts, Social, Fun
- [ ] T027 [US2] Create `OnboardingWizard` component `frontend/src/components/onboarding/OnboardingWizard.tsx`: three-step wizard with step indicator, Back/Next navigation, final Submit step; accumulates selections in local state; on Submit calls `POST /api/onboarding` then updates `AuthContext` user (`onboardingComplete: true`) and navigates to `/dashboard`
- [ ] T028 [US2] Create `OnboardingPage` `frontend/src/pages/OnboardingPage.tsx`: render `OnboardingWizard` inside a centered layout with progress heading

**Checkpoint**: Register → onboarding wizard appears → complete all 3 steps → redirect to `/dashboard` → log out → log back in → `/dashboard` loads directly (onboarding skipped).

---

## Phase 5: User Story 3 — Daily Dashboard View (Priority: P3)

**Goal**: Authenticated users with completed onboarding see a dashboard with four populated sections: Market News, Coin Prices, AI Insight of the Day, Fun Crypto Meme. All sections fall back gracefully if external APIs are unavailable.

**Independent Test**: Load `/dashboard` with all API keys blanked — all four sections render with fallback content and `FallbackBadge` visible. Then restore keys — sections show live data.

### Step A — Dashboard Shell with Static Data

- [ ] T029 [P] [US3] Create static-data dashboard routes `backend/src/routes/dashboard.ts`: implement `GET /api/dashboard/news`, `/prices`, `/insight`, `/meme` each returning the matching `fallback-*.json` with `isFallback: true`; use auth middleware; mount at `/api/dashboard` in `backend/src/index.ts`
- [ ] T030 [US3] Create `AppLayout` + `Navbar` components `frontend/src/components/layout/AppLayout.tsx` + `Navbar.tsx`: top nav with app name, user display name, and Logout button (calls `AuthContext.logout()` + navigate to `/login`)
- [ ] T031 [US3] Create `DashboardSection` wrapper `frontend/src/components/dashboard/DashboardSection.tsx`: accepts `title`, `isFallback`, `isLoading`, `children` props; renders section heading, `FallbackBadge` when `isFallback`, loading spinner when `isLoading`
- [ ] T032 [P] [US3] Create `FallbackBadge` component `frontend/src/components/shared/FallbackBadge.tsx`: small pill badge reading "Using cached data" with a clock icon; shown when `isFallback = true`
- [ ] T033 [P] [US3] Create `Spinner` component `frontend/src/components/shared/Spinner.tsx`: centered animated spinner for section loading states
- [ ] T034 [P] [US3] Create `NewsCard` component `frontend/src/components/dashboard/NewsCard.tsx`: renders headline (linked), source name, relative publication date; accepts `item: NewsItem` prop
- [ ] T035 [P] [US3] Create `CoinCard` component `frontend/src/components/dashboard/CoinCard.tsx`: renders coin logo, name, symbol, price in USD, 24 h change with green/red colouring; accepts `item: CoinItem` prop
- [ ] T036 [P] [US3] Create `InsightCard` component `frontend/src/components/dashboard/InsightCard.tsx`: renders insight paragraph and date; `source = "static"` badge when not AI-generated
- [ ] T037 [P] [US3] Create `MemeCard` component `frontend/src/components/dashboard/MemeCard.tsx`: renders meme image with `alt` text from title; links to `permalink` on Reddit
- [ ] T038 [P] [US3] Create `ErrorBoundary` component `frontend/src/components/shared/ErrorBoundary.tsx`: class component wrapping a single dashboard section; renders friendly error message without crashing sibling sections
- [ ] T039 [US3] Create `DashboardPage` `frontend/src/pages/DashboardPage.tsx`: on mount, fetch all four sections in parallel via `api.ts`; manage per-section loading + error state; render four `DashboardSection` + `ErrorBoundary` wrappers with appropriate card components; add `useAuth` hook to pass `useEffect` user preferences to Coin Prices call

**Checkpoint — Static**: Dashboard renders with all four sections populated from static JSON. Fallback badges visible. No section crashes the page.

### Step B — Real API Integration

- [ ] T040 [US3] Implement `backend/src/services/coinGecko.ts`: `GET https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20`; merge with user-preferred coin IDs (second call with `ids=` param if needed); sort preferred coins first; catch errors and return `{ data: fallbackPrices, isFallback: true }` on failure
- [ ] T041 [US3] Implement `backend/src/services/cryptoPanic.ts`: if `CRYPTOPANIC_API_KEY` env var is present, `GET https://cryptopanic.com/api/v1/posts/?auth_token=…&public=true&kind=news`; map to `NewsItem` shape; catch errors or missing key → return `{ data: fallbackNews, isFallback: true }`
- [ ] T042 [US3] Implement `backend/src/services/redditMeme.ts`: `GET https://www.reddit.com/r/CryptoCurrency/hot.json?limit=20` with `User-Agent` header; filter posts where `post_hint === "image"` or URL ends in `.jpg/.png/.gif`; pick random from top 5; catch errors → return `{ data: randomFallbackMeme, isFallback: true }`
- [ ] T043 [US3] Implement `backend/src/services/aiInsight.ts`: check `daily_insights` table for today's UTC date → return cached row if found; if not, attempt OpenRouter API call (`POST https://openrouter.ai/api/v1/chat/completions` with `mistralai/mistral-7b-instruct` model) → on failure attempt HuggingFace Inference API → on failure use random item from `fallback-insights.json`; insert result into `daily_insights` table; return `{ data: insight, isFallback: source === 'static' }`
- [ ] T044 [US3] Update `backend/src/routes/dashboard.ts`: replace static returns with calls to real service modules (coinGecko, cryptoPanic, aiInsight, redditMeme); pass `userId` to coin prices service to enable preferred-coin sorting; propagate `isFallback` flag from each service to response

**Checkpoint — Live**: All four sections load with live data when API keys present. Remove all keys → all four sections gracefully show fallback data with badges. Reload dashboard on same day → AI insight text is identical (served from DB cache).

---

## Phase 6: User Story 4 — Content Voting (Priority: P4)

**Goal**: Every content item on the dashboard has thumbs-up/down controls. Votes are persisted and restored on page reload. Vote counts are visible.

**Independent Test**: Vote thumbs-up on a news item → reload page → thumbs-up still active. Switch to thumbs-down → count updates. Remove vote → both counts revert. All without any dashboard API changes.

### Implementation

- [ ] T045 [US4] Implement `GET /api/votes` in `backend/src/routes/votes.ts`: use auth middleware; query `votes` table for `user_id = req.userId`; return array of `{ contentId, contentType, direction }`; mount router at `/api/votes` in `backend/src/index.ts`
- [ ] T046 [P] [US4] Implement `POST /api/votes` in `backend/src/routes/votes.ts`: use auth middleware; validate `contentId`, `contentType` (enum), `direction` (enum); run `INSERT OR REPLACE INTO votes …` (upserts on UNIQUE constraint); return saved vote
- [ ] T047 [P] [US4] Implement `DELETE /api/votes/:contentId/:contentType` in `backend/src/routes/votes.ts`: use auth middleware; URL-decode params; `DELETE FROM votes WHERE user_id = ? AND content_id = ? AND content_type = ?`; return `{ success: true }` (idempotent — 200 even if no row deleted)
- [ ] T048 [US4] Create `useVotes` hook `frontend/src/hooks/useVotes.ts`: on mount fetch `GET /api/votes` and store in a `Map<string, "up"|"down">` keyed by `${contentType}:${contentId}`; expose `getVote(contentId, contentType)`, `castVote(contentId, contentType, direction)` (optimistic update + `POST`), `removeVote(contentId, contentType)` (optimistic update + `DELETE`); revert optimistic update on API error
- [ ] T049 [US4] Create `VoteButtons` component `frontend/src/components/shared/VoteButtons.tsx`: accepts `contentId`, `contentType`, `upCount`, `downCount`, `userVote: "up"|"down"|null` props; renders 👍 count 👎 with active/inactive states via Tailwind classes; calls `useVotes` methods on click
- [ ] T050 [US4] Integrate `VoteButtons` into all four card components: add `VoteButtons` at the bottom of `NewsCard`, `CoinCard`, `InsightCard`, `MemeCard`; pass `contentId` and `contentType` from each item; pass `userVote` from `useVotes.getVote()`; update `DashboardPage` to pass `useVotes` context down (or use React context for votes)

**Checkpoint**: Vote on any item in any section → count updates → page reload → vote state fully restored for all items across all four sections.

---

## Phase 7: Polish & Deployment

**Purpose**: Cross-cutting improvements and production deployment.

- [ ] T051 Add loading skeleton components `frontend/src/components/shared/Spinner.tsx` (already created in T033): add per-section skeleton placeholders in `DashboardPage` shown while `isLoading = true` for each section
- [ ] T052 Add Axios 401 response interceptor `frontend/src/services/api.ts`: on any 401 response, clear `localStorage` token, call `AuthContext.logout()`, navigate to `/login` with a `?reason=expired` query param; show "Session expired. Please log in again." message on `LoginPage` when `reason=expired`
- [ ] T053 Configure CORS in `backend/src/index.ts`: `cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true })`; add `FRONTEND_URL` to `backend/.env.example`
- [ ] T054 Add `frontend/vercel.json` with SPA rewrite rule: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` — prevents 404 on direct URL access to any client-side route
- [ ] T055 [P] Add `backend/src/routes/health.ts`: `GET /api/health` returns `{ status: "ok", timestamp: <ISO> }` — used to verify Render deployment and warm up cold starts from frontend
- [ ] T056 Write `README.md` at repo root: local setup steps (both apps), architecture overview, full API routes table (from `contracts/api.md`), environment variables reference, deployment steps for Vercel + Render, AI tool usage summary, bonus section on using votes + preferences for future recommendation model training
- [ ] T057 Deploy backend to Render: connect GitHub repo (root: `backend/`), set all env vars (`JWT_SECRET`, `CRYPTOPANIC_API_KEY`, `OPENROUTER_API_KEY`, `FRONTEND_URL`, `NODE_ENV=production`), verify `GET /api/health` returns 200
- [ ] T058 Deploy frontend to Vercel: connect GitHub repo (root: `frontend/`), set `VITE_API_URL` to Render backend URL, verify SPA routing, run all quickstart.md validation scenarios on production URLs

**Checkpoint**: Full end-to-end smoke test on production — register, onboard, view dashboard (live + fallback), vote, reload, votes persist. All sections show data. No secrets in DevTools. README setup steps work in ≤ 15 minutes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 only
- **Phase 4 (US2)**: Depends on Phase 2 + Phase 3 (needs auth + JWT to be working)
- **Phase 5 (US3)**: Depends on Phase 2 + Phase 3 + Phase 4 (needs authenticated + onboarded user to reach dashboard)
- **Phase 6 (US4)**: Depends on Phase 5 (votes attach to dashboard content items)
- **Phase 7 (Polish)**: Depends on all prior phases complete

### User Story Dependencies (within Phases 3–6)

- **US1 (P1)**: Can start after Phase 2 — no user story dependencies
- **US2 (P2)**: Depends on US1 — onboarding requires a logged-in user
- **US3 (P3)**: Depends on US2 — dashboard requires onboarding_complete = true
- **US4 (P4)**: Depends on US3 — votes attach to live dashboard content items

### Within Each Phase

- Models/DB before services
- Services before routes
- Backend routes before frontend pages that consume them
- Static data version before real API integration (Step A before Step B in Phase 5)

### Parallel Opportunities Summary

| Phase | Parallel Tasks |
|-------|---------------|
| Phase 1 | T002, T003, T004, T005 all in parallel |
| Phase 2 | T011, T012, T013 in parallel once T006–T010 done |
| Phase 3 | T015+T016 backend in parallel; T019+T020+T021+T022 frontend in parallel |
| Phase 4 | T024+T025+T026 selector components in parallel |
| Phase 5 (A) | T032+T033+T034+T035+T036+T037+T038 frontend components in parallel |
| Phase 5 (B) | T040+T041+T042 services in parallel (T043 independent) |
| Phase 6 | T046+T047 in parallel |
| Phase 7 | T055+T056 in parallel |

---

## Parallel Example: Phase 5A (Dashboard Components)

```
Once T029 (static routes) and T030 (AppLayout) are done, launch all at once:

Task: "Create DashboardSection wrapper in frontend/src/components/dashboard/DashboardSection.tsx"
Task: "Create FallbackBadge in frontend/src/components/shared/FallbackBadge.tsx"
Task: "Create NewsCard in frontend/src/components/dashboard/NewsCard.tsx"
Task: "Create CoinCard in frontend/src/components/dashboard/CoinCard.tsx"
Task: "Create InsightCard in frontend/src/components/dashboard/InsightCard.tsx"
Task: "Create MemeCard in frontend/src/components/dashboard/MemeCard.tsx"
Task: "Create ErrorBoundary in frontend/src/components/shared/ErrorBoundary.tsx"

Then T039 (DashboardPage) can assemble them all.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only — ~5 h)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Registration & Login)
4. **STOP and VALIDATE**: Register → login → JWT stored → `GET /api/auth/me` works → guarded routes redirect correctly
5. Demo-able as a working auth system

### Incremental Delivery

1. Phase 1 + 2 → Foundation (~3 h)
2. Phase 3 (US1) → Working auth (~3 h) — **MVP demo point**
3. Phase 4 (US2) → Working onboarding (~2 h)
4. Phase 5A (US3 static) → Full dashboard shell (~3 h) — **second demo point**
5. Phase 5B (US3 live APIs) → Live data + fallbacks (~4 h)
6. Phase 6 (US4) → Voting (~2 h) — **feature-complete**
7. Phase 7 → Deployed + documented (~3 h) — **submission-ready**

### Single Developer Recommended Sequence

```
Day 1  (6 h): Phase 1 + 2 + Phase 3 (US1 — auth fully working)
Day 2  (5 h): Phase 4 (US2 — onboarding) + Phase 5A (dashboard shell, static)
Day 3  (5 h): Phase 5B (real APIs + fallbacks) + Phase 6 (voting)
Day 4  (4 h): Phase 7 (polish + deploy + README)
```

---

## Notes

- **[P]** tasks touch different files and have no shared incomplete dependencies — safe to implement simultaneously
- **[Story]** labels enable full traceability from task back to spec user story and acceptance criteria
- Each phase ends with a **Checkpoint** — validate before moving on; partial completion of a phase is safe to deploy/demo
- Static fallback data (T005) is foundational; always implement fallback *before* the real API call in every service
- Commit after each completed phase at minimum; commit after each task for cleaner git history
- The `quickstart.md` validation scenarios map 1:1 to the phase checkpoints above — use them to confirm each story is independently functional before proceeding
