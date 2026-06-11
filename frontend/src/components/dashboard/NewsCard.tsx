import type { NewsItem } from '../../types'
import VoteButtons from '../shared/VoteButtons'

type Direction = 'up' | 'down'

interface Props {
  item: NewsItem
  userVote: Direction | null
  counts: { up: number; down: number }
  onVote: (direction: Direction) => void
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NewsCard({ item, userVote, counts, onVote }: Props) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-opacity hover:opacity-80"
      >
        <p className="text-sm font-medium leading-snug text-gray-900">{item.title}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span>{item.source}</span>
          <span>·</span>
          <span>{relativeTime(item.publishedAt)}</span>
        </div>
      </a>
      <VoteButtons userVote={userVote} counts={counts} onVote={onVote} />
    </div>
  )
}
