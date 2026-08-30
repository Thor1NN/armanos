import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "diary_entries_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"food_id" integer,
  	"name" varchar,
  	"grams" numeric NOT NULL,
  	"kcal_per100g" numeric,
  	"kcal" numeric
  );
  
  CREATE TABLE "foods" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"kcal_per100g" numeric NOT NULL,
  	"protein_per100g" numeric,
  	"carbs_per100g" numeric,
  	"fat_per100g" numeric,
  	"archived" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "diary_entries" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "diary_entries" ADD COLUMN "total_kcal" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "foods_id" integer;
  ALTER TABLE "diary_entries_items" ADD CONSTRAINT "diary_entries_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "diary_entries_items" ADD CONSTRAINT "diary_entries_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."diary_entries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "diary_entries_items_order_idx" ON "diary_entries_items" USING btree ("_order");
  CREATE INDEX "diary_entries_items_parent_id_idx" ON "diary_entries_items" USING btree ("_parent_id");
  CREATE INDEX "diary_entries_items_food_idx" ON "diary_entries_items" USING btree ("food_id");
  CREATE UNIQUE INDEX "foods_name_idx" ON "foods" USING btree ("name");
  CREATE INDEX "foods_updated_at_idx" ON "foods" USING btree ("updated_at");
  CREATE INDEX "foods_created_at_idx" ON "foods" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_foods_fk" FOREIGN KEY ("foods_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_foods_id_idx" ON "payload_locked_documents_rels" USING btree ("foods_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "diary_entries_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "foods" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "diary_entries_items" CASCADE;
  DROP TABLE "foods" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_foods_fk";
  
  DROP INDEX "payload_locked_documents_rels_foods_id_idx";
  ALTER TABLE "diary_entries" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "diary_entries" DROP COLUMN "total_kcal";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "foods_id";`)
}
