import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workout_exercise_rows" ADD COLUMN "reps_left" varchar;
  ALTER TABLE "workout_exercise_rows" ADD COLUMN "reps_right" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workout_exercise_rows" DROP COLUMN "reps_left";
  ALTER TABLE "workout_exercise_rows" DROP COLUMN "reps_right";`)
}
