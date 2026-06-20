import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "exercise_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"session_id" integer NOT NULL,
  	"client_id" integer,
  	"exercise_row_id" integer NOT NULL,
  	"exercise_id" integer,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "exercise_logs_id" integer;
  ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_session_id_workout_logs_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_logs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_row_id_workout_exercise_rows_id_fk" FOREIGN KEY ("exercise_row_id") REFERENCES "public"."workout_exercise_rows"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "exercise_logs_session_idx" ON "exercise_logs" USING btree ("session_id");
  CREATE INDEX "exercise_logs_client_idx" ON "exercise_logs" USING btree ("client_id");
  CREATE INDEX "exercise_logs_exercise_row_idx" ON "exercise_logs" USING btree ("exercise_row_id");
  CREATE INDEX "exercise_logs_exercise_idx" ON "exercise_logs" USING btree ("exercise_id");
  CREATE INDEX "exercise_logs_updated_at_idx" ON "exercise_logs" USING btree ("updated_at");
  CREATE INDEX "exercise_logs_created_at_idx" ON "exercise_logs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exercise_logs_fk" FOREIGN KEY ("exercise_logs_id") REFERENCES "public"."exercise_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_exercise_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("exercise_logs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exercise_logs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "exercise_logs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_exercise_logs_fk";
  
  DROP INDEX "payload_locked_documents_rels_exercise_logs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "exercise_logs_id";`)
}
