interface InvestorType {
  id: string
  label: string
  icon: string
  description: string
}

const INVESTOR_TYPES: InvestorType[] = [
  { id: 'hodler',        label: 'HODLer',        icon: '💎', description: 'Buy and hold for the long term' },
  { id: 'day_trader',    label: 'Day Trader',     icon: '📈', description: 'Active trading, short-term gains' },
  { id: 'nft_collector', label: 'NFT Collector',  icon: '🎨', description: 'Digital art and collectibles' },
]

interface Props {
  selected: string
  onChange: (selected: string) => void
}

export default function InvestorTypeSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {INVESTOR_TYPES.map((type) => {
        const active = selected === type.id
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={`flex flex-col items-center rounded-lg border-2 px-4 py-5 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
              active
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="mb-2 text-3xl">{type.icon}</span>
            <span className={`text-sm font-semibold ${active ? 'text-indigo-700' : 'text-gray-900'}`}>
              {type.label}
            </span>
            <span className="mt-1 text-xs text-gray-500">{type.description}</span>
          </button>
        )
      })}
    </div>
  )
}
