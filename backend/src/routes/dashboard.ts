import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import { getNews } from '../services/cryptoPanic'
import { getCoinPrices } from '../services/coinGecko'
import { getDailyInsight } from '../services/aiInsight'
import { getMeme } from '../services/redditMeme'
import db from '../db'

function loadUserPrefs(userId: number) {
  const row = db
    .prepare('SELECT crypto_assets, investor_type, content_types FROM user_preferences WHERE user_id = ?')
    .get(userId) as { crypto_assets: string; investor_type: string; content_types: string } | undefined
  return {
    assets: row ? (JSON.parse(row.crypto_assets) as string[]) : [],
    investorType: row?.investor_type ?? 'long-term',
    contentTypes: row ? (JSON.parse(row.content_types) as string[]) : [],
  }
}

const router = Router()

router.get('/news', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { assets } = loadUserPrefs(req.userId)
  const { data, isFallback } = await getNews(assets)
  res.json({ isFallback, items: data })
})

router.get('/prices', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { data, isFallback } = await getCoinPrices(req.userId)
  res.json({ isFallback, items: data })
})

router.get('/insight', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const prefs = loadUserPrefs(req.userId)
  const { data, isFallback } = await getDailyInsight(prefs)
  res.json({ isFallback, ...data })
})

router.get('/meme', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  const { data, isFallback } = await getMeme()
  res.json({ isFallback, ...data })
})

export default router
