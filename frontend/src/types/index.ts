export interface User {
  id: number
  name: string
  email: string
  onboardingComplete: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Preferences {
  cryptoAssets: string[]
  investorType: 'hodler' | 'day_trader' | 'nft_collector'
  contentTypes: Array<'news' | 'charts' | 'social' | 'fun'>
}

export interface NewsItem {
  id: string
  title: string
  source: string
  publishedAt: string
  url: string
}

export interface CoinItem {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  imageUrl: string
}

export interface InsightItem {
  id: string
  text: string
  date: string
  source: 'ai' | 'static'
}

export interface MemeItem {
  id: string
  title: string
  imageUrl: string
  permalink: string
}

export interface DashboardResponse<T> {
  isFallback: boolean
  items: T[]
}

export interface Vote {
  contentId: string
  contentType: 'news' | 'coin' | 'insight' | 'meme'
  direction: 'up' | 'down'
}
