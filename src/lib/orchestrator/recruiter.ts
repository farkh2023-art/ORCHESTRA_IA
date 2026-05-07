import type { AgentInstance, AgentRole } from "@prisma/client";
import { db } from "@/lib/db";

export const CORE_AGENT_ROLES = [
  "COORDINATOR",
  "ANALYST",
  "ARCHITECT",
  "RESEARCHER",
  "WRITER",
  "CRITIC",
  "INTEGRATOR",
] as const satisfies readonly AgentRole[];

export async function recruitCoreAgents(projectId: string): Promise<AgentInstance[]> {
  const templates = await db.agentTemplate.findMany({
    where: { role: { in: [...CORE_AGENT_ROLES] }, isActive: true },
    orderBy: { pipelineOrder: "asc" },
  });

  const existing = await db.agentInstance.findMany({
    where: { projectId, role: { in: [...CORE_AGENT_ROLES] } },
  });
  const existingRoles = new Set(existing.map((instance) => instance.role).filter(Boolean));

  const missing = templates.filter((template) => !existingRoles.has(template.role));
  if (missing.length > 0) {
    await db.agentInstance.createMany({
      data: missing.map((template) => ({
        projectId,
        role: template.role,
        status: "PENDING" as const,
      })),
    });
  }

  return db.agentInstance.findMany({
    where: { projectId, role: { in: [...CORE_AGENT_ROLES] } },
    orderBy: { agentTemplate: { pipelineOrder: "asc" } },
  });
}
