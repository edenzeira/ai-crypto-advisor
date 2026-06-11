import { useState, useCallback } from 'react'
import api from '../services/api'

type Direction = 'up' | 'down'

export interface VoteCounts { up: number; down: number }

interface VotesState {
  userVotes: Record<string, Direction>       // key: `${contentType}:${contentId}`
  counts: Record<string, VoteCounts>         // same key
}

export function useVotes() {
  const [state, setState] = useState<VotesState>({ userVotes: {}, counts: {} })

  const loadVotes = useCallback(async () => {
    try {
      const res = await api.get<{
        votes: Array<{ contentId: string; contentType: string; direction: Direction }>
        counts: Record<string, VoteCounts>
      }>('/api/votes')
      const userVotes: Record<string, Direction> = {}
      for (const v of res.data.votes) {
        userVotes[`${v.contentType}:${v.contentId}`] = v.direction
      }
      setState({ userVotes, counts: res.data.counts })
    } catch {
      // leave state unchanged if the request fails
    }
  }, [])

  const vote = useCallback(
    (contentType: string, contentId: string, direction: Direction) => {
      const key = `${contentType}:${contentId}`
      const currentDir = state.userVotes[key] ?? null

      // Optimistic update
      setState((s) => {
        const prevDir = s.userVotes[key]
        const base = s.counts[key] ?? { up: 0, down: 0 }
        const newCounts = { ...base }
        const newUserVotes = { ...s.userVotes }

        if (prevDir === direction) {
          // Toggle off
          newCounts[direction] = Math.max(0, newCounts[direction] - 1)
          delete newUserVotes[key]
        } else {
          if (prevDir) newCounts[prevDir] = Math.max(0, newCounts[prevDir] - 1)
          newCounts[direction] = (newCounts[direction] ?? 0) + 1
          newUserVotes[key] = direction
        }

        return { userVotes: newUserVotes, counts: { ...s.counts, [key]: newCounts } }
      })

      const apiCall =
        currentDir === direction
          ? api.delete(`/api/votes/${encodeURIComponent(contentId)}/${contentType}`)
          : api.post('/api/votes', { contentId, contentType, direction })

      apiCall.catch(() => loadVotes()) // revert via server on error
    },
    [state.userVotes, loadVotes],
  )

  const userVote = useCallback(
    (contentType: string, contentId: string): Direction | null =>
      state.userVotes[`${contentType}:${contentId}`] ?? null,
    [state.userVotes],
  )

  const getCounts = useCallback(
    (contentType: string, contentId: string): VoteCounts =>
      state.counts[`${contentType}:${contentId}`] ?? { up: 0, down: 0 },
    [state.counts],
  )

  return { userVote, getCounts, vote, loadVotes }
}
