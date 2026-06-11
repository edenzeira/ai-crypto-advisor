import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import DashboardSection from '../components/dashboard/DashboardSection'
import ErrorBoundary from '../components/shared/ErrorBoundary'
import NewsCard from '../components/dashboard/NewsCard'
import CoinCard from '../components/dashboard/CoinCard'
import InsightCard from '../components/dashboard/InsightCard'
import MemeCard from '../components/dashboard/MemeCard'
import api from '../services/api'
import { useVotes } from '../hooks/useVotes'
import type { NewsItem, CoinItem, InsightItem, MemeItem } from '../types'

type NewsResponse    = { isFallback: boolean; items: NewsItem[] }
type PricesResponse  = { isFallback: boolean; items: CoinItem[] }
type InsightResponse = InsightItem & { isFallback: boolean }
type MemeResponse    = MemeItem    & { isFallback: boolean }

interface Section<T> { data: T | null; isLoading: boolean; isFallback: boolean }

function init<T>(): Section<T> {
  return { data: null, isLoading: true, isFallback: false }
}

export default function DashboardPage() {
  const [news,    setNews]    = useState<Section<NewsItem[]>>(init())
  const [prices,  setPrices]  = useState<Section<CoinItem[]>>(init())
  const [insight, setInsight] = useState<Section<InsightItem>>(init())
  const [meme,    setMeme]    = useState<Section<MemeItem>>(init())

  const { userVote, getCounts, vote, loadVotes } = useVotes()

  useEffect(() => {
    loadVotes()

    api.get<NewsResponse>('/api/dashboard/news')
      .then((r) => setNews({ data: r.data.items, isFallback: r.data.isFallback, isLoading: false }))
      .catch(() => setNews((s) => ({ ...s, isLoading: false })))

    api.get<PricesResponse>('/api/dashboard/prices')
      .then((r) => setPrices({ data: r.data.items, isFallback: r.data.isFallback, isLoading: false }))
      .catch(() => setPrices((s) => ({ ...s, isLoading: false })))

    api.get<InsightResponse>('/api/dashboard/insight')
      .then((r) => {
        const { isFallback, ...item } = r.data
        setInsight({ data: item as InsightItem, isFallback, isLoading: false })
      })
      .catch(() => setInsight((s) => ({ ...s, isLoading: false })))

    api.get<MemeResponse>('/api/dashboard/meme')
      .then((r) => {
        const { isFallback, ...item } = r.data
        setMeme({ data: item as MemeItem, isFallback, isLoading: false })
      })
      .catch(() => setMeme((s) => ({ ...s, isLoading: false })))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Your Daily Dashboard</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          <ErrorBoundary>
            <DashboardSection title="Market News" isFallback={news.isFallback} isLoading={news.isLoading}>
              {news.data ? (
                <div className="space-y-3">
                  {news.data.map((item) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      userVote={userVote('news', item.id)}
                      counts={getCounts('news', item.id)}
                      onVote={(dir) => vote('news', item.id, dir)}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">Could not load news.</p>
              )}
            </DashboardSection>
          </ErrorBoundary>

          <ErrorBoundary>
            <DashboardSection title="Coin Prices" isFallback={prices.isFallback} isLoading={prices.isLoading}>
              {prices.data ? (
                <div className="space-y-2">
                  {prices.data.map((item) => (
                    <CoinCard
                      key={item.id}
                      item={item}
                      userVote={userVote('coin', item.id)}
                      counts={getCounts('coin', item.id)}
                      onVote={(dir) => vote('coin', item.id, dir)}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">Could not load prices.</p>
              )}
            </DashboardSection>
          </ErrorBoundary>

          <ErrorBoundary>
            <DashboardSection title="AI Insight of the Day" isFallback={insight.isFallback} isLoading={insight.isLoading}>
              {insight.data ? (
                <InsightCard
                  item={insight.data}
                  userVote={userVote('insight', insight.data.id)}
                  counts={getCounts('insight', insight.data.id)}
                  onVote={(dir) => vote('insight', insight.data!.id, dir)}
                />
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">Could not load insight.</p>
              )}
            </DashboardSection>
          </ErrorBoundary>

          <ErrorBoundary>
            <DashboardSection title="Crypto Meme of the Day" isFallback={meme.isFallback} isLoading={meme.isLoading}>
              {meme.data ? (
                <MemeCard
                  item={meme.data}
                  userVote={userVote('meme', meme.data.id)}
                  counts={getCounts('meme', meme.data.id)}
                  onVote={(dir) => vote('meme', meme.data!.id, dir)}
                />
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">Could not load meme.</p>
              )}
            </DashboardSection>
          </ErrorBoundary>

        </div>
      </div>
    </AppLayout>
  )
}
