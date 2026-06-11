import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db'
import { authMiddleware } from '../middleware/auth'
import type { User } from '../types'

const router = Router()

function signToken(userId: number): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    onboardingComplete: user.onboarding_complete === 1,
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): void => {
  const { name, email, password } = req.body as Record<string, unknown>

  if (
    typeof name !== 'string' || name.trim() === '' ||
    typeof email !== 'string' || email.trim() === '' ||
    typeof password !== 'string' || password.trim() === ''
  ) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'name, email, and password are required' })
    return
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid email format' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim())
  if (existing) {
    res.status(409).json({ error: 'EMAIL_TAKEN', message: 'An account with this email already exists' })
    return
  }

  const passwordHash = bcrypt.hashSync(password, 12)
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name.trim(), email.toLowerCase().trim(), passwordHash)

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User
  const token = signToken(user.id)
  res.status(201).json({ token, user: toPublicUser(user) })
})

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body as Record<string, unknown>

  if (typeof email !== 'string' || email.trim() === '' || typeof password !== 'string' || password.trim() === '') {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'email and password are required' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as User | undefined
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' })
    return
  }

  const token = signToken(user.id)
  res.json({ token, user: toPublicUser(user) })
})

// GET /api/auth/me
router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as User | undefined
  if (!user) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' })
    return
  }
  res.json(toPublicUser(user))
})

export default router
