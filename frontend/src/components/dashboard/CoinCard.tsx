import type { CoinItem } from '../../types'
import VoteButtons from '../shared/VoteButtons'

type Direction = 'up' | 'down'

interface Props {
  item: CoinItem
  userVote: Direction | null
  counts: { up: number; down: number }
  onVote: (direction: Direction) => void
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  if (price >= 1) return `$${price.toFixed(2)}`
  return `$${price.toFixed(4)}`
}

export default function CoinCard({ item, userVote, counts, onVote }: Props) {
  const positive = item.change24h >= 0
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-8 w-8 rounded-full"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">{item.symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{formatPrice(item.price)}</p>
          <p className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? '+' : ''}{item.change24h?.toFixed(2)}%
          </p>
        </div>
      </div>
      <VoteButtons userVote={userVote} counts={counts} onVote={onVote} />
    </div>
  )
}
