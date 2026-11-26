import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Turns on the falling autumn leaves for A Heart Rewritten on the live site. Only fills the
// setting while it is still empty, so a choice made in the admin is never overwritten.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "books" SET "motif" = 'leaves'
  WHERE "slug" = 'a-heart-rewritten' AND ("motif" IS NULL OR "motif" = 'none');`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  UPDATE "books" SET "motif" = 'none' WHERE "slug" = 'a-heart-rewritten' AND "motif" = 'leaves';`)
}
