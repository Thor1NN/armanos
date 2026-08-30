import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_set_logs_set_type" AS ENUM('normal', 'warmup', 'drop', 'failure');
  CREATE TABLE "body_measurements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"client_id" integer,
  	"measured_at" timestamp(3) with time zone NOT NULL,
  	"weight_kg" numeric,
  	"chest_cm" numeric,
  	"waist_cm" numeric,
  	"hip_cm" numeric,
  	"arm_cm" numeric,
  	"thigh_cm" numeric,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "set_logs" ADD COLUMN "set_type" "enum_set_logs_set_type" DEFAULT 'normal';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "body_measurements_id" integer;
  ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "body_measurements_client_idx" ON "body_measurements" USING btree ("client_id");
  CREATE INDEX "body_measurements_measured_at_idx" ON "body_measurements" USING btree ("measured_at");
  CREATE INDEX "body_measurements_updated_at_idx" ON "body_measurements" USING btree ("updated_at");
  CREATE INDEX "body_measurements_created_at_idx" ON "body_measurements" USING btree ("created_at");
  CREATE INDEX "client_measuredAt_idx" ON "body_measurements" USING btree ("client_id","measured_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_body_measurements_fk" FOREIGN KEY ("body_measurements_id") REFERENCES "public"."body_measurements"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_body_measurements_id_idx" ON "payload_locked_documents_rels" USING btree ("body_measurements_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "body_measurements" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "body_measurements" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_body_measurements_fk";
  
  DROP INDEX "payload_locked_documents_rels_body_measurements_id_idx";
  ALTER TABLE "set_logs" DROP COLUMN "set_type";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "body_measurements_id";
  DROP TYPE "public"."enum_set_logs_set_type";`)
}
