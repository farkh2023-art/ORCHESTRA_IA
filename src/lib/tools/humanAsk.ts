import { z } from "zod";
import { db } from "@/lib/db";
import type { ToolHandler } from "@/lib/tools/types";

export const humanAskInputSchema = z.object({
  question: z.string().min(3).max(2_000),
  reason: z.string().max(1_000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export const humanAskTool: ToolHandler<z.infer<typeof humanAskInputSchema>> = {
  name: "humanAsk",
  description: "Cree un checkpoint humain HITL.",
  inputSchema: humanAskInputSchema,
  async execute(input, context) {
    if (context.taskId) {
      await db.task.update({
        where: { id: context.taskId },
        data: { status: "WAITING_HUMAN" },
      });
    }

    if (context.agentInstanceId) {
      await db.message.create({
        data: {
          agentInstanceId: context.agentInstanceId,
          taskId: context.taskId,
          role: "TOOL",
          content: input.question,
          metadata: {
            type: "HUMAN_CHECKPOINT",
            reason: input.reason,
            priority: input.priority,
            userId: context.userId,
          },
        },
      });
    }

    return {
      ok: true,
      data: {
        requiresHuman: true,
        question: input.question,
        priority: input.priority,
      },
      metadata: { taskId: context.taskId, agentInstanceId: context.agentInstanceId },
    };
  },
};
