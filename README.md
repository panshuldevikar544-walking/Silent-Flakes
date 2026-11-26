# Silent Flakes

Website for the Silent Flakes publishing house. Visitors browse books; buying happens on
Amazon, Flipkart or another store. The site takes no payments.

Next.js (App Router) with the Payload CMS dashboard in the same app, SQLite for local use,
React Three Fiber for the 3D books.

## Run it

Needs Node `^22.23.5`, `^24.22.3` or `>=26.13.1`.

```
npm install
# create .env with DATABASE_URL=file:./silent-flakes.db and PAYLOAD_SECRET=<long random text>
npm run seed     # placeholder books, only on an empty database
npm run dev      # http://localhost:3000, dashboard at /admin
```

The first account created at `/admin` becomes the administrator. Create it straight away:
until it exists, anyone who can reach the server can create it.

## Hosting on Vercel

Set these environment variables in the Vercel project (never commit them):

- `DATABASE_URL`: a Postgres connection string
- `PAYLOAD_SECRET`: a new long random value, not the local one
- `BLOB_READ_WRITE_TOKEN`: added by Vercel when a Blob store is connected

Vercel runs `vercel-build`, which applies the migrations in `src/migrations` and then builds.
After changing content fields, create a migration with a Postgres `DATABASE_URL`:
`npm run payload -- migrate:create`.

Open `/admin` immediately after the first deployment and create the administrator.

## Add a book

In the dashboard: add the author (Authors), then the book (Books). Upload the cover, pick the
cover colour, add the store links (`https` only) and set visibility to Published. The 3D book,
page colour and shelf spine are made from those fields. Without a cover image, a plain
typographic cover is drawn.

## Where things are

| Path | What |
| --- | --- |
| `src/collections`, `src/globals` | Content fields and who can read or change them |
| `src/app/(frontend)` | Public pages and styles |
| `src/app/go` | Buy-link redirect that counts clicks (clicks, not sales; no cookies) |
| `src/components` | 3D book, countdown |
| `blender/` | Script for the book parts; `npm run models` rebuilds them (Blender 5.3) |

## Checks

```
npm run lint
npm run build
```

## Not done yet

Catalogue search and filters, author pages, page-turning previews, analytics screen, sitemap
and robots file, accessibility and speed testing, hosting setup (Postgres, file storage,
email for password resets, database migrations).

## Licences

Fonts: Schibsted Grotesk and Literata (SIL OFL). GSAP is free under its standard
"no charge" licence, which is not an open-source licence. Three.js, React Three Fiber, drei,
Next.js and Payload are MIT.
