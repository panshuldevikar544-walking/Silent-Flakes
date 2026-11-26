import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/fraunces/full-italic.css'
import '@fontsource-variable/literata/opsz.css'
import '@fontsource-variable/literata/opsz-italic.css'
import '@fontsource-variable/schibsted-grotesk'
import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { Flake } from '@/components/Flake'
import { Motion } from '@/components/Motion'
import { PageTransition } from '@/components/PageTransition'
import { SiteNav } from '@/components/SiteNav'

import './styles.css'

// The address search engines and link previews are given. SITE_URL wins (for a custom domain),
// then the address Vercel provides for the live site.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
const siteUrl =
  process.env.SITE_URL || (vercelHost ? `https://${vercelHost}` : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Silent Flakes, a publishing house', template: '%s | Silent Flakes' },
  description: 'Silent Flakes is an independent publishing house.',
  openGraph: { siteName: 'Silent Flakes', type: 'website' },
}

// Before the page is drawn: hide what will animate in.
const motionScript = `document.documentElement.classList.add('motion')`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link href="/" className="wordmark">
            <Flake />
            Silent Flakes
          </Link>
          <p className="site-tagline">Independent publishing house</p>
          <SiteNav />
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="footer-top">
            <Link href="/" className="wordmark footer-wordmark">
              <Flake />
              Silent Flakes
            </Link>
            <p>Books that arrive quietly, and stay.</p>
          </div>
          <div className="footer-row">
            <nav aria-label="Footer">
              <Link href="/">Home</Link>
              <Link href="/books">Books</Link>
              <Link href="/house">The house</Link>
            </nav>
            <p>© {new Date().getFullYear()} Silent Flakes. Books are sold by the stores linked on each page.</p>
          </div>
        </footer>
        <Motion />
        <PageTransition />
      </body>
    </html>
  )
}
