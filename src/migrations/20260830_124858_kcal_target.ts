import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clients" ADD COLUMN "daily_kcal_target" numeric DEFAULT 2000;
  ALTER TABLE "_clients_v" ADD COLUMN "version_daily_kcal_target" numeric DEFAULT 2000;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clients" DROP COLUMN "daily_kcal_target";
  ALTER TABLE "_clients_v" DROP COLUMN "version_daily_kcal_target";`)
}
