interface ContentType {
  id: string
  label: string
  icon: string
}

const CONTENT_TYPES: ContentType[] = [
  { id: 'news',   label: 'Market News', icon: '📰' },
  { id: 'charts', label: 'Charts',      icon: '📊' },
  { id: 'social', label: 'Social',      icon: '💬' },
  { id: 'fun',    label: 'Fun',         icon: '😂' },
]

interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
  error?: string
}

export default function ContentTypeSelector({ selected, onChange, error }: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {CONTENT_TYPES.map((ct) => {
          const active = selected.includes(ct.id)
          return (
            <button
              key={ct.id}
              type="button"
              onClick={() => toggle(ct.id)}
              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                active
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{ct.icon}</span>
              <span>{ct.label}</span>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
