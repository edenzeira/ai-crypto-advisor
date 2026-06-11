# Research: AI Crypto Advisor Dashboard

**Date**: 2026-06-11 | **Phase**: 0 — Technical Decisions

---

## 1. SQLite Driver

**Decision**: `better-sqlite3`

**Rationale**: Synchronous API eliminates async/callback complexity; excellent TypeScript support; significantly faster than `sqlite3` (async) for the read-heavy workloads in this app; single dependency with no native build issues on modern Node 20. The synchronous model is perfectly fine for a low-concurrency assignment app.

**Alternatives considered**:
- `sqlite3` (async callbacks) — rejected: unnecessary complexity for single-user assignment scope
- `Drizzle ORM + better-sqlite3` — rejected: ORM adds abstraction layer not needed for 4 simple tables; raw SQL is more readable for a reviewer
- `Prisma` — rejected: heavy generator step, slow cold starts on Render free tier

---

## 2. ORM vs Raw SQL

**Decision**: Raw SQL with `better-sqlite3`

**Rationale**: Four simple tables with straightforward queries. Raw SQL keeps the code readable and removes any ORM magic that might confuse a reviewer. Schema is defined in `src/db/index.ts` using `CREATE TABLE IF NOT EXISTS` statements run at server startup — no migration tooling needed.

**Alternatives considered**:
- Drizzle ORM — rejected: added dependency with minimal benefit for 4 tables
- Knex query builder — rejected: unnecessary middle layer

---

## 3. JWT Storage (Frontend)

**Decision**: `localStorage`

**Rationale**: Simple to implement; sufficient for an assignment. Token attached to every request via Axios request interceptor (`Authorization: Bearer <token>`).

**Trade-off documented in README**: `localStorage` is vulnerable to XSS. Production apps should use `httpOnly` cookies. This trade-off is explicitly noted in the README security section.

**Alternatives considered**:
- `httpOnly` cookie — preferred in production; rejected for MVP because it requires CSRF protection and complicates the CORS setup on Render/Vercel split deployment

---

## 4. AI Insight Service

**Decision**: OpenRouter (primary), Hugging Face Inference API (secondary), static fallback (tertiary)

**Rationale**:
- OpenRouter provides access to free-tier models (Mistral 7B Instruct, Phi-3 Mini) with a generous free allowance; easy REST API compatible with OpenAI SDK style
- Hugging Face Inference API provides completely free inference on open models but has higher latency and tighter rate limits
- Static fallback array of 7 pre-written insights ensures the section never goes empty

**Implementation**: Service tries OpenRouter first → on failure (network error, 429, 500) tries HuggingFace → on failure returns random static insight. Result cached in `daily_insights` table keyed by `date` (ISO date string). Subsequent requests on same day return cached row immediately — no AI call.

**Model choice**: `mistralai/mistral-7b-instruct` on OpenRouter / `mistralai/Mistral-7B-Instruct-v0.2` on HuggingFace. Both handle "give me a one-paragraph crypto market insight for today" prompt reliably.

---

## 5. Daily Insight Trigger

**Decision**: Lazy generation — first request of the day triggers generation; result cached in DB

**Rationale**: Avoids cron job infrastructure (unavailable on Render free tier without a workaround). On first `GET /api/dashboard/insight` of the day: check `daily_insights` table for today's date → if missing, call AI service → insert result → return. All subsequent requests on same day: return cached row.

**Alternatives considered**:
- Cron job via `node-cron` — rejected: Render free tier sleeps the process so crons are unreliable
- External cron (cron-job.org pinging the endpoint) — rejected: over-engineering for assignment scope

---

## 6. Reddit Meme Fetching

**Decision**: Reddit public JSON API — `https://www.reddit.com/r/CryptoCurrency/hot.json?limit=20`

**Rationale**: Reddit exposes a public read-only JSON endpoint on all subreddits without OAuth. Append `.json` to any Reddit URL. No API key required. Filter results to posts with `post_hint: "image"` or `url` ending in `.jpg/.png/.gif`. Pick a random post from the top 5 image posts for variety.

**Fallback**: A curated static `fallback-memes.json` of 10 crypto meme image URLs (hosted on Imgur or similar permanent hosting) — used when Reddit is rate-limited or returns no image posts.

**Alternatives considered**:
- Reddit OAuth2 — rejected: requires account registration, out of scope
- Tenor GIF API — rejected: requires API key; memes less crypto-specific

---

## 7. CoinGecko API

**Decision**: CoinGecko free public API — no key required for basic endpoints

**Endpoint**: `GET https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1`

**Rationale**: Completely free, no API key needed, returns name, symbol, current_price, price_change_percentage_24h, image. Rate limit: 10–30 calls/minute on free tier — well within dashboard-on-load usage.

**Preferred coin prioritisation**: Backend reads user's `crypto_assets` preference, fetches their preferred coin IDs explicitly if not in the top 20 via a second call with `ids=` parameter, then merges and deduplicates.

**Fallback**: `fallback-prices.json` with 10 major coins at static prices; includes a `isFallback: true` flag in the response so frontend can show `FallbackBadge`.

---

## 8. CryptoPanic API

**Decision**: CryptoPanic free tier — API key required but fallback used if key absent

**Endpoint**: `GET https://cryptopanic.com/api/v1/posts/?auth_token=<KEY>&public=true&kind=news`

**Rationale**: Best free crypto news API; returns structured JSON with title, source, published_at, url. Free tier: 100 requests/day.

**Key handling**: If `CRYPTOPANIC_API_KEY` env var is blank/missing → skip API call → return static fallback immediately. This means the app works end-to-end without any API keys configured (important for reviewer setup).

**Fallback**: `fallback-news.json` with 8 static news articles (curated at build time).

---

## 9. Monorepo vs Separate Repos

**Decision**: Monorepo — single GitHub repository with `/frontend` and `/backend` subdirectories

**Rationale**: Easier to share in a single GitHub URL for assignment submission; Vercel and Render both support deploying from a subdirectory of a monorepo; simpler README.

**Alternatives considered**:
- Two separate repos — rejected: two URLs to submit, no shared README, harder for reviewer to clone and run

---

## 10. CORS Configuration

**Decision**: Backend sets `cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' })`

**Rationale**: Explicit allowlist prevents any origin from calling the API. `FRONTEND_URL` env var on Render set to the Vercel deployment URL.

---

## Resolved Clarifications

All items from spec were clear or had unambiguous defaults. No `[NEEDS CLARIFICATION]` markers were present in the spec. No outstanding unknowns.
