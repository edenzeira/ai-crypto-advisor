import fallbackMemes from '../data/fallback-memes.json'
import type { DashboardMeme } from '../types'

export async function getMeme(): Promise<{ data: DashboardMeme; isFallback: boolean }> {
  try {
    const res = await fetch('https://www.reddit.com/r/CryptoCurrency/hot.json?limit=20', {
      headers: { 'User-Agent': 'crypto-advisor-app/1.0 (assignment)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      const errorText = await res.text()
      console.error('Reddit error:', res.status, errorText)
      throw new Error(`Reddit responded with ${res.status}`)
    }

    const json = (await res.json()) as {
      data: { children: Array<{ data: { id: string; title: string; url: string; permalink: string; post_hint?: string } }> }
    }

    const imagePosts = json.data.children
      .map((c) => c.data)
      .filter((p) => p.post_hint === 'image' || /\.(jpg|jpeg|png|gif)$/i.test(p.url))
      .slice(0, 5)

    if (imagePosts.length === 0) throw new Error('No image posts found')

    const post = imagePosts[Math.floor(Math.random() * imagePosts.length)]
    const postPermalink = post.permalink.startsWith('http')
      ? post.permalink
      : `https://www.reddit.com${post.permalink}`
    return {
      data: {
        id: post.id,
        title: post.title,
        imageUrl: post.url,
        permalink: postPermalink,
      },
      isFallback: false,
    }
  }catch (error) {
      console.error('Reddit request failed:', error)
      const random = fallbackMemes[Math.floor(Math.random() * fallbackMemes.length)]
      return { data: random, isFallback: true }
    }
}
