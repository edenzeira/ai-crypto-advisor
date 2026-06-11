import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import db from './db'
import { errorHandler } from './middleware/errorHandler'
import authRouter from './routes/auth'
import onboardingRouter from './routes/onboarding'
import dashboardRouter from './routes/dashboard'
import votesRouter from './routes/votes'

const app = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({ origin: FRONTEND_URL, credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/onboarding', onboardingRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/votes', votesRouter)

app.use(errorHandler)

// db is imported for side effects (table creation runs on module load)
void db

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
  console.log(`DB: ${process.env.DATABASE_PATH || './data/database.sqlite'}`)
})
