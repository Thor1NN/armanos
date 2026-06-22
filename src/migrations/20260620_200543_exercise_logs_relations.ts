import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exercise_logs" ADD COLUMN "exercise_name" varchar;
  ALTER TABLE "exercise_logs" ADD COLUMN "round_log_id" integer;
  ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_round_log_id_round_logs_id_fk" FOREIGN KEY ("round_log_id") REFERENCES "public"."round_logs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "exercise_logs_round_log_idx" ON "exercise_logs" USING btree ("round_log_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exercise_logs" DROP CONSTRAINT "exercise_logs_round_log_id_round_logs_id_fk";
  
  DROP INDEX "exercise_logs_round_log_idx";
  ALTER TABLE "exercise_logs" DROP COLUMN "exercise_name";
  ALTER TABLE "exercise_logs" DROP COLUMN "round_log_id";`)
}
