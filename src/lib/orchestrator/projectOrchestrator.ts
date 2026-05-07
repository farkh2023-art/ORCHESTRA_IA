import type { Prisma, Project, ProjectSpec } from "@prisma/client";
import { db } from "@/lib/db";
import { dispatchReadyTasks } from "@/lib/dispatcher";
import { CreateProjectSchema, type CreateProjectInput } from "@/types/agents";
import { buildProjectSpecContent } from "@/lib/orchestrator/intake";
import { createMinimalDag } from "@/lib/orchestrator/planner";
import { recruitCoreAgents } from "@/lib/orchestrator/recruiter";

export async function createProjectWithSpec(
  input: CreateProjectInput
): Promise<{ project: Project; spec: ProjectSpec }> {
  const parsed = CreateProjectSchema.parse(input);
  const specContent = buildProjectSpecContent(parsed);

  const project = await db.project.create({
    data: {
      title: parsed.title,
      brief: parsed.brief,
      organizationId: parsed.organizationId,
      metadata: parsed.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  const spec = await db.projectSpec.create({
    data: {
      projectId: project.id,
      version: 1,
      content: specContent as Prisma.InputJsonValue,
    },
  });

  return { project, spec };
}

export async function approveProjectSpec(projectId: string) {
  const agents = await recruitCoreAgents(projectId);
  const tasks = await createMinimalDag(projectId);
  return { agents, tasks };
}

export async function approveExecutionPlan(projectId: string): Promise<string[]> {
  return dispatchReadyTasks(projectId);
}
