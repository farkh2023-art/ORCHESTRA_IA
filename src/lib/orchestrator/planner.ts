import type { AgentInstance, AgentRole, AgentSlug, Prisma, Task } from "@prisma/client";
import { db } from "@/lib/db";
import { CORE_AGENT_ROLES } from "@/lib/orchestrator/recruiter";

type PlannedTask = {
  role: AgentRole;
  dependsOnRoles: AgentRole[];
  objective: string;
};

const MINIMAL_DAG: PlannedTask[] = [
  { role: "COORDINATOR", dependsOnRoles: [], objective: "Structurer le brief projet." },
  { role: "ANALYST", dependsOnRoles: ["COORDINATOR"], objective: "Analyser le brief structure." },
  { role: "ARCHITECT", dependsOnRoles: ["ANALYST"], objective: "Proposer l'architecture cible." },
  { role: "RESEARCHER", dependsOnRoles: ["ANALYST"], objective: "Compiler les recherches utiles." },
  { role: "WRITER", dependsOnRoles: ["ARCHITECT", "RESEARCHER"], objective: "Rediger le rapport." },
  { role: "CRITIC", dependsOnRoles: ["WRITER"], objective: "Valider la qualite du rapport." },
  { role: "INTEGRATOR", dependsOnRoles: ["CRITIC"], objective: "Assembler le livrable final." },
];

function requireInstance(
  instances: AgentInstance[],
  role: AgentRole
): AgentInstance {
  const instance = instances.find((candidate) => candidate.role === role);
  if (!instance) throw new Error(`AgentInstance manquante pour ${role}`);
  return instance;
}

export async function createMinimalDag(projectId: string): Promise<Task[]> {
  const existing = await db.task.findMany({
    where: { agentInstance: { projectId } },
    orderBy: { createdAt: "asc" },
  });
  if (existing.length > 0) return existing;

  const instances = await db.agentInstance.findMany({
    where: { projectId, role: { in: [...CORE_AGENT_ROLES] } },
  });

  const createdByRole = new Map<AgentRole, Task>();
  for (const planned of MINIMAL_DAG) {
    const instance = requireInstance(instances, planned.role);
    const dependsOn = planned.dependsOnRoles.map((role) => {
      const dependency = createdByRole.get(role);
      if (!dependency) throw new Error(`Dependance non creee pour ${role}`);
      return dependency.id;
    });

    const task = await db.task.create({
      data: {
        agentInstanceId: instance.id,
        // Legacy Task.agentSlug is still required by the current Prisma model.
        // Runtime routing uses AgentInstance.role / AgentTemplate.role.
        agentSlug: planned.role as AgentSlug,
        status: "PENDING",
        dependsOn,
        input: {
          projectId,
          role: planned.role,
          objective: planned.objective,
        } satisfies Prisma.InputJsonValue,
      },
    });
    createdByRole.set(planned.role, task);
  }

  return [...createdByRole.values()];
}
