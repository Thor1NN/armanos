import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_workout_exercise_rows_target_type" AS ENUM('repetitions', 'duration');
  ALTER TABLE "workout_exercise_rows" ADD COLUMN "target_type" "enum_workout_exercise_rows_target_type" DEFAULT 'repetitions';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workout_exercise_rows" DROP COLUMN "target_type";
  DROP TYPE "public"."enum_workout_exercise_rows_target_type";`)
}
