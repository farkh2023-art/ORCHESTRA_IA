import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export interface AgentJob {
  taskId: string;
  projectId: string;
  organizationId: string;
  attempt?: number;
}

export const agentQueue = new Queue<AgentJob>("agent-tasks", {
  connection: redis,
  defaultJobOptions: { removeOnComplete: 1_000, removeOnFail: 5_000 },
});
