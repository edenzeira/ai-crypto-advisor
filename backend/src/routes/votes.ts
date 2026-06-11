import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth'
import db from '../db'

const router = Router()

// GET /api/votes — user's votes + aggregate up/down counts for all content
router.get('/', authMiddleware, (_req: Request, res: Response): void => {
  const userId = _req.userId

  const userVoteRows = db
    .prepare('SELECT content_id, content_type, direction FROM votes WHERE user_id = ?')
    .all(userId) as Array<{ content_id: string; content_type: string; direction: string }>

  const countRows = db
    .prepare(`
      SELECT content_id, content_type, direction, COUNT(*) as count
      FROM votes
      GROUP BY content_id, content_type, direction
    `)
    .all() as Array<{ content_id: string; content_type: string; direction: string; count: number }>

  // Build counts map keyed by `${contentType}:${contentId}`
  const counts: Record<string, { up: number; down: number }> = {}
  for (const row of countRows) {
    const key = `${row.content_type}:${row.content_id}`
    if (!counts[key]) counts[key] = { up: 0, down: 0 }
    counts[key][row.direction as 'up' | 'down'] = row.count
  }

  res.json({
    votes: userVoteRows.map((v) => ({
      contentId: v.content_id,
      contentType: v.content_type,
      direction: v.direction,
    })),
    counts,
  })
})

// POST /api/votes — upsert a vote
router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.userId
  const { contentId, contentType, direction } = req.body as {
    contentId?: string
    contentType?: string
    direction?: string
  }

  if (!contentId || !contentType || (direction !== 'up' && direction !== 'down')) {
    res.status(400).json({ error: 'Invalid vote payload' })
    return
  }

  db.prepare(`
    INSERT INTO votes (user_id, content_id, content_type, direction)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (user_id, content_id, content_type)
    DO UPDATE SET direction = excluded.direction, created_at = datetime('now')
  `).run(userId, contentId, contentType, direction)

  res.json({ ok: true })
})

// DELETE /api/votes/:contentId/:contentType — remove a vote
router.delete('/:contentId/:contentType', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.userId
  const { contentId, contentType } = req.params

  db.prepare(
    'DELETE FROM votes WHERE user_id = ? AND content_id = ? AND content_type = ?',
  ).run(userId, contentId, contentType)

  res.json({ ok: true })
})

export default router
