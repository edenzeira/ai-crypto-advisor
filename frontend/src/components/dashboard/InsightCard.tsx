import type { InsightItem } from '../../types'
import VoteButtons from '../shared/VoteButtons'

type Direction = 'up' | 'down'

interface Props {
  item: InsightItem
  userVote: Direction | null
  counts: { up: number; down: number }
  onVote: (direction: Direction) => void
}

export default function InsightCard({ item, userVote, counts, onVote }: Props) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3">
        {item.source === 'ai' ? (
          <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            ✦ AI generated
          </span>
        ) : (
          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            Pre-written insight
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-gray-800">{item.text}</p>
      <p className="mt-4 text-xs text-gray-400">{item.date}</p>
      <VoteButtons userVote={userVote} counts={counts} onVote={onVote} />
    </div>
  )
}
