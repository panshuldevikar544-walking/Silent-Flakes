import Link from 'next/link'
import React from 'react'

export default function NotFound() {
  return (
    <section className="house">
      <h1>That page is not here</h1>
      <p>
        The book may have been renamed or withdrawn. <Link href="/books">See all our books</Link>.
      </p>
    </section>
  )
}
