import type { ReactNode } from 'react'
import FallbackBadge from '../shared/FallbackBadge'
import Spinner from '../shared/Spinner'

interface Props {
  title: string
  isFallback: boolean
  isLoading: boolean
  children: ReactNode
}

export default function DashboardSection({ title, isFallback, isLoading, children }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {!isLoading && isFallback && <FallbackBadge />}
      </div>
      {isLoading ? <Spinner /> : children}
    </section>
  )
}
