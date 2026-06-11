import db from '../db'
import fallbackPrices from '../data/fallback-prices.json'
import type { DashboardCoinItem } from '../types'

function getUserPreferredIds(userId: number): string[] {
  const row = db
    .prepare('SELECT crypto_assets FROM user_preferences WHERE user_id = ?')
    .get(userId) as { crypto_assets: string } | undefined
  return row ? (JSON.parse(row.crypto_assets) as string[]) : []
}

function sortByPreferred(coins: DashboardCoinItem[], preferredIds: string[]): DashboardCoinItem[] {
  if (preferredIds.length === 0) return coins
  return [...coins].sort((a, b) => {
    const ai = preferredIds.indexOf(a.id)
    const bi = preferredIds.indexOf(b.id)
    if (ai !== -1 && bi === -1) return -1
    if (ai === -1 && bi !== -1) return 1
    if (ai !== -1 && bi !== -1) return ai - bi
    return 0
  })
}

export async function getCoinPrices(userId: number): Promise<{ data: DashboardCoinItem[]; isFallback: boolean }> {
  const preferredIds = getUserPreferredIds(userId)

  try {
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets')
    url.searchParams.set('vs_currency', 'usd')
    url.searchParams.set('order', 'market_cap_desc')
    url.searchParams.set('per_page', '20')
    url.searchParams.set('sparkline', 'false')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`CoinGecko responded with ${res.status}`)

    const raw = (await res.json()) as Array<{
      id: string; name: string; symbol: string;
      current_price: number; price_change_percentage_24h: number; image: string
    }>

    const coins: DashboardCoinItem[] = raw.map((c) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      price: c.current_price,
      change24h: c.price_change_percentage_24h,
      imageUrl: c.image,
    }))

    return { data: sortByPreferred(coins, preferredIds), isFallback: false }
  } catch {
    return { data: sortByPreferred(fallbackPrices, preferredIds), isFallback: true }
  }
}
