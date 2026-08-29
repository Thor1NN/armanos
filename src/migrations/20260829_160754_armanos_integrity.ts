import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_clients_status" AS ENUM('active', 'archived');
  CREATE TYPE "public"."enum__clients_v_version_status" AS ENUM('active', 'archived');
  ALTER TABLE "clients" ADD COLUMN "status" "enum_clients_status" DEFAULT 'active' NOT NULL;
  ALTER TABLE "clients" ADD COLUMN "last_workout_at" timestamp(3) with time zone;
  ALTER TABLE "_clients_v" ADD COLUMN "version_status" "enum__clients_v_version_status" DEFAULT 'active' NOT NULL;
  ALTER TABLE "_clients_v" ADD COLUMN "version_last_workout_at" timestamp(3) with time zone;
  ALTER TABLE "workout_logs" ADD COLUMN "completed_at" timestamp(3) with time zone;
  ALTER TABLE "exercises" ADD COLUMN "archived" boolean DEFAULT false;
  CREATE INDEX "workout_logs_completed_at_idx" ON "workout_logs" USING btree ("completed_at");
  CREATE UNIQUE INDEX "session_group_roundNumber_idx" ON "round_logs" USING btree ("session_id","group_id","round_number");
  CREATE UNIQUE INDEX "session_exerciseRow_setNumber_idx" ON "set_logs" USING btree ("session_id","exercise_row_id","set_number");
  CREATE UNIQUE INDEX "session_exerciseRow_idx" ON "exercise_logs" USING btree ("session_id","exercise_row_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "workout_logs_completed_at_idx";
  DROP INDEX "session_group_roundNumber_idx";
  DROP INDEX "session_exerciseRow_setNumber_idx";
  DROP INDEX "session_exerciseRow_idx";
  ALTER TABLE "clients" DROP COLUMN "status";
  ALTER TABLE "clients" DROP COLUMN "last_workout_at";
  ALTER TABLE "_clients_v" DROP COLUMN "version_status";
  ALTER TABLE "_clients_v" DROP COLUMN "version_last_workout_at";
  ALTER TABLE "workout_logs" DROP COLUMN "completed_at";
  ALTER TABLE "exercises" DROP COLUMN "archived";
  DROP TYPE "public"."enum_clients_status";
  DROP TYPE "public"."enum__clients_v_version_status";`)
}
