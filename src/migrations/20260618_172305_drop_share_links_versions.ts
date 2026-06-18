import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "_share_links_v_version_permissions" CASCADE;
  DROP TABLE "_share_links_v" CASCADE;
  DROP TYPE "public"."enum__share_links_v_version_permissions";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum__share_links_v_version_permissions" AS ENUM('plan', 'results');
  CREATE TABLE "_share_links_v_version_permissions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__share_links_v_version_permissions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_share_links_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_label" varchar,
  	"version_plan_id" integer NOT NULL,
  	"version_token" varchar,
  	"version_expires_at" timestamp(3) with time zone NOT NULL,
  	"version_active" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "_share_links_v_version_permissions" ADD CONSTRAINT "_share_links_v_version_permissions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_share_links_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_share_links_v" ADD CONSTRAINT "_share_links_v_parent_id_share_links_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."share_links"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_share_links_v" ADD CONSTRAINT "_share_links_v_version_plan_id_plans_id_fk" FOREIGN KEY ("version_plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_share_links_v_version_permissions_order_idx" ON "_share_links_v_version_permissions" USING btree ("order");
  CREATE INDEX "_share_links_v_version_permissions_parent_idx" ON "_share_links_v_version_permissions" USING btree ("parent_id");
  CREATE INDEX "_share_links_v_parent_idx" ON "_share_links_v" USING btree ("parent_id");
  CREATE INDEX "_share_links_v_version_version_plan_idx" ON "_share_links_v" USING btree ("version_plan_id");
  CREATE INDEX "_share_links_v_version_version_token_idx" ON "_share_links_v" USING btree ("version_token");
  CREATE INDEX "_share_links_v_version_version_updated_at_idx" ON "_share_links_v" USING btree ("version_updated_at");
  CREATE INDEX "_share_links_v_version_version_created_at_idx" ON "_share_links_v" USING btree ("version_created_at");
  CREATE INDEX "_share_links_v_created_at_idx" ON "_share_links_v" USING btree ("created_at");
  CREATE INDEX "_share_links_v_updated_at_idx" ON "_share_links_v" USING btree ("updated_at");`)
}
