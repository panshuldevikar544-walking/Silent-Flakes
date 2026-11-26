import '@fontsource-variable/literata'
import '@fontsource-variable/schibsted-grotesk'
import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import './styles.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: { default: 'Silent Flakes, a publishing house', template: '%s | Silent Flakes' },
  description: 'Silent Flakes is an independent publishing house.',
  openGraph: { siteName: 'Silent Flakes', type: 'website' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link href="/" className="wordmark">
            Silent Flakes
          </Link>
          <nav aria-label="Main">
            <Link href="/#books">Books</Link>
            <Link href="/#house">The house</Link>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <p className="wordmark">Silent Flakes</p>
          <p>© {new Date().getFullYear()} Silent Flakes. Books are sold by the stores linked on each page.</p>
        </footer>
      </body>
    </html>
  )
}
