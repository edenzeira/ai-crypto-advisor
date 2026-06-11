# API Contract: AI Crypto Advisor Dashboard

**Base URL (local)**: `http://localhost:3001`
**Base URL (production)**: `https://<your-backend>.onrender.com`
**Content-Type**: `application/json` for all requests and responses
**Auth**: `Authorization: Bearer <jwt>` header required on all protected routes (marked 🔒)

---

## Authentication

### POST /api/auth/register

Create a new account.

**Request body**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "securePassword123"
}
```

**Success — 201**
```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "onboardingComplete": false
  }
}
```

**Errors**

| Status | `error` value | Meaning |
|--------|--------------|---------|
| 400 | `"VALIDATION_ERROR"` | Missing or invalid fields |
| 409 | `"EMAIL_TAKEN"` | Email already registered |

---

### POST /api/auth/login

Authenticate an existing user.

**Request body**
```json
{
  "email": "alice@example.com",
  "password": "securePassword123"
}
```

**Success — 200**
```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "onboardingComplete": true
  }
}
```

**Errors**

| Status | `error` value | Meaning |
|--------|--------------|---------|
| 400 | `"VALIDATION_ERROR"` | Missing fields |
| 401 | `"INVALID_CREDENTIALS"` | Wrong email or password |

---

### GET /api/auth/me 🔒

Return the currently authenticated user.

**Success — 200**
```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "onboardingComplete": true
}
```

**Errors**

| Status | `error` value | Meaning |
|--------|--------------|---------|
| 401 | `"UNAUTHORIZED"` | Missing or expired JWT |

---

## Onboarding

### POST /api/onboarding 🔒

Save user preferences and mark onboarding complete. Idempotent — safe to call again to update preferences (though UI prevents this in MVP).

**Request body**
```json
{
  "cryptoAssets": ["bitcoin", "ethereum", "solana"],
  "investorType": "hodler",
  "contentTypes": ["news", "fun"]
}
```

**Valid values**:
- `investorType`: `"hodler"` | `"day_trader"` | `"nft_collector"`
- `contentTypes` items: `"news"` | `"charts"` | `"social"` | `"fun"`
- `cryptoAssets` items: any valid CoinGecko coin ID

**Success — 200**
```json
{
  "preferences": {
    "cryptoAssets": ["bitcoin", "ethereum", "solana"],
    "investorType": "hodler",
    "contentTypes": ["news", "fun"]
  }
}
```

**Errors**

| Status | `error` value | Meaning |
|--------|--------------|---------|
| 400 | `"VALIDATION_ERROR"` | Empty assets array or invalid enum value |
| 401 | `"UNAUTHORIZED"` | Missing or expired JWT |

---

## Dashboard

All four dashboard endpoints return a `isFallback: boolean` field at the top level. When `true`, the frontend renders a `FallbackBadge`.

---

### GET /api/dashboard/news 🔒

Fetch market news headlines.

**Success — 200**
```json
{
  "isFallback": false,
  "items": [
    {
      "id": "123456",
      "title": "Bitcoin surges past $70k on ETF inflows",
      "source": "CoinDesk",
      "publishedAt": "2026-06-11T08:30:00Z",
      "url": "https://coindesk.com/..."
    }
  ]
}
```

Minimum 5 items guaranteed (fallback supplies 8 items if API unavailable).

---

### GET /api/dashboard/prices 🔒

Fetch current coin prices. User's preferred coins appear first; remainder sorted by market cap.

**Success — 200**
```json
{
  "isFallback": false,
  "items": [
    {
      "id": "bitcoin",
      "name": "Bitcoin",
      "symbol": "BTC",
      "price": 67430.21,
      "change24h": 2.34,
      "imageUrl": "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png"
    }
  ]
}
```

Minimum 10 items guaranteed.

---

### GET /api/dashboard/insight 🔒

Fetch the AI insight of the day (cached; same response for all users on same calendar day).

**Success — 200**
```json
{
  "isFallback": false,
  "id": "2026-06-11",
  "text": "Today's crypto landscape shows renewed institutional interest in Bitcoin as spot ETF inflows hit a weekly high. Altcoins remain volatile; consider risk management before entering new positions.",
  "date": "2026-06-11",
  "source": "ai"
}
```

`source`: `"ai"` | `"static"`. Always returns 200 — never empty.

---

### GET /api/dashboard/meme 🔒

Fetch a fun crypto meme.

**Success — 200**
```json
{
  "isFallback": false,
  "id": "abc123",
  "title": "Me checking my portfolio every 5 minutes",
  "imageUrl": "https://i.redd.it/abc123.jpg",
  "permalink": "https://reddit.com/r/CryptoCurrency/comments/abc123"
}
```

Always returns 200 — never empty.

---

## Votes

### GET /api/votes 🔒

Return all votes cast by the authenticated user. Called once on dashboard mount to restore UI state.

**Success — 200**
```json
{
  "votes": [
    {
      "contentId": "123456",
      "contentType": "news",
      "direction": "up"
    },
    {
      "contentId": "bitcoin",
      "contentType": "coin",
      "direction": "down"
    }
  ]
}
```

---

### POST /api/votes 🔒

Cast or change a vote. If a vote already exists for this (contentId, contentType) pair, it is replaced.

**Request body**
```json
{
  "contentId": "123456",
  "contentType": "news",
  "direction": "up"
}
```

**Valid values**:
- `contentType`: `"news"` | `"coin"` | `"insight"` | `"meme"`
- `direction`: `"up"` | `"down"`

**Success — 200**
```json
{
  "vote": {
    "contentId": "123456",
    "contentType": "news",
    "direction": "up"
  }
}
```

**Errors**

| Status | `error` value | Meaning |
|--------|--------------|---------|
| 400 | `"VALIDATION_ERROR"` | Invalid contentType or direction |
| 401 | `"UNAUTHORIZED"` | Missing or expired JWT |

---

### DELETE /api/votes/:contentId/:contentType 🔒

Remove an existing vote (toggle off).

**URL params**: `contentId` (string), `contentType` (`news` | `coin` | `insight` | `meme`)

**Success — 200**
```json
{ "success": true }
```

Returns 200 (not 404) if no vote existed — operation is idempotent.

**Errors**

| Status | `error` value | Meaning |
|--------|--------------|---------|
| 401 | `"UNAUTHORIZED"` | Missing or expired JWT |

---

## Error Response Shape

All error responses share this structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

`message` is safe to display to the user. `error` is the machine-readable code for frontend logic.

---

## CORS Policy

The backend allows requests only from the configured `FRONTEND_URL` origin (env var). In development: `http://localhost:5173`. All other origins receive a CORS rejection.
