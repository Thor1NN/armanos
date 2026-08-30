import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_clients_profile_gender" AS ENUM('male', 'female', 'other');
  CREATE TYPE "public"."enum_clients_profile_goal" AS ENUM('build_muscle', 'gain_strength', 'fat_loss');
  CREATE TYPE "public"."enum_clients_profile_experience" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum__clients_v_version_profile_gender" AS ENUM('male', 'female', 'other');
  CREATE TYPE "public"."enum__clients_v_version_profile_goal" AS ENUM('build_muscle', 'gain_strength', 'fat_loss');
  CREATE TYPE "public"."enum__clients_v_version_profile_experience" AS ENUM('beginner', 'intermediate', 'advanced');
  ALTER TABLE "clients" ADD COLUMN "profile_gender" "enum_clients_profile_gender";
  ALTER TABLE "clients" ADD COLUMN "profile_birth_date" timestamp(3) with time zone;
  ALTER TABLE "clients" ADD COLUMN "profile_height_cm" numeric;
  ALTER TABLE "clients" ADD COLUMN "profile_goal" "enum_clients_profile_goal";
  ALTER TABLE "clients" ADD COLUMN "profile_experience" "enum_clients_profile_experience";
  ALTER TABLE "clients" ADD COLUMN "onboarded_at" timestamp(3) with time zone;
  ALTER TABLE "_clients_v" ADD COLUMN "version_profile_gender" "enum__clients_v_version_profile_gender";
  ALTER TABLE "_clients_v" ADD COLUMN "version_profile_birth_date" timestamp(3) with time zone;
  ALTER TABLE "_clients_v" ADD COLUMN "version_profile_height_cm" numeric;
  ALTER TABLE "_clients_v" ADD COLUMN "version_profile_goal" "enum__clients_v_version_profile_goal";
  ALTER TABLE "_clients_v" ADD COLUMN "version_profile_experience" "enum__clients_v_version_profile_experience";
  ALTER TABLE "_clients_v" ADD COLUMN "version_onboarded_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clients" DROP COLUMN "profile_gender";
  ALTER TABLE "clients" DROP COLUMN "profile_birth_date";
  ALTER TABLE "clients" DROP COLUMN "profile_height_cm";
  ALTER TABLE "clients" DROP COLUMN "profile_goal";
  ALTER TABLE "clients" DROP COLUMN "profile_experience";
  ALTER TABLE "clients" DROP COLUMN "onboarded_at";
  ALTER TABLE "_clients_v" DROP COLUMN "version_profile_gender";
  ALTER TABLE "_clients_v" DROP COLUMN "version_profile_birth_date";
  ALTER TABLE "_clients_v" DROP COLUMN "version_profile_height_cm";
  ALTER TABLE "_clients_v" DROP COLUMN "version_profile_goal";
  ALTER TABLE "_clients_v" DROP COLUMN "version_profile_experience";
  ALTER TABLE "_clients_v" DROP COLUMN "version_onboarded_at";
  DROP TYPE "public"."enum_clients_profile_gender";
  DROP TYPE "public"."enum_clients_profile_goal";
  DROP TYPE "public"."enum_clients_profile_experience";
  DROP TYPE "public"."enum__clients_v_version_profile_gender";
  DROP TYPE "public"."enum__clients_v_version_profile_goal";
  DROP TYPE "public"."enum__clients_v_version_profile_experience";`)
}
