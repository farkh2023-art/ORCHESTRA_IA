ALTER TABLE "AgentInstance" ADD COLUMN "role" "AgentSlug";

CREATE INDEX "AgentInstance_role_idx" ON "AgentInstance"("role");

ALTER TABLE "AgentInstance"
  ADD CONSTRAINT "AgentInstance_role_fkey"
  FOREIGN KEY ("role") REFERENCES "AgentTemplate"("slug")
  ON DELETE SET NULL ON UPDATE CASCADE;
