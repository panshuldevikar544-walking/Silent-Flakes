import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_books_motif" AS ENUM('none', 'leaves', 'snow');
  ALTER TABLE "books" ADD COLUMN "page_colour" varchar;
  ALTER TABLE "books" ADD COLUMN "accent_colour" varchar;
  ALTER TABLE "books" ADD COLUMN "motif" "enum_books_motif" DEFAULT 'none';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "books" DROP COLUMN "page_colour";
  ALTER TABLE "books" DROP COLUMN "accent_colour";
  ALTER TABLE "books" DROP COLUMN "motif";
  DROP TYPE "public"."enum_books_motif";`)
}
