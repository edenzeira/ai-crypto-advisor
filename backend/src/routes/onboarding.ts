import { Router, Request, Response } from 'express'
import db from '../db'
import { authMiddleware } from '../middleware/auth'

const router = Router()

const VALID_INVESTOR_TYPES = ['hodler', 'day_trader', 'nft_collector']
const VALID_CONTENT_TYPES = ['news', 'charts', 'social', 'fun']

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const { cryptoAssets, investorType, contentTypes } = req.body as Record<string, unknown>

  if (!Array.isArray(cryptoAssets) || cryptoAssets.length === 0) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'cryptoAssets must be a non-empty array' })
    return
  }
  if (typeof investorType !== 'string' || !VALID_INVESTOR_TYPES.includes(investorType)) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'investorType must be one of: hodler, day_trader, nft_collector' })
    return
  }
  if (
    !Array.isArray(contentTypes) ||
    contentTypes.length === 0 ||
    !contentTypes.every((t) => VALID_CONTENT_TYPES.includes(t as string))
  ) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'contentTypes must be a non-empty array of: news, charts, social, fun' })
    return
  }

  db.prepare(`
    INSERT INTO user_preferences (user_id, crypto_assets, investor_type, content_types, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT (user_id) DO UPDATE SET
      crypto_assets = excluded.crypto_assets,
      investor_type = excluded.investor_type,
      content_types = excluded.content_types,
      updated_at    = excluded.updated_at
  `).run(req.userId, JSON.stringify(cryptoAssets), investorType, JSON.stringify(contentTypes))

  db.prepare('UPDATE users SET onboarding_complete = 1 WHERE id = ?').run(req.userId)

  res.json({
    preferences: { cryptoAssets, investorType, contentTypes },
  })
})

export default router
