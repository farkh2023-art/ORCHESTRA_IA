CREATE TYPE "AgentRole" AS ENUM (
  'COORDINATOR',
  'ANALYST',
  'ARCHITECT',
  'RESEARCHER',
  'WRITER',
  'CRITIC',
  'INTEGRATOR'
);

ALTER TABLE "AgentTemplate" ADD COLUMN "role" "AgentRole";

UPDATE "AgentTemplate"
SET "role" = "slug"::text::"AgentRole";

ALTER TABLE "AgentTemplate" ALTER COLUMN "role" SET NOT NULL;

CREATE UNIQUE INDEX "AgentTemplate_role_key" ON "AgentTemplate"("role");

ALTER TABLE "AgentInstance" DROP CONSTRAINT IF EXISTS "AgentInstance_role_fkey";
ALTER TABLE "AgentInstance" ALTER COLUMN "role" TYPE "AgentRole" USING "role"::text::"AgentRole";

ALTER TABLE "AgentInstance"
  ADD CONSTRAINT "AgentInstance_role_fkey"
  FOREIGN KEY ("role") REFERENCES "AgentTemplate"("role")
  ON DELETE SET NULL ON UPDATE CASCADE;
