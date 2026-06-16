import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_share_links_permissions" AS ENUM('plan', 'results');
  CREATE TABLE "share_links_permissions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_share_links_permissions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "share_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"plan_id" integer NOT NULL,
  	"token" varchar,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "share_links_id" integer;
  ALTER TABLE "share_links_permissions" ADD CONSTRAINT "share_links_permissions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."share_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "share_links" ADD CONSTRAINT "share_links_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "share_links_permissions_order_idx" ON "share_links_permissions" USING btree ("order");
  CREATE INDEX "share_links_permissions_parent_idx" ON "share_links_permissions" USING btree ("parent_id");
  CREATE INDEX "share_links_plan_idx" ON "share_links" USING btree ("plan_id");
  CREATE UNIQUE INDEX "share_links_token_idx" ON "share_links" USING btree ("token");
  CREATE INDEX "share_links_updated_at_idx" ON "share_links" USING btree ("updated_at");
  CREATE INDEX "share_links_created_at_idx" ON "share_links" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_share_links_fk" FOREIGN KEY ("share_links_id") REFERENCES "public"."share_links"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_share_links_id_idx" ON "payload_locked_documents_rels" USING btree ("share_links_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "share_links_permissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "share_links" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "share_links_permissions" CASCADE;
  DROP TABLE "share_links" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_share_links_fk";
  
  DROP INDEX "payload_locked_documents_rels_share_links_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "share_links_id";
  DROP TYPE "public"."enum_share_links_permissions";`)
}
