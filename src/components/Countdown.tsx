'use client'

import React, { useEffect, useState } from 'react'

export function Countdown({ date }: { date: string }) {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setLeft(new Date(date).getTime() - Date.now())
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [date])

  if (left === null || left <= 0) return null

  const seconds = Math.floor(left / 1000)
  const parts = [
    ['days', Math.floor(seconds / 86400)],
    ['hours', Math.floor(seconds / 3600) % 24],
    ['minutes', Math.floor(seconds / 60) % 60],
    ['seconds', seconds % 60],
  ] as const

  return (
    <dl className="countdown" aria-label="Time until launch">
      {parts.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
