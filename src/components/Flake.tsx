import React from 'react'

/** The house mark: a six-armed snowflake, drawn in the current text colour. */
export function Flake({ className = 'flake' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        {[0, 60, 120].map((turn) => (
          <g key={turn} transform={`rotate(${turn} 12 12)`}>
            <path d="M12 2v20M9 4.5l3 2.5 3-2.5M9 19.5l3-2.5 3 2.5" />
          </g>
        ))}
      </g>
    </svg>
  )
}
