import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Authors } from './collections/Authors'
import { Genres } from './collections/Genres'
import { Books } from './collections/Books'
import { Events } from './collections/Events'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// A file database on your computer, Postgres when hosted.
const databaseUrl = process.env.DATABASE_URL || ''
const hosted = databaseUrl.startsWith('postgres')
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' | Silent Flakes' },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Books, Authors, Genres, Media, Events, Users],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: hosted
    ? postgresAdapter({
        pool: { connectionString: databaseUrl },
        migrationDir: path.resolve(dirname, 'migrations'),
      })
    : sqliteAdapter({ client: { url: databaseUrl } }),
  sharp,
  plugins: [
    // Hosted servers have no lasting disk, so uploaded images go to Vercel Blob.
    vercelBlobStorage({
      enabled: Boolean(blobToken),
      collections: { media: true },
      token: blobToken,
    }),
  ],
})
