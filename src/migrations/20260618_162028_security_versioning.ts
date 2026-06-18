import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum__plans_v_version_status" AS ENUM('active', 'paused', 'completed');
  CREATE TYPE "public"."enum__share_links_v_version_permissions" AS ENUM('plan', 'results');
  CREATE TABLE "_clients_v_version_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "_clients_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_email" varchar NOT NULL,
  	"version_reset_password_token" varchar,
  	"version_reset_password_expiration" timestamp(3) with time zone,
  	"version_salt" varchar,
  	"version_hash" varchar,
  	"version_login_attempts" numeric DEFAULT 0,
  	"version_lock_until" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_plans_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_client_id" integer,
  	"version_status" "enum__plans_v_version_status" DEFAULT 'active',
  	"version_start_date" timestamp(3) with time zone,
  	"version_end_date" timestamp(3) with time zone,
  	"version_title" varchar NOT NULL,
  	"version_description" varchar,
  	"version_source" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
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
  
  ALTER TABLE "_clients_v_version_sessions" ADD CONSTRAINT "_clients_v_version_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_clients_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clients_v" ADD CONSTRAINT "_clients_v_parent_id_clients_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_plans_v" ADD CONSTRAINT "_plans_v_parent_id_plans_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_plans_v" ADD CONSTRAINT "_plans_v_version_client_id_clients_id_fk" FOREIGN KEY ("version_client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_share_links_v_version_permissions" ADD CONSTRAINT "_share_links_v_version_permissions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_share_links_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_share_links_v" ADD CONSTRAINT "_share_links_v_parent_id_share_links_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."share_links"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_share_links_v" ADD CONSTRAINT "_share_links_v_version_plan_id_plans_id_fk" FOREIGN KEY ("version_plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_clients_v_version_sessions_order_idx" ON "_clients_v_version_sessions" USING btree ("_order");
  CREATE INDEX "_clients_v_version_sessions_parent_id_idx" ON "_clients_v_version_sessions" USING btree ("_parent_id");
  CREATE INDEX "_clients_v_parent_idx" ON "_clients_v" USING btree ("parent_id");
  CREATE INDEX "_clients_v_version_version_updated_at_idx" ON "_clients_v" USING btree ("version_updated_at");
  CREATE INDEX "_clients_v_version_version_created_at_idx" ON "_clients_v" USING btree ("version_created_at");
  CREATE INDEX "_clients_v_version_version_email_idx" ON "_clients_v" USING btree ("version_email");
  CREATE INDEX "_clients_v_created_at_idx" ON "_clients_v" USING btree ("created_at");
  CREATE INDEX "_clients_v_updated_at_idx" ON "_clients_v" USING btree ("updated_at");
  CREATE INDEX "_plans_v_parent_idx" ON "_plans_v" USING btree ("parent_id");
  CREATE INDEX "_plans_v_version_version_client_idx" ON "_plans_v" USING btree ("version_client_id");
  CREATE INDEX "_plans_v_version_version_updated_at_idx" ON "_plans_v" USING btree ("version_updated_at");
  CREATE INDEX "_plans_v_version_version_created_at_idx" ON "_plans_v" USING btree ("version_created_at");
  CREATE INDEX "_plans_v_created_at_idx" ON "_plans_v" USING btree ("created_at");
  CREATE INDEX "_plans_v_updated_at_idx" ON "_plans_v" USING btree ("updated_at");
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

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "_clients_v_version_sessions" CASCADE;
  DROP TABLE "_clients_v" CASCADE;
  DROP TABLE "_plans_v" CASCADE;
  DROP TABLE "_share_links_v_version_permissions" CASCADE;
  DROP TABLE "_share_links_v" CASCADE;
  DROP TYPE "public"."enum__plans_v_version_status";
  DROP TYPE "public"."enum__share_links_v_version_permissions";`)
}
