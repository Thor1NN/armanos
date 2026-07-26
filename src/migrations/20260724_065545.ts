import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "set_logs" ADD COLUMN "weight_left" numeric;
  ALTER TABLE "set_logs" ADD COLUMN "weight_right" numeric;
  ALTER TABLE "set_logs" ADD COLUMN "reps_left" varchar;
  ALTER TABLE "set_logs" ADD COLUMN "reps_right" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "set_logs" DROP COLUMN "weight_left";
  ALTER TABLE "set_logs" DROP COLUMN "weight_right";
  ALTER TABLE "set_logs" DROP COLUMN "reps_left";
  ALTER TABLE "set_logs" DROP COLUMN "reps_right";`)
}
