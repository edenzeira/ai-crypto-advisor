# Data Model: AI Crypto Advisor Dashboard

**Date**: 2026-06-11 | **Storage**: SQLite (better-sqlite3)

Schema is auto-applied at server startup via `CREATE TABLE IF NOT EXISTS` — no migration tooling required.

---

## Tables

### `users`

Stores registered accounts.

```sql
CREATE TABLE IF NOT EXISTS users (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL,
  email               TEXT    NOT NULL UNIQUE,
  password_hash       TEXT    NOT NULL,
  onboarding_complete INTEGER NOT NULL DEFAULT 0,   -- 0 = false, 1 = true
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | Auto-incremented surrogate key |
| `name` | TEXT | Display name provided at signup |
| `email` | TEXT UNIQUE | Login identifier; lowercase enforced in application layer |
| `password_hash` | TEXT | bcrypt hash (cost factor 12); plaintext never stored |
| `onboarding_complete` | INTEGER | SQLite boolean: 0 / 1; controls post-login routing |
| `created_at` | TEXT | ISO-8601 UTC timestamp |

---

### `user_preferences`

Stores onboarding answers; one row per user (1:1 with `users`).

```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL UNIQUE,
  crypto_assets  TEXT    NOT NULL,   -- JSON array, e.g. '["bitcoin","ethereum","solana"]'
  investor_type  TEXT    NOT NULL,   -- "hodler" | "day_trader" | "nft_collector"
  content_types  TEXT    NOT NULL,   -- JSON array, e.g. '["news","fun"]'
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | INTEGER UNIQUE FK | Enforces 1:1 with `users` |
| `crypto_assets` | TEXT | JSON-serialised string array of CoinGecko coin IDs |
| `investor_type` | TEXT | Enum enforced in application layer |
| `content_types` | TEXT | JSON-serialised string array |
| `updated_at` | TEXT | Refreshed on every upsert |

**Application-layer validation**:
- `crypto_assets`: must be non-empty array; values must be valid CoinGecko IDs (validated at onboarding step against a known list)
- `investor_type`: must be one of `hodler | day_trader | nft_collector`
- `content_types`: must be non-empty array; values must be one of `news | charts | social | fun`

---

### `votes`

Records one user's vote on one content item. UNIQUE constraint enforces at most one active vote per (user, content item, content type) triple.

```sql
CREATE TABLE IF NOT EXISTS votes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  content_id   TEXT    NOT NULL,   -- external slug or generated stable ID
  content_type TEXT    NOT NULL,   -- "news" | "coin" | "insight" | "meme"
  direction    TEXT    NOT NULL,   -- "up" | "down"
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, content_id, content_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_content ON votes(content_id, content_type);
```

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | INTEGER FK | Voter |
| `content_id` | TEXT | Stable identifier for the content item (see below) |
| `content_type` | TEXT | Discriminator for which section the item belongs to |
| `direction` | TEXT | `up` or `down`; application layer enforces |
| `created_at` | TEXT | Timestamp of the most recent vote action |

**Content ID strategy** (by section):

| Section | `content_type` | `content_id` format |
|---------|---------------|---------------------|
| Market News | `news` | CryptoPanic post `id` field (integer as string) |
| Coin Prices | `coin` | CoinGecko coin `id` (e.g. `"bitcoin"`) |
| AI Insight | `insight` | ISO date string (e.g. `"2026-06-11"`) |
| Fun Meme | `meme` | Reddit post `id` field or static meme index (e.g. `"static-3"`) |

**Vote toggle behaviour** (application layer):
- New vote: `INSERT INTO votes …`
- Change direction: `UPDATE votes SET direction = ? WHERE user_id = ? AND content_id = ? AND content_type = ?`
- Remove vote: `DELETE FROM votes WHERE …`
- Idempotent: `POST /api/votes` uses `INSERT OR REPLACE` semantics

---

### `daily_insights`

Caches the AI-generated insight for each calendar day. Prevents redundant AI API calls.

```sql
CREATE TABLE IF NOT EXISTS daily_insights (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT    NOT NULL UNIQUE,   -- ISO date "YYYY-MM-DD"
  insight_text TEXT    NOT NULL,
  source       TEXT    NOT NULL,          -- "ai" | "static"
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

| Column | Type | Notes |
|--------|------|-------|
| `date` | TEXT UNIQUE | Keyed by UTC calendar date; one row per day |
| `insight_text` | TEXT | The insight paragraph (≤ 500 chars recommended) |
| `source` | TEXT | `ai` = generated by OpenRouter/HuggingFace; `static` = pre-written fallback |

**Cache logic**: On `GET /api/dashboard/insight`, the service:
1. Queries `SELECT * FROM daily_insights WHERE date = ?` (today's UTC date)
2. If row found → return immediately
3. If not → call AI service → insert row with `source = 'ai'` → return
4. If AI call fails → insert row with `source = 'static'` → return static text

---

## Entity Relationships

```
users (1) ──────── (1) user_preferences
  │
  └── (1) ───── (many) votes
```

`daily_insights` has no foreign key — it is a global cache table not tied to any user.

---

## Seed / Initial Data

No seed data required. The server creates all tables on startup. Static fallback JSON files in `backend/src/data/` serve as the functional equivalent of seed data for the dashboard sections.
