import type { z } from "zod";
import { runAgentTask as runAgentCore } from "@/agents/base";
import { db } from "@/lib/db";
import { AgentOutputSchemas, type CoreAgentRole } from "@/types/agents";

const SCHEMAS = AgentOutputSchemas satisfies Record<CoreAgentRole, z.ZodType<unknown>>;

export async function runAgentTask(taskId: string): Promise<unknown> {
  const task = await db.task.findUniqueOrThrow({
    where: { id: taskId },
    select: {
      agentInstance: {
        select: {
          role: true,
          agentTemplate: { select: { role: true } },
        },
      },
    },
  });

  // Official ORCHESTRA_IA routing. Task.agentSlug is legacy and must not drive execution.
  const role = task.agentInstance.role ?? task.agentInstance.agentTemplate?.role;
  if (!role) throw new Error("Role AgentInstance manquant");

  const schema = SCHEMAS[role] as z.ZodType<unknown>;
  if (!schema) throw new Error(`Agent non enregistre : ${role}`);

  return runAgentCore({ taskId, schema });
}
