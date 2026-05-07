import type { z } from "zod";
import { runAgentTask as runAgentCore } from "@/agents/base";
import { db } from "@/lib/db";
import { AnalysisReportSchema } from "@/types/agents";

const SCHEMAS: Partial<Record<string, z.ZodType<unknown>>> = {
  ANALYST: AnalysisReportSchema as z.ZodType<unknown>,
};

export async function runAgentTask(taskId: string): Promise<unknown> {
  const { agentSlug } = await db.task.findUniqueOrThrow({
    where: { id: taskId },
    select: { agentSlug: true },
  });

  const schema = SCHEMAS[agentSlug];
  if (!schema) throw new Error(`Agent non enregistré : ${agentSlug}`);

  return runAgentCore({ taskId, schema });
}
