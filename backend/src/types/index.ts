// ── DB row types ──────────────────────────────────────────────────────────────

export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  onboarding_complete: number  // 0 | 1  (SQLite boolean)
  created_at: string
}

export interface UserPreference {
  id: number
  user_id: number
  crypto_assets: string  // JSON-serialised string[]
  investor_type: string
  content_types: string  // JSON-serialised string[]
  updated_at: string
}

export interface Vote {
  id: number
  user_id: number
  content_id: string
  content_type: string
  direction: string
  created_at: string
}

export interface DailyInsight {
  id: number
  date: string
  insight_text: string
  source: string
  created_at: string
}

// ── Dashboard API response shapes ─────────────────────────────────────────────

export interface DashboardNewsItem {
  id: string
  title: string
  source: string
  publishedAt: string
  url: string
}

export interface DashboardCoinItem {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  imageUrl: string
}

export interface DashboardInsight {
  id: string
  text: string
  date: string
  source: 'ai' | 'static'
}

export interface DashboardMeme {
  id: string
  title: string
  imageUrl: string
  permalink: string
}

export interface DashboardResponse<T> {
  isFallback: boolean
  data: T
}

// ── Express Request augmentation ──────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      userId: number
    }
  }
}
