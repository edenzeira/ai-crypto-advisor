interface Asset {
  id: string
  symbol: string
  name: string
}

const ASSETS: Asset[] = [
  { id: 'bitcoin',       symbol: 'BTC',  name: 'Bitcoin'   },
  { id: 'ethereum',      symbol: 'ETH',  name: 'Ethereum'  },
  { id: 'solana',        symbol: 'SOL',  name: 'Solana'    },
  { id: 'binancecoin',   symbol: 'BNB',  name: 'BNB'       },
  { id: 'ripple',        symbol: 'XRP',  name: 'XRP'       },
  { id: 'dogecoin',      symbol: 'DOGE', name: 'Dogecoin'  },
  { id: 'cardano',       symbol: 'ADA',  name: 'Cardano'   },
  { id: 'avalanche-2',   symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot',      symbol: 'DOT',  name: 'Polkadot'  },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon'  },
]

interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
  error?: string
}

export default function AssetSelector({ selected, onChange, error }: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ASSETS.map((asset) => {
          const active = selected.includes(asset.id)
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => toggle(asset.id)}
              className={`flex flex-col items-center rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                active
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-base font-bold">{asset.symbol}</span>
              <span className="mt-0.5 text-xs text-gray-500">{asset.name}</span>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {selected.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">{selected.length} selected</p>
      )}
    </div>
  )
}
