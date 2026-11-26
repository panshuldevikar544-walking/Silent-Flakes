'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const links = [
  { href: '/', label: 'Home' },
  { href: '/books', label: 'Books' },
  { href: '/house', label: 'The house' },
]

/** Main menu; the page you are on is marked for screen readers and underlined. */
export function SiteNav() {
  const path = usePathname()
  return (
    <nav aria-label="Main">
      {links.map(({ href, label }) => {
        const current = href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`)
        return (
          <Link key={href} href={href} aria-current={current ? 'page' : undefined}>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
