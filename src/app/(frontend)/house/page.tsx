import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { getSettings } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The house',
  alternates: { canonical: '/house' },
}

export default async function HousePage() {
  const settings = await getSettings()

  return (
    <section className="house house-page">
      <h1>The house</h1>
      <p>{settings.philosophy || settings.introduction}</p>
      {settings.contactEmail && (
        <p>
          Write to us: <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
        </p>
      )}
      <p>
        <Link href="/books">See our books</Link>
      </p>
    </section>
  )
}
