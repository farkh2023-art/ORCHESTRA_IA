import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import type { AgentJob } from "@/lib/queue";
import { runAgentTask } from "@/lib/agents/runtime";
import { unlockDependents } from "@/lib/dispatcher";

export async function processAgentJob(job: Job<AgentJob>): Promise<unknown> {
  const { taskId } = job.data;
  const result = await runAgentTask(taskId);
  await unlockDependents(taskId);
  return result;
}

export function createAgentWorker(): Worker<AgentJob> {
  return new Worker<AgentJob>("agent-tasks", processAgentJob, {
    connection: redis,
    concurrency: 5,
  });
}
