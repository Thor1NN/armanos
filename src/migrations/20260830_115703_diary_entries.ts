import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_diary_entries_kind" AS ENUM('meal', 'activity', 'note');
  CREATE TABLE "diary_entries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"client_id" integer,
  	"entry_date" timestamp(3) with time zone NOT NULL,
  	"kind" "enum_diary_entries_kind" DEFAULT 'meal' NOT NULL,
  	"text" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "diary_entries_id" integer;
  ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "diary_entries_client_idx" ON "diary_entries" USING btree ("client_id");
  CREATE INDEX "diary_entries_entry_date_idx" ON "diary_entries" USING btree ("entry_date");
  CREATE INDEX "diary_entries_updated_at_idx" ON "diary_entries" USING btree ("updated_at");
  CREATE INDEX "diary_entries_created_at_idx" ON "diary_entries" USING btree ("created_at");
  CREATE INDEX "client_entryDate_idx" ON "diary_entries" USING btree ("client_id","entry_date");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_diary_entries_fk" FOREIGN KEY ("diary_entries_id") REFERENCES "public"."diary_entries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_diary_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("diary_entries_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "diary_entries" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "diary_entries" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_diary_entries_fk";
  
  DROP INDEX "payload_locked_documents_rels_diary_entries_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "diary_entries_id";
  DROP TYPE "public"."enum_diary_entries_kind";`)
}
