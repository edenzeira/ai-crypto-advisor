import fallbackNews from '../data/fallback-news.json'
import type { DashboardNewsItem } from '../types'

// Keywords to match CoinGecko asset IDs against news titles
const ASSET_KEYWORDS: Record<string, string[]> = {
  bitcoin:      ['bitcoin', 'btc'],
  ethereum:     ['ethereum', 'eth'],
  solana:       ['solana', 'sol'],
  cardano:      ['cardano', 'ada'],
  binancecoin:  ['bnb', 'binance'],
  ripple:       ['ripple', 'xrp'],
  dogecoin:     ['dogecoin', 'doge'],
  polkadot:     ['polkadot', 'dot'],
  avalanche:    ['avalanche', 'avax'],
  chainlink:    ['chainlink', 'link'],
}

function titleMatchesAsset(title: string, assetId: string): boolean {
  const lower = title.toLowerCase()
  const keywords = ASSET_KEYWORDS[assetId] ?? [assetId]
  return keywords.some((kw) => lower.includes(kw))
}

function prioritiseByAssets(
  items: DashboardNewsItem[],
  preferredAssets: string[],
): DashboardNewsItem[] {
  if (preferredAssets.length === 0) return items
  const preferred: DashboardNewsItem[] = []
  const rest: DashboardNewsItem[] = []
  for (const item of items) {
    if (preferredAssets.some((a) => titleMatchesAsset(item.title, a))) {
      preferred.push(item)
    } else {
      rest.push(item)
    }
  }
  return [...preferred, ...rest]
}

export async function getNews(
  preferredAssets: string[] = [],
): Promise<{ data: DashboardNewsItem[]; isFallback: boolean }> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY
  if (!apiKey) {
    return { data: prioritiseByAssets(fallbackNews, preferredAssets), isFallback: true }
  }

  try {
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&public=true&kind=news`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`CryptoPanic responded with ${res.status}`)

    const json = (await res.json()) as {
      results: Array<{ id: number; title: string; url: string; published_at: string; source?: { title?: string } }>
    }

    const items: DashboardNewsItem[] = json.results.slice(0, 8).map((p) => ({
      id: String(p.id),
      title: p.title,
      source: p.source?.title ?? 'CryptoPanic',
      publishedAt: p.published_at,
      url: p.url,
    }))

    return { data: prioritiseByAssets(items, preferredAssets), isFallback: false }
  } catch {
    return { data: prioritiseByAssets(fallbackNews, preferredAssets), isFallback: true }
  }
}
