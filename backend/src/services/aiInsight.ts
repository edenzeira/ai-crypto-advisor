import db from '../db'
import fallbackInsights from '../data/fallback-insights.json'
import type { DashboardInsight } from '../types'

export interface UserPrefs {
  assets: string[]
  investorType: string
  contentTypes: string[]
}

interface CachedRow { date: string; insight_text: string; source: string }

const INVESTOR_LABELS: Record<string, string> = {
  'long-term':  'long-term holder',
  'short-term': 'active trader',
  'defi':       'DeFi enthusiast',
  'nft':        'NFT collector',
}

function buildPrompt(prefs: UserPrefs): string {
  const assetList = prefs.assets.length > 0 ? prefs.assets.join(', ') : 'major cryptocurrencies'
  const investorLabel = INVESTOR_LABELS[prefs.investorType] ?? prefs.investorType
  return (
    `You are a professional crypto market analyst. Write a brief daily market insight for a ${investorLabel} ` +
    `focused on ${assetList}. Cover notable trends or price movements today and give a clear, actionable ` +
    `takeaway tailored to their profile. Plain text only — no markdown, no bullet points. 2–3 sentences.`
  )
}

// Stored in the `date` column to serve as unique cache key per profile per day.
// Format: "YYYY-MM-DD:investorType:asset1,asset2"
function buildCacheKey(today: string, prefs: UserPrefs): string {
  const sortedAssets = [...prefs.assets].sort().join(',')
  return `${today}:${prefs.investorType}:${sortedAssets}`
}

function buildFallback(prefs: UserPrefs): string {
  const base = fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)]
  const assetList = prefs.assets.length > 0 ? prefs.assets.join(', ') : 'your preferred assets'
  const investorLabel = INVESTOR_LABELS[prefs.investorType] ?? prefs.investorType
  return `${base.text} As a ${investorLabel} focused on ${assetList}, keep a close eye on volatility in your key positions.`
}

async function tryOpenRouter(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  console.log('tryOpenRouter called')
  console.log('OPENROUTER_API_KEY exists:', !!apiKey)
  if (!apiKey) return null
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Crypto Advisor',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      const errorText = await res.text()
      console.error('OpenRouter error:', res.status, errorText)
      return null
    }
    const json = (await res.json()) as { choices: [{ message: { content: string } }] }
    console.log('OpenRouter response:', JSON.stringify(json).slice(0, 500))
    return json.choices[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

async function tryHuggingFace(prompt: string): Promise<string | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 250 } }),
        signal: AbortSignal.timeout(15000),
      },
    )
    if (!res.ok) return null
    const json = (await res.json()) as [{ generated_text?: string }]
    const raw = json[0]?.generated_text ?? ''
    return raw.replace(prompt, '').trim() || null
  } catch {
    return null
  }
}

export async function getDailyInsight(
  prefs: UserPrefs,
): Promise<{ data: DashboardInsight; isFallback: boolean }> {
  console.log('getDailyInsight called', prefs)
  const today = new Date().toISOString().slice(0, 10)
  // Cache key stored in the `date` column — unique per profile per day
  const cacheKey = buildCacheKey(today, prefs)

  const cached = db
    .prepare('SELECT date, insight_text, source FROM daily_insights WHERE date = ?')
    .get(cacheKey) as CachedRow | undefined

  if (cached) {
    return {
      data: { id: cacheKey, text: cached.insight_text, date: today, source: cached.source as 'ai' | 'static' },
      isFallback: cached.source === 'static',
    }
  }

  const prompt = buildPrompt(prefs)
  let text = await tryOpenRouter(prompt)
  let source: 'ai' | 'static' = 'ai'

  if (!text) text = await tryHuggingFace(prompt)

  if (!text) {
    text = buildFallback(prefs)
    source = 'static'
  }

  db.prepare(
    'INSERT OR IGNORE INTO daily_insights (date, insight_text, source) VALUES (?, ?, ?)',
  ).run(cacheKey, text, source)

  return { data: { id: cacheKey, text, date: today, source }, isFallback: source === 'static' }
}
