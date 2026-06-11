import { useState } from 'react'
import type { MemeItem } from '../../types'
import VoteButtons from '../shared/VoteButtons'

type Direction = 'up' | 'down'

interface Props {
  item: MemeItem
  userVote: Direction | null
  counts: { up: number; down: number }
  onVote: (direction: Direction) => void
}

export default function MemeCard({ item, userVote, counts, onVote }: Props) {
  const [imgError, setImgError] = useState(false)
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
      <a
        href={item.permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-opacity hover:opacity-90"
      >
        {imgError ? (
          <div className="flex min-h-[200px] items-center justify-center bg-gray-900 p-6 text-center">
            <p
              className="text-2xl font-black uppercase leading-tight tracking-wide text-white"
              style={{
                fontFamily: "'Impact', 'Arial Black', 'Haettenschweiler', sans-serif",
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
              }}
            >
              {item.title}
            </p>
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="max-h-80 w-full object-contain bg-gray-100"
            onError={() => setImgError(true)}
          />
        )}
        <div className="px-3 pt-3">
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          <p className="mt-1 text-xs text-indigo-600">View on Reddit →</p>
        </div>
      </a>
      <div className="px-3 pb-1">
        <VoteButtons userVote={userVote} counts={counts} onVote={onVote} />
      </div>
    </div>
  )
}
